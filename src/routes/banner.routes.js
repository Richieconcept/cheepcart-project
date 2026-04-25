// routes/banner.routes.js

import express from "express";
import {
  getHeroBanner,
  saveHeroBanner,
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner
} from "../controllers/banner.controller.js";

import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";
import bannerUpload from "../middlewares/bannerUploadMiddleware.js";

const router = express.Router();

// public
router.get("/hero", getHeroBanner);
router.get("/", getBanners);

// admin
// Dedicated hero endpoint keeps the main slider section as one managed banner document.
router.post("/hero", protect, adminOnly, bannerUpload.array("media", 5), saveHeroBanner);
router.put("/hero", protect, adminOnly, bannerUpload.array("media", 5), saveHeroBanner);

// Banner creation accepts files directly so the admin can upload and create in one request.
router.post("/", protect, adminOnly, bannerUpload.array("media", 5), createBanner);
router.put("/:id", protect, adminOnly, bannerUpload.array("media", 5), updateBanner);
router.delete("/:id", protect, adminOnly, deleteBanner);

export default router;
