import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },

    // 🚨 THIS IS THE KEY FIX
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    tls: {
      rejectUnauthorized: true,
      family: 4 // ✅ FORCE IPv4 (THIS FIXES RENDER)
    }
  });

  await transporter.sendMail({
    from: `CheepCart <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};
