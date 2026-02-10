import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password
    },
    tls: {
      family: 4 // 👈 FORCE IPv4 (VERY IMPORTANT)
    }
  });

  await transporter.sendMail({
    from: `CheepCart <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
