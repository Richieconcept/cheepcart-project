import cron from "node-cron";
import Order from "../models/order.model.js";
import { trackRedstarShipment } from "../services/redstar.service.js";
import { mapToAppStatus } from "../utils/shipmentStatusMapper.js";
import { mapDeliveryToOrderStatus } from "../utils/statusMapper.js";

// 🔁 Runs every 10 minutes
export const startShipmentSyncJob = () => {
  console.log("🚀 Shipment cron initialized...");

  cron.schedule("*/10 * * * *", async () => {
    console.log("🔄 Running shipment sync job...");

    try {
      // 🔥 Only active shipmentss
      const orders = await Order.find({
        trackingNumber: { $ne: null },
        shipmentStatus: { $in: ["created", "in_transit"] },
      });

      for (const order of orders) {
        try {
          // ⛔ Skip if already delivered (extra safety)
          if (order.shipmentStatus === "delivered") continue;

          // 🔁 Retry limit protection
          if (order.shipmentRetryCount >= 5) {
            console.log(`⚠️ Retry limit reached for ${order.trackingNumber}`);
            continue;
          }

          const data = await trackRedstarShipment(order.trackingNumber);

          const statusCode = data.lastStatus;
          const appStatus = mapToAppStatus(statusCode);

          // 🔥 UPDATE ORDER
          order.deliveryStatus = appStatus;
          order.orderStatus = mapDeliveryToOrderStatus(appStatus);
           order.lastTrackedAt = new Date();
           
          // 🔥 STATUS HANDLING
          if (appStatus === "delivered") {
            order.orderStatus = "delivered";
            order.shipmentStatus = "delivered";
          } else if (appStatus === "in_transit") {
            order.shipmentStatus = "in_transit";
          } else if (appStatus === "picked") {
            order.shipmentStatus = "pending";
          }

          // ✅ Reset retry count on success
          order.shipmentRetryCount = 0;
          order.shipmentError = null;

          await order.save();

          console.log(`✅ Updated: ${order.trackingNumber} → ${appStatus}`);

        } catch (err) {
          // ❌ TRACKING FAILED
          order.shipmentRetryCount += 1;
          order.shipmentError =
            err.response?.data?.title ||
            err.response?.data?.detail ||
            err.message;

          await order.save();

          console.log(
            `❌ Failed tracking ${order.trackingNumber} (Retry ${order.shipmentRetryCount})`
          );
        }
      }

      console.log("✅ Shipment sync completed");

    } catch (error) {
      console.log("❌ Cron job error:", error.message);
    }
  });
};