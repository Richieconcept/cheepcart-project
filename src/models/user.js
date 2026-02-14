import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    wishlist: [
   {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
   }
],

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    phone: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },

    // 🔐 EMAIL VERIFICATION
    isVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationCode: {
      type: String,
      select: false
    },

    emailVerificationExpires: {
      type: Date
    },

    otpLastSentAt: {
      type: Date
    },

    // 🔑 FORGOT PASSWORD / RESET
    passwordResetCode: {
      type: String,
      select: false
    },

    passwordResetExpires: {
      type: Date
    },

    passwordResetLastSentAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// 🔐 Hash password before save (modern mongoose)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
