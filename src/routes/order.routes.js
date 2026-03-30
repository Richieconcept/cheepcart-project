// routes/order.routes.js
import express from "express";
import {
  createOrder,
  getMyPendingOrder,
  getMyOrders,
  getSingleOrder,
  cancelPendingOrder,
  deleteCanceledOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createOrder);
router.get("/pending", protect, getMyPendingOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getSingleOrder);
router.delete("/:orderId/cancel", protect, cancelPendingOrder);  
router.delete("/:orderId", protect, deleteCanceledOrder);


export default router;




