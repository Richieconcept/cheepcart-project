import Order from "../models/order.model.js";
import { createRedstarShipment, trackRedstarShipment } from "../services/redstar.service.js";
import { mapToAppStatus } from "../utils/shipmentStatusMapper.js";
import { mapDeliveryToOrderStatus } from "../utils/statusMapper.js";

// ================= BUILD PAYLOAD =================
export  const buildShipmentPayload = (order) => {
  return {
    senderCity: "Asaba",
    senderTownID: Number(process.env.REDSTAR_SENDER_TOWN_ID),

    senderName: process.env.SENDER_NAME,
    senderAddress: process.env.SENDER_ADDRESS,
    senderPhone: process.env.SENDER_PHONE,

    recipientCity: "Asaba",
    recipientTownID: Number(order.shippingAddress.redstarTownId),

    recipientName: order.shippingAddress.fullName,
    recipientPhoneNo: order.shippingAddress.phone,
    recipientEmail: order.shippingAddress.email,
    recipientAddress: order.shippingAddress.addressLine1,
    recipientState: order.shippingAddress.state,

    orderNo: order.orderNumber,

    deliveryType: "Express Delivery", // ✅ MUST MATCH WORKING VERSION

    description: "E-commerce order",

    paymentType: "Prepaid",
    pickupType: order.meta.pickupType,

    weight: order.meta.totalWeight,
    pieces: order.meta.totalItems,

    cashOnDelivery: 0,

    shipmentItems: [] // ✅ VERY IMPORTANT
  };
};

// ================= CREATE SHIPMENT =================
export const createShipment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ================= SAFETY CHECKS =================
    if (order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order not paid",
      });
    }

    if (order.orderStatus !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order not confirmed",
      });
    }

    // ================= IF ALREADY CREATED =================
    if (order.shipmentStatus === "created") {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: "Shipment already created",
        shipment: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          shipmentStatus: order.shipmentStatus,
          trackingNumber: order.trackingNumber,
          shipmentReference: order.shipmentReference,
          createdAt: order.shipmentCreatedAt,
        },
      });
    }

    // ================= BUILD PAYLOAD =================
    const payload = buildShipmentPayload(order);

    try {
      const shipmentResponse = await createRedstarShipment(payload);

      console.log("========== FULL REDSTAR RESPONSE ==========");
      console.log(JSON.stringify(shipmentResponse, null, 2));

      // ================= CHECK RESPONSE =================
      if (shipmentResponse?.TransStatus !== "Successful") {
        order.shipmentStatus = "failed";
        await order.save();

        return res.status(400).json({
          success: false,
          message:
            shipmentResponse?.TransStatusDetails ||
            "Shipment failed at provider",
        });
      }

      // ================= SAVE SUCCESS =================
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

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Shipment created successfully",
        shipment: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          shipmentStatus: order.shipmentStatus,
          trackingNumber: order.trackingNumber,
          shipmentReference: order.shipmentReference,
          createdAt: order.shipmentCreatedAt,
        },
      });

    } catch (error) {
      console.log("========== REDSTAR SHIPMENT ERROR ==========");
      console.log("Status:", error.response?.status);
      console.log("Data:", JSON.stringify(error.response?.data, null, 2));
      console.log("Message:", error.message);

      // ================= MARK FAILED =================
      order.shipmentStatus = "failed";
      await order.save();

      return res.status(500).json({
        success: false,
        message: "Shipment creation failed",
      });
    }

  } catch (error) {
    next(error);
  }
};



// ===================Track Shipment ====================================
export const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required",
      });
    }

    const data = await trackRedstarShipment(trackingNumber);

    const statusCode = data.lastStatus;
    const appStatus = mapToAppStatus(statusCode);

    // 🔥 FIND ORDER USING TRACKING NUMBER
    const order = await Order.findOne({ trackingNumber });

    if (order) {
      order.deliveryStatus = appStatus;
      order.orderStatus = mapDeliveryToOrderStatus(appStatus);
      order.lastTrackedAt = new Date();

      // 🔥 AUTO COMPLETE ORDER
      if (appStatus === "delivered") {
        order.orderStatus = "delivered";
        order.shipmentStatus = "delivered";
      }

      await order.save();
    }

    return res.status(200).json({
      success: true,
      shipment: {
        trackingNumber: data.waybillNumber,
        statusCode,
        status: appStatus,
        orderStatus: mapDeliveryToOrderStatus(appStatus), // 👈 add this


        sender: data.senderName,
        recipient: data.recipient?.recipientName,

        deliveryType: data.deliveryType,
        weight: data.weight,

        pricing: {
          deliveryFee: data.shipmentPayment?.servicePrice,
          vat: data.shipmentPayment?.vat,
          total: data.shipmentPayment?.totalAmount,
        },

        timeline: (data.pStatus || []).map((step) => ({
          name: step.name,
          completed: step.value,
          date: step.date,
          location: step.location,
        })),
      },
    });

  } catch (error) {
    if (error.response?.status === 500) {
      return res.status(200).json({
        success: true,
        shipment: {
          trackingNumber,
          status: "pending",
          message: "Tracking not available yet. Please try again later.",
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};


// =====================get all shipment by admin========================================


export const getAllShipments = async (req, res) => {
  try {
    const orders = await Order.find({
      trackingNumber: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .select(
      "orderNumber trackingNumber shipmentStatus deliveryStatus shipmentRetryCount shipmentError createdAt"
    );

    return res.status(200).json({
      success: true,
      total: orders.length,
      shipments: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};



// ============retry shipment tracking by admin=======================

export const retryShipmentTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order || !order.trackingNumber) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const data = await trackRedstarShipment(order.trackingNumber);

    const appStatus = mapToAppStatus(data.lastStatus);

    order.deliveryStatus = appStatus;
    order.orderStatus = mapDeliveryToOrderStatus(appStatus);
    order.lastTrackedAt = new Date();
    order.shipmentRetryCount = 0;
    order.shipmentError = null;

    if (appStatus === "delivered") {
      order.orderStatus = "delivered";
      order.shipmentStatus = "delivered";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipment retried successfully",
      order,
    });

  } catch (error) {
  console.log("========== RETRY ERROR ==========");
  console.log("Status:", error.response?.status);
  console.log("Data:", error.response?.data);

  // 🔥 HANDLE REDSTAR 500 ERROR
  if (error.response?.status === 500) {
    return res.status(200).json({
      success: true,
      message: "Tracking not available yet. Try again later.",
      shipment: {
        status: "pending",
      },
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
}
};