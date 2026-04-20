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
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;">
          <img src="${item.image}" alt="${item.name}" width="60" style="border-radius:6px;" />
        </td>
        <td style="padding:10px;">
          <strong>${item.name}</strong><br/>
          Qty: ${item.quantity}
        </td>
        <td style="padding:10px; text-align:right;">
          ₦${item.subtotal}
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; background:#f8f8f8; padding:20px;">
    
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
      
      <!-- HEADER -->
      <div style="background:#860181; padding:20px; text-align:center; color:white;">
        <h2 style="margin:0;">CheepCart</h2>
      </div>

      <!-- BODY -->
      <div style="padding:20px;">
        <h3 style="color:#860181;">You left something behind 👀</h3>

        <p>Hi <strong>${name}</strong>,</p>

        <p>You added these items to your order but didn’t complete payment.</p>

        <!-- ITEMS -->
        <table width="100%" style="border-collapse:collapse;">
          ${itemsHtml}
        </table>

        <hr style="margin:20px 0;" />

        <p style="font-size:18px;">
          <strong>Total: ₦${order.pricing.totalAmount}</strong>
        </p>

        <!-- CTA BUTTON -->
        <div style="text-align:center; margin:30px 0;">
          <a href="https://cheepcarts.com/orders/${order._id}"
             style="
               background:#ff7a00;
               color:white;
               padding:15px 25px;
               text-decoration:none;
               border-radius:6px;
               font-weight:bold;
               display:inline-block;
             ">
            Complete Your Order
          </a>
        </div>

        <p style="color:#555;">
          Hurry before your items go out of stock.
        </p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f2f2f2; padding:15px; text-align:center; font-size:12px;">
        <p>© ${new Date().getFullYear()} CheepCart</p>
      </div>

    </div>
  </div>
  `;
};

// ================================payment successful email templates =============================
export const paymentSuccessTemplate = (name, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;">
          <img src="${item.image}" width="60" style="border-radius:6px;" />
        </td>
        <td style="padding:10px;">
          <strong>${item.name}</strong><br/>
          Qty: ${item.quantity}
        </td>
        <td style="padding:10px; text-align:right;">
          ₦${item.subtotal}
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family: Arial; background:#f8f8f8; padding:20px;">
    
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
      
      <!-- HEADER -->
      <div style="background:#860181; padding:20px; text-align:center; color:white;">
        <h2>Payment Confirmed ✅</h2>
      </div>

      <div style="padding:20px;">
        <p>Hi <strong>${name}</strong>,</p>

        <p>Your payment was successful. Your order is now being processed.</p>

        <!-- ITEMS -->
        <table width="100%">
          ${itemsHtml}
        </table>

        <hr style="margin:20px 0;" />

        <p style="font-size:18px;">
          <strong>Total Paid: ₦${order.pricing.totalAmount}</strong>
        </p>

        <div style="text-align:center; margin:30px 0;">
          <a href="${process.env.FRONTEND_URL}/order/${order._id}"
             style="background:#ff7a00; color:white; padding:15px 25px; border-radius:6px; text-decoration:none;">
            View Order
          </a>
        </div>

        <p>We’ll notify you once your order is shipped 🚚</p>
      </div>

      <div style="background:#f2f2f2; padding:15px; text-align:center; font-size:12px;">
        © ${new Date().getFullYear()} CheepCart
      </div>

    </div>
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


