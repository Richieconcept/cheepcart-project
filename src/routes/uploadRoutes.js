import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import upload from "../middlewares/uploadMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  uploadImage
);

export default router;
