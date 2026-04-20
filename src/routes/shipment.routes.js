import express from "express";
import { createShipment, 
        trackShipment, 
        getAllShipments, 
        retryShipmentTracking 
 } from "../controllers/shipment.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post("/create/:orderId", protect, adminOnly, createShipment);
router.get("/track/:trackingNumber", protect, trackShipment);
// 🔥 ADMIN SHIPMENT MONITOR
router.get("/get-all-shipments", protect, adminOnly, getAllShipments);
// 🔁 RETRY SHIPMENT TRACKING (NEW)
router.post("/retry/:orderId", protect, adminOnly, retryShipmentTracking);



export default router;