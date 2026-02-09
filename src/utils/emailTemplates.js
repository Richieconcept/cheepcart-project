export const verificationEmailTemplate = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #52006b;">Welcome to CheepCart 👋</h2>

      <p>Hi <strong>${name}</strong>,</p>

      <p>Use the verification code below to activate your account:</p>

      <div style="
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 4px;
        background: #fedfff;
        padding: 15px;
        text-align: center;
        margin: 20px 0;
        border-radius: 6px;
      ">
        ${otp}
      </div>

      <p>This code will expire in <strong>10 minutes</strong>.</p>

      <p>If you did not create this account, you can safely ignore this email.</p>

      <p style="margin-top: 30px;">
        — <br />
        <strong>CheepCart Team</strong>
      </p>
    </div>
  `;
};
