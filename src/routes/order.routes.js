// routes/order.routes.js
import express from "express";
import {
  createOrder,
  getMyPendingOrder,
  getMyOrders,
  getSingleOrder,
  cancelPendingOrder,
  deleteCanceledOrder,
  getAllOrdersAdmin ,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";


const router = express.Router();

router.post("/create", protect, createOrder);
router.get("/pending", protect, getMyPendingOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getSingleOrder);
router.delete("/:orderId/cancel", protect, cancelPendingOrder);  
router.delete("/:orderId", protect, deleteCanceledOrder);
router.get("/admin/all", protect, adminOnly, getAllOrdersAdmin);


export default router;




