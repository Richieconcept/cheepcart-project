import crypto from "crypto";

export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOtp = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  return {
    otp,          // plain OTP (send via email)
    hashedOtp     // save this to DB
  };
};