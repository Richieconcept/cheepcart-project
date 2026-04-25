import express from "express";
import {
  createPreOrderEnquiry,
  deletePreOrderEnquiry,
  getPreOrderEnquiries,
  getSinglePreOrderEnquiry,
  updatePreOrderEnquiryStatus
} from "../controllers/preOrderEnquiry.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Public
router.post("/", createPreOrderEnquiry);

// Admin
router.get("/", protect, adminOnly, getPreOrderEnquiries);
router.get("/:id", protect, adminOnly, getSinglePreOrderEnquiry);
router.patch("/:id/status", protect, adminOnly, updatePreOrderEnquiryStatus);
router.delete("/:id", protect, adminOnly, deletePreOrderEnquiry);

export default router;
