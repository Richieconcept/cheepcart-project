export const verificationEmailTemplate = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #860181;">Welcome to CheepCart 👋</h2>

      <p>Hi <strong>${name}</strong>,</p>

      <p>Use the verification code below to activate your account:</p>

      <div style="
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 4px;
        background: #860181;
        color: white;
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


// ================== forgoten password reset email template====================

export const passwordResetEmailTemplate = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2  style="color: #4d0064;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your CheepCart password.</p>
      <p>Use the 6-digit code below to continue:</p>

      <div style="
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 6px;
        padding: 15px;
        background: #860181;
        color: white;
        text-align: center;
        border-radius: 6px;
        margin: 20px 0;
      ">
        ${otp}
      </div>

      <p>This code will expire in <strong>10 minutes</strong>.</p>

      <p>If you did not request this password reset, please ignore this email.</p>

      <p>— CheepCart Team</p>
    </div>
  `;
};



// =================Abandon order email templates=============================

export const abandonedOrderTemplate = (name, order) => {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2 style="color:#860181;">Complete Your Order 🛒</h2>

      <p>Hi ${name},</p>

      <p>You have a pending order waiting for payment.</p>

      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Total:</strong> ₦${order.pricing.totalAmount}</p>

      <p>Please complete your payment before it expires.</p>

      <p>— CheepCart Team</p>
    </div>
  `;
};


// ================================payment successful email templates =============================

export const paymentSuccessTemplate = (name, order) => {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2 style="color:#860181;">Payment Successful ✅</h2>

      <p>Hi ${name},</p>

      <p>Your payment was successful.</p>

      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Amount Paid:</strong> ₦${order.pricing.totalAmount}</p>

      <p>Your order is now being processed.</p>

      <p>— CheepCart Team</p>
    </div>
  `;
};


// ======shipment creation email =====================

export const shipmentCreatedTemplate = (name, order) => {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2 style="color:#860181;">Your Order Has Been Shipped 🚚</h2>

      <p>Hi ${name},</p>

      <p>Your order is on the way.</p>

      <p><strong>Order:</strong> ${order.orderNumber}</p>

      ${
        order.trackingNumber
          ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>`
          : `<p>Tracking will be available shortly.</p>`
      }

      <p>— CheepCart Team</p>
    </div>
  `;
};


