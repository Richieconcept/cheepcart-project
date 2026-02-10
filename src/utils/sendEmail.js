import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first"); // 🔥 VERY IMPORTANT

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password
    },
  });

  await transporter.sendMail({
    from: `CheepCart <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
