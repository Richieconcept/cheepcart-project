import { sendEmail } from "./sendEmail.js";
import {
  abandonedOrderTemplate,
  paymentSuccessTemplate,
  shipmentCreatedTemplate
} from "./emailTemplates.js";

export const sendAbandonedOrderEmail = async (order, user) => {
  await sendEmail({
    to: order.customerEmail,
    subject: "Complete Your Order",
    html: abandonedOrderTemplate(user.name, order),
  });
};

export const sendPaymentSuccessEmail = async (order, user) => {
  await sendEmail({
    to: order.customerEmail,
    subject: "Payment Successful",
    html: paymentSuccessTemplate(user.name, order),
  });
};

export const sendShipmentCreatedEmail = async (order, user) => {
  await sendEmail({
    to: order.customerEmail,
    subject: "Order Shipped",
    html: shipmentCreatedTemplate(user.name, order),
  });
};