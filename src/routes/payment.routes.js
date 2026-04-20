import express from "express";
import {
  initializeOrderPayment,
  verifyOrderPayment,
  handlePaystackWebhook, // ✅ NEW
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔐 USER FLOW
router.post("/initialize/:orderId", protect, initializeOrderPayment);
router.get("/verify/:reference", protect, verifyOrderPayment);

// 🔥 WEBHOOK (NO AUTH)
router.post(
  "/webhook",
  express.raw({ type: "*/*" }), // ✅ VERY IMPORTANT
  handlePaystackWebhook
);

export default router;