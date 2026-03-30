import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// ========================== INITIALIZE PAYSTACK PAYMENT ==========================
export const initializePaystackPayment = async ({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
}) => {
  const response = await paystackClient.post("/transaction/initialize", {
    email,
    amount,
    reference,
    callback_url: callbackUrl,
    metadata,
  });

  return response.data;
};

// ========================== VERIFY PAYSTACK PAYMENT ==========================
export const verifyPaystackPayment = async (reference) => {
  const response = await paystackClient.get(`/transaction/verify/${reference}`);
  return response.data;
};