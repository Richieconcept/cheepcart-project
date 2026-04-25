import express from "express";
import {
  createPreOrderProduct,
  deletePreOrderProduct,
  getAdminPreOrderProduct,
  getAdminPreOrderProducts,
  getPreOrderProducts,
  getSinglePreOrderProduct,
  updatePreOrderProduct
} from "../controllers/preOrderProduct.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Admin
router.get("/admin/all", protect, adminOnly, getAdminPreOrderProducts);
router.get("/admin/:id", protect, adminOnly, getAdminPreOrderProduct);
router.post("/", protect, adminOnly, createPreOrderProduct);
router.put("/:id", protect, adminOnly, updatePreOrderProduct);
router.delete("/:id", protect, adminOnly, deletePreOrderProduct);

// Public
router.get("/", getPreOrderProducts);
router.get("/:slug", getSinglePreOrderProduct);

export default router;
