
// controllers/order.controller.js
import Cart from "../models/cart.model.js";
import Address from "../models/address.model.js";
import Order from "../models/order.model.js"
import Product from "../models/product.model.js";
import { calculateRedstarDeliveryFee } from "../services/redstar.service.js";
import { sendAbandonedOrderEmail } from "../utils/notifications.js";

// ========================== CREATE ORDER ==========================
export const createOrder = async (req, res, next) => {
  try {
    const {
      shipToDifferentAddress = false,
      billingAddress,
      shippingAddress,
      recipientCity,
      recipientTownID,
    } = req.body;

    if (!billingAddress) {
      return res.status(400).json({
        success: false,
        message: "Billing address is required",
      });
    }

    if (!recipientCity || !recipientTownID) {
      return res.status(400).json({
        success: false,
        message: "recipientCity and recipientTownID are required",
      });
    }

    const finalShippingAddress = shipToDifferentAddress ? shippingAddress : billingAddress;

    if (!finalShippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    if (
      !finalShippingAddress.fullName ||
      !finalShippingAddress.phone ||
      !finalShippingAddress.addressLine1 ||
      !finalShippingAddress.redstarCityAbbr ||
      !finalShippingAddress.redstarTownId
    ) {
      return res.status(400).json({
        success: false,
        message: "Shipping address must include fullName, phone, addressLine1, redstarCityAbbr and redstarTownId",
      });
    }

    // prevent duplicate unpaid pending orders
    const existingPendingOrder = await Order.findOne({
      user: req.user._id,
      paymentStatus: "unpaid",
      orderStatus: "pending",
    }).sort({ createdAt: -1 });

    if (existingPendingOrder) {
      return res.status(200).json({
        success: true,
        message: "You already have a pending unpaid order",
        order: existingPendingOrder,
        hasPendingOrder: true,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name slug price images stock weight isActive"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let subtotal = 0;
    let totalWeight = 0;
    let unavailableItems = [];
    let validatedItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive || product.stock < item.quantity) {
        unavailableItems.push({
          productId: product?._id || item.product,
          name: product?.name || "Unknown Product",
        });
        continue;
      }

      const itemSubtotal = product.price * item.quantity;
      const itemWeight = (product.weight || 0) * item.quantity;

      subtotal += itemSubtotal;
      totalWeight += itemWeight;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.secure_url || "",
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        weight: itemWeight,
      });
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items are unavailable or out of stock",
        unavailableItems,
      });
    }

    if (totalWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to create order because product weight is missing",
      });
    }

    const senderCity = process.env.REDSTAR_SENDER_CITY || "ASB";
    const senderTownID = Number(process.env.REDSTAR_SENDER_TOWN_ID) || 480;
    const pickupType = Number(process.env.REDSTAR_PICKUP_TYPE) || 1;

    const redstarResponse = await calculateRedstarDeliveryFee({
      senderCity,
      recipientCity: recipientCity.trim().toUpperCase(),
      recipientTownID: Number(recipientTownID),
      senderTownID,
      pickupType,
      weight: Number(totalWeight),
    });

    const deliveryFee =
      redstarResponse?.DeliveryFee ??
      redstarResponse?.deliveryFee ??
      redstarResponse?.amount ??
      redstarResponse?.TotalAmount ??
      redstarResponse?.totalAmount ??
      redstarResponse?.price ??
      0;

    const vatAmount = redstarResponse?.VatAmount ?? 0;
    const shippingTotal = redstarResponse?.TotalAmount ?? deliveryFee;
    const totalAmount = subtotal + Number(shippingTotal);

    const existingBillingAddress = await Address.findOne({
      user: req.user._id,
      isBillingAddress: true,
    });

    if (!existingBillingAddress) {
      const newBillingAddress = new Address({
        user: req.user._id,
        ...billingAddress,
        isBillingAddress: true,
      });
      await newBillingAddress.save();
    }

    const order = await Order.create({
      
      user: req.user._id,
      customerEmail: req.user.email,
      items: validatedItems,
      pricing: {
        subtotal,
        deliveryFee: Number(deliveryFee),
        vatAmount: Number(vatAmount),
        shippingTotal: Number(shippingTotal),
        totalAmount: Number(totalAmount),
      },
      billingAddress,
      shippingAddress: finalShippingAddress,
      meta: {
        totalItems: cart.totalItems,
        totalWeight,
        pickupType,
        senderCity,
        senderTownID,
        recipientCity: recipientCity.trim().toUpperCase(),
        recipientTownID: Number(recipientTownID),
        shipToDifferentAddress,
      },
      paymentStatus: "unpaid",
      paymentMethod: "paystack",
      orderStatus: "pending",
      shipmentStatus: "not_created",
    });


    // ================= ABANDONED ORDER EMAIL =================
    setTimeout(async () => {
      try {
        const freshOrder = await Order.findById(order._id);

        if (
          freshOrder &&
          freshOrder.paymentStatus === "unpaid" &&
          freshOrder.orderStatus === "pending"
        ) {
          console.log("📩 Sending abandoned order email");

          await sendAbandonedOrderEmail(freshOrder, req.user);
        }
      } catch (err) {
        console.log("❌ Abandoned email error:", err.message);
      }
    }, 1000 * 10);  // 15 minutes


    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        shipmentStatus: order.shipmentStatus,
        pricing: order.pricing,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        items: order.items,
        meta: order.meta,
        createdAt: order.createdAt,
      },
      paymentReady: true,
      hasPendingOrder: false,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== GET MY PENDING ORDER ==========================
export const getMyPendingOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      user: req.user._id,
      paymentStatus: "unpaid",
      orderStatus: "pending",
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No pending unpaid order found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== GET MY ORDERS ==========================
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== GET SINGLE ORDER ==========================
export const getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};


// ========================== CANCEL PENDING ORDER ==========================
export const cancelPendingOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find the order and check if it's unpaid and pending
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    console.log('Order:', order); // Debug log to inspect order data

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "unpaid") {
      return res.status(400).json({
        success: false,
        message: "Only unpaid orders can be cancelled",
      });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    // Mark the order as cancelled
    order.orderStatus = "cancelled";
    await order.save();

    // Restore stock for each item in the order
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;  // Add the quantity back to the stock
        await product.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully and stock restored",
      order,
    });
  } catch (error) {
    next(error);
  }
};


// ========================== DELETE CANCELED ORDER ==========================
export const deleteCanceledOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      orderStatus: "cancelled",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not cancelled",
      });
    }

    await Order.deleteOne({ _id: orderId });

    return res.status(200).json({
      success: true,
      message: "Canceled order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};



// ========================== ADMIN: GET ALL ORDERS ==========================
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const {
      paymentStatus,
      shipmentStatus,
      orderStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (shipmentStatus) filter.shipmentStatus = shipmentStatus;
    if (orderStatus) filter.orderStatus = orderStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(filter)
      .populate("user", "name email phone") // 🔥 IMPORTANT
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders: orders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,

        customer: {
          name: order.user?.name,
          email: order.customerEmail,
          phone: order.user?.phone,
        },

        paymentStatus: order.paymentStatus,
        shipmentStatus: order.shipmentStatus,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,

        totalAmount: order.pricing.totalAmount,

        trackingNumber: order.trackingNumber || null,

        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};