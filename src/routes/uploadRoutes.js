import express from "express";
import { uploadImages } from "../controllers/uploadController.js";
import upload from "../middlewares/uploadMiddleware.js";  // Assuming you're using multer for file uploads
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// For handling multiple image uploads
router.post(
  "/",
  protect,
  adminOnly,
  upload.array("images", 4),  // Allows up to 4 files to be uploaded
  uploadImages
);

export default router;