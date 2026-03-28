import express from "express";
import {
  getShippingCities,
  getShippingTowns,
  calculateDeliveryFee,
} from "../controllers/shipping.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET Cities from RedStar
router.get("/cities", getShippingCities);

// GET Towns from RedStar based on City abbreviation
router.get("/towns/:cityAbbr", getShippingTowns);

// POST Calculate Delivery Fee based on city/town and cart weight
router.post("/calculate-fee", protect, calculateDeliveryFee);

export default router;