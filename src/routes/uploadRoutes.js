import express from "express";
import {
  uploadImages,
  updateImages,
  deleteImages
} from "../controllers/uploadController.js";
import upload from "../middlewares/uploadMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Upload (max 4 images)
router.post(
  "/upload",
  protect,
  adminOnly,
  upload.array("images", 4),
  uploadImages
);

// Update images
router.put(
  "/update",
  protect,
  adminOnly,
  upload.array("images", 4),
  updateImages
);

// Delete images
router.delete(
  "/delete",
  protect,
  adminOnly,
  deleteImages
);

export default router;