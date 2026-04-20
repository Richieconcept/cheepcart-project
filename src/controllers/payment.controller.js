import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import crypto from "crypto";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../services/paystack.service.js";
import { createRedstarShipment } from "../services/redstar.service.js";
import { buildShipmentPayload } from "./shipment.controller.js";
import { sendPaymentSuccessEmail } from "../utils/notifications.js";



// ========================== INITIALIZE ORDER PAYMENT ==========================
export const initializeOrderPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid for",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be paid for",
      });
    }

    const reference = `PAY-${order.orderNumber}-${Date.now()}`;

    const paystackResponse = await initializePaystackPayment({
      email: order.customerEmail,
      amount: Math.round(Number(order.pricing.totalAmount) * 100),
      reference,
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: req.user._id.toString(),
        custom_fields: [
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: order.orderNumber,
          },
        ],
      },
    });

    order.paymentStatus = "pending";
    order.paymentReference = paystackResponse?.data?.reference || reference;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      payment: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        reference: order.paymentReference,
        amount: order.pricing.totalAmount,
        authorizationUrl: paystackResponse?.data?.authorization_url,
        accessCode: paystackResponse?.data?.access_code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========================== VERIFY ORDER PAYMENT ==========================
export const verifyOrderPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    const paystackResponse = await verifyPaystackPayment(reference);
    const paymentData = paystackResponse?.data;

    if (!paymentData) {
      return res.status(400).json({
        success: false,
        message: "Unable to verify payment",
      });
    }

    const orderId = paymentData?.metadata?.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order metadata missing from payment",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order payment already verified",
        order,
      });
    }

    const paidAmount = Number(paymentData.amount) / 100;

    if (paymentData.status !== "success") {
      order.paymentStatus = "failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
      });
    }

    if (paidAmount !== Number(order.pricing.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Paid amount does not match order total",
      });
    }

    // ================= STOCK VALIDATION =================
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${item.name} is no longer available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        });
      }
    }

    // ================= DEDUCT STOCK =================
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      product.stock -= item.quantity;
      await product.save();
    }

    // ================= UPDATE ORDER =================
    order.paymentStatus = "paid";
    order.paymentReference = reference;
    order.paidAt = new Date();
    order.orderStatus = "confirmed";
    await order.save();

       // ✅ SEND EMAIL HERE
    await sendPaymentSuccessEmail(order, req.user);

    // ================= CLEAR CART =================
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalItems: 0, totalPrice: 0 }
    );

    // ================= AUTO CREATE SHIPMENT =================
    try {
      const payload = {
        senderCity: "Asaba",
        senderTownID: Number(process.env.REDSTAR_SENDER_TOWN_ID),

        senderName: "CHEEPCART",
        senderPhone: "08000000000",
        senderAddress: process.env.SENDER_ADDRESS,

        recipientCity: "Asaba",
        recipientTownID: Number(order.shippingAddress.redstarTownId),

        recipientName: order.shippingAddress.fullName,
        recipientPhoneNo: order.shippingAddress.phone,
        recipientEmail: order.shippingAddress.email,
        recipientAddress: order.shippingAddress.addressLine1,
        recipientState: order.shippingAddress.state,

        orderNo: order.orderNumber,

        deliveryType: "Express Delivery",
        description: "E-commerce order",

        paymentType: "Prepaid",
        pickupType: order.meta.pickupType,

        weight: order.meta.totalWeight,
        pieces: order.meta.totalItems,

        cashOnDelivery: 0,
        shipmentItems: [],
      };

      const shipmentResponse = await createRedstarShipment(payload);

      if (shipmentResponse?.TransStatus !== "Successful") {
        order.shipmentStatus = "failed";
      } else {
        order.shipmentStatus = "created";

         order.deliveryStatus = "pending"; // ✅ ADD
        order.orderStatus = "processing"; // ✅ ADD

        order.shipmentReference = shipmentResponse?.OrderNo || null;

        order.trackingNumber =
          shipmentResponse?.WaybillNumber &&
          shipmentResponse?.WaybillNumber !== "N/A"
            ? shipmentResponse.WaybillNumber
            : null;

        order.shipmentCreatedAt = new Date();
      }

      await order.save();

    } catch (shipmentError) {
      order.shipmentStatus = "failed";
      await order.save();
    }

    // ================= FINAL RESPONSE =================
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
      shipment:
        order.shipmentStatus === "created"
          ? {
              trackingNumber: order.trackingNumber,
              shipmentStatus: order.shipmentStatus,
              shipmentReference: order.shipmentReference,
              createdAt: order.shipmentCreatedAt,
            }
          : {
              shipmentStatus: "failed",
            },
    });

  } catch (error) {
    next(error);
  }
};


// ============== PAYSTACK WEBHOOK ===========================
export const handlePaystackWebhook = async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    const signature = req.headers["x-paystack-signature"];

    if (hash !== signature) {
      console.log("❌ Invalid signature");
      return res.status(401).send("Invalid signature");
    }

    console.log("✅ Signature verified");

    const event = JSON.parse(req.body.toString());
    console.log("📡 Event received:", event.event);

    // 🔥 ONLY HANDLE SUCCESS PAYMENT
    if (event.event === "charge.success") {
      console.log("💰 Payment success webhook received");

      const paymentData = event.data;
      const reference = paymentData.reference;

      let order = await Order.findOne({
        paymentReference: reference,
      });

      if (!order) {
        console.log("❌ Order not found:", reference);
        return res.sendStatus(200);
      }

      // prevent duplicate processing
      if (order.paymentStatus === "paid") {
        console.log("⚠️ Order already processed");
        return res.sendStatus(200);
      }

      const paidAmount = Number(paymentData.amount) / 100;

      if (paidAmount !== Number(order.pricing.totalAmount)) {
        console.log("❌ Amount mismatch");
        return res.sendStatus(200);
      }

      // ================= STOCK VALIDATION =================
      for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product || !product.isActive || product.stock < item.quantity) {
          console.log("❌ Stock issue for:", item.name);
          return res.sendStatus(200);
        }
      }

      // ================= DEDUCT STOCK =================
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        product.stock -= item.quantity;
        await product.save();
      }

      // ================= UPDATE ORDER =================
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      order.orderStatus = "confirmed";

      await order.save();

           // ✅ FETCH USER + SEND EMAIL
      const user = await User.findById(order.user);
      await sendPaymentSuccessEmail(order, user);


      // ================= CLEAR CART =================
      await Cart.findOneAndUpdate(
        { user: order.user },
        { items: [], totalItems: 0, totalPrice: 0 }
      );

      // ================= CREATE SHIPMENT =================
      try {
        const payload = {
        senderCity: "Asaba",
        senderTownID: Number(process.env.REDSTAR_SENDER_TOWN_ID),

        senderName: "CHEEPCART",
        senderPhone: "08000000000",
        senderAddress: process.env.SENDER_ADDRESS,

        recipientCity: "Asaba",
        recipientTownID: Number(order.shippingAddress.redstarTownId),

        recipientName: order.shippingAddress.fullName,
        recipientPhoneNo: order.shippingAddress.phone,
        recipientEmail: order.shippingAddress.email,
        recipientAddress: order.shippingAddress.addressLine1,
        recipientState: order.shippingAddress.state,

        orderNo: order.orderNumber,

        deliveryType: "Express Delivery",
        description: "E-commerce order",

        paymentType: "Prepaid",
        pickupType: order.meta.pickupType,

        weight: order.meta.totalWeight,
        pieces: order.meta.totalItems,

        cashOnDelivery: 0,
        shipmentItems: [],
        };

        console.log("📦 WEBHOOK PAYLOAD:");
        console.log(JSON.stringify(payload, null, 2));

        const shipmentResponse = await createRedstarShipment(payload);

        console.log("🚚 REDSTAR RESPONSE:");
        console.log(JSON.stringify(shipmentResponse, null, 2));

        if (shipmentResponse?.TransStatus !== "Successful") {
          console.log("❌ Shipment failed");
          order.shipmentStatus = "failed";
        } else {
          console.log("✅ Shipment created successfully");

          order.shipmentStatus = "created";
          order.deliveryStatus = "pending";
          order.orderStatus = "processing";

          order.shipmentReference = shipmentResponse?.OrderNo || null;

          order.trackingNumber =
            shipmentResponse?.WaybillNumber &&
            shipmentResponse?.WaybillNumber !== "N/A"
              ? shipmentResponse.WaybillNumber
              : null;

          order.shipmentCreatedAt = new Date();
        }

        await order.save();

      } catch (err) {
        console.log("🚨 WEBHOOK SHIPMENT ERROR");
        console.log("Status:", err.response?.status);
        console.log("Data:", JSON.stringify(err.response?.data, null, 2));
        console.log("Message:", err.message);

        order.shipmentStatus = "failed";
        await order.save();
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log("WEBHOOK ERROR:", error.message);
    return res.sendStatus(200);
  }
};