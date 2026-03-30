import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../services/paystack.service.js";

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
      amount: Math.round(Number(order.pricing.totalAmount) * 100), // Kobo
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

    // Recheck stock before confirming payment
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

    // Deduct stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      product.stock -= item.quantity;
      await product.save();
    }

    // Update order
    order.paymentStatus = "paid";
    order.paymentReference = reference;
    order.paidAt = new Date();
    order.orderStatus = "confirmed";
    await order.save();

    // Clear cart after successful payment
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalItems: 0, totalPrice: 0 }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
      nextStep: "Create shipment with RedStar",
    });
  } catch (error) {
    next(error);
  }
};

