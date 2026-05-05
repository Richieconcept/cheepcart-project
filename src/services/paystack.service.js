import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

const cleanQuery = (query = {}) =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

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

// ========================== FETCH PAYSTACK BALANCE ==========================
export const fetchPaystackBalance = async () => {
  const response = await paystackClient.get("/balance");
  return response.data;
};

// ========================== LIST PAYSTACK TRANSACTIONS ==========================
export const listPaystackTransactions = async (query = {}) => {
  const response = await paystackClient.get("/transaction", {
    params: cleanQuery(query),
  });

  return response.data;
};

// ========================== FETCH PAYSTACK TRANSACTION TOTALS ==========================
export const fetchPaystackTransactionTotals = async (query = {}) => {
  const response = await paystackClient.get("/transaction/totals", {
    params: cleanQuery(query),
  });

  return response.data;
};
