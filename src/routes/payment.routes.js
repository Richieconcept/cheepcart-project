import express from "express";
import {
  initializeOrderPayment,
  verifyOrderPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/initialize/:orderId", protect, initializeOrderPayment);
router.get("/verify/:reference", protect, verifyOrderPayment);

export default router;