import express from "express";
import {
  registerUser,
  verifyEmail,
    loginUser,
    resendVerification,
    forgotPassword,
    verifyResetOtp,
    resetPassword
} from "../controllers/authController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";


const router = express.Router();



// ==========================Authentication router enpoints==========================================

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);






export default router;