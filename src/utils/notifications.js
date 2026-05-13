import { sendEmail } from "./sendEmail.js";
import {
  abandonedOrderTemplate,
  paymentSuccessTemplate,
  shipmentCreatedTemplate
} from "./emailTemplates.js";
import { generateReceiptPdf } from "./receiptPdf.js";

export const sendAbandonedOrderEmail = async (order, user) => {
  await sendEmail({
    to: order.customerEmail,
    subject: "Complete Your Order",
    html: abandonedOrderTemplate(user.name, order),
  });
};

export const sendPaymentSuccessEmail = async (order, user) => {
  const receiptPdf = generateReceiptPdf(order, user);

  await sendEmail({
    to: order.customerEmail,
    subject: "Payment Successful - Your CheepCart Receipt",
    html: paymentSuccessTemplate(user.name, order),
    attachments: [
      {
        name: `cheepcart-receipt-${order.orderNumber}.pdf`,
        content: receiptPdf,
      },
    ],
  });
};

export const sendShipmentCreatedEmail = async (order, user) => {
  await sendEmail({
    to: order.customerEmail,
    subject: "Order Shipped",
    html: shipmentCreatedTemplate(user.name, order),
  });
};
