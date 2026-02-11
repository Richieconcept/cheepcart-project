import User from "../models/user.js";
import { generateOTP } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import { verificationEmailTemplate } from "../utils/emailTemplates.js";
import crypto from "crypto";
import { generateToken } from "../utils/generateToken.js";


// =====================Register user======================================


export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409);
      throw new Error("User already exists with this email");
    }

    // Generate OTP
    const { otp, hashedOtp } = generateOTP();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      emailVerificationCode: hashedOtp,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000
    });

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify your CheepCart account",
      html: verificationEmailTemplate(user.name, otp)
    });

    res.status(201).json({
      success: true,
      message: "Verification code sent to email",
      userId: user._id
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    next(error);
  }
};



// ===================Verify user=======================================



export const verifyEmail = async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      res.status(400);
      throw new Error("Verification code is required");
    }

    // Hash the incoming OTP
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      _id: userId,
      emailVerificationCode: hashedCode,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired verification code");
    }

    // Mark user as verified
    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. Please login."
    });
  } catch (error) {
    next(error);
  }
};





// =============================Login user =============================================


export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    // Explicitly select password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Check verification
    if (!user.isVerified) {
      res.status(403);
      throw new Error("Please verify your email before logging in");
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};



// ===========================RESEND VERIFICATION CODE ====================================



export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error("Account is already verified");
    }

    // ⏳ Cooldown: 1 minute
    const cooldown = 60 * 1000;
    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < cooldown
    ) {
      res.status(429);
      throw new Error("Please wait before requesting another verification code");
    }

    // 🔐 Generate new OTP
    const { otp, hashedOtp } = generateOTP();

    user.emailVerificationCode = hashedOtp;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    user.otpLastSentAt = new Date();

    await user.save();

    // 📧 Send email (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: "Your new CheepCart verification code",
        html: verificationEmailTemplate(user.name, otp)
      });
    } catch (emailError) {
      console.error("Resend email failed:", emailError.message);
    }

    res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email"
    });
  } catch (error) {
    next(error);
  }
};




// ==========================forgotPassword========================================



export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return generic response
    const genericResponse = {
      success: true,
      message: "If the email exists, a password reset code has been sent"
    };

    if (!email) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({ email });

    // If user does not exist, return same response
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Optional: block inactive users
    if (!user.isActive) {
      return res.status(200).json(genericResponse);
    }

    // ⏳ Cooldown: 2 minutes
    const cooldown = 2 * 60 * 1000;
    if (
      user.passwordResetLastSentAt &&
      Date.now() - user.passwordResetLastSentAt.getTime() < cooldown
    ) {
      return res.status(200).json(genericResponse);
    }

    // 🔐 Generate reset OTP
    const { otp, hashedOtp } = generateOTP();

    user.passwordResetCode = hashedOtp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    user.passwordResetLastSentAt = new Date();

    await user.save();

    // 📧 Send reset email (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your CheepCart password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>Use the code below to reset your password:</p>
            <div style="font-size:28px;font-weight:bold;letter-spacing:4px;padding:15px;background:#f4f4f4;text-align:center;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>— CheepCart Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Password reset email failed:", emailError.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};




// ==============================VERIFY RESET OTP ENDPOINT============================================


export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400);
      throw new Error("Email and reset code are required");
    }

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired reset code");
    }

    res.status(200).json({
      success: true,
      message: "Reset code verified. You may now set a new password."
    });
  } catch (error) {
    next(error);
  }
};


// ======================================= resetPassword ============================

export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400);
      throw new Error("Email, reset code, and new password are required");
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long");
    }

    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired reset code");
    }

    // 🔐 Set new password
    user.password = newPassword;

    // 🧹 Clear reset fields
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetLastSentAt = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password."
    });
  } catch (error) {
    next(error);
  }
};


