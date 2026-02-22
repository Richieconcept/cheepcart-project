import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { 
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    mergeCart
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/add", protect, addToCart);

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update", protect, updateCartItem);
router.delete("/remove/:productId", protect, removeFromCart);
router.delete("/clear", protect, clearCart);


// merge cart comming from frontend  local storage
router.post("/merge", protect, mergeCart);

export default router;