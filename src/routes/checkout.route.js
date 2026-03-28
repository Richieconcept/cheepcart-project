import express from "express";
import { getBillingAddress, initializeCheckout } from "../controllers/checkout.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET Billing Address (check if user has one saved)
router.get("/billing-address", protect, getBillingAddress);

// POST Checkout Initialization
router.post("/initialize", protect, initializeCheckout);

export default router;