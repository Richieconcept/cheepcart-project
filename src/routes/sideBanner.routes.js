import express from "express";
import { getSideBanner, saveSideBanner } from "../controllers/sideBanner.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";
import bannerUpload from "../middlewares/bannerUploadMiddleware.js";

const router = express.Router();

// Public side-banner slider endpoint for the frontend.
router.get("/", getSideBanner);

// Admin manages the single side-banner slider here.
router.post("/", protect, adminOnly, bannerUpload.array("media", 5), saveSideBanner);
router.put("/", protect, adminOnly, bannerUpload.array("media", 5), saveSideBanner);

export default router;
