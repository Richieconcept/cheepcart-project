import express from "express";
import {
   createProduct,
   getProducts,
   getSingleProduct,
   updateProduct,
   deleteProduct
} from "../controllers/product.controller.js";

import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:slug", getSingleProduct);

// Admin
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
