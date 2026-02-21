import express from "express";
import {
   addReview,
   getProductReviews,
   deleteReview
} from "../controllers/review.controller.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/:productId", protect, addReview);
router.delete("/:reviewId", protect, deleteReview);

export default router;