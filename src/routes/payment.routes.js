import express from "express";
import {
  initializeOrderPayment,
  verifyOrderPayment,
  getPaystackAdminWallet,
  handlePaystackWebhook, // ✅ NEW
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// 🔐 USER FLOW
router.post("/initialize/:orderId", protect, initializeOrderPayment);
router.get("/verify/:reference", protect, verifyOrderPayment);

// ADMIN DASHBOARD
router.get("/admin/paystack-wallet", protect, adminOnly, getPaystackAdminWallet);

// 🔥 WEBHOOK (NO AUTH)
router.post(
  "/webhook",
  express.raw({ type: "*/*" }), // ✅ VERY IMPORTANT
  handlePaystackWebhook
);

export default router;
