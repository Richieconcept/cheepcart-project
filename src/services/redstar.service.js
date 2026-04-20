import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const REDSTAR_BASE_URL =
  process.env.REDSTAR_BASE_URL || "http://rsmdev.westeurope.cloudapp.azure.com:89";

const REDSTAR_API_KEY = process.env.REDSTAR_API_KEY;

const redstar = axios.create({
  baseURL: REDSTAR_BASE_URL,
  timeout: 20000,
  headers: {
    "X-API-KEY": REDSTAR_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ====================== SAFE ARRAY HELPER ======================
const safeArray = (data) => (Array.isArray(data) ? data : []);

// ====================== GET CITIES ======================
export const getRedstarCities = async () => {
  const { data } = await redstar.get("/api/Operations/Cities");

  return safeArray(data)
    .filter((city) => city?.abbr && city?.name)
    .map((city) => ({
      id: city.id,
      abbr: city.abbr,
      name: city.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// ====================== GET TOWNS ======================
export const getRedstarTowns = async (cityAbbr) => {
  const { data } = await redstar.get(`/api/Operations/DeliveryTowns/${cityAbbr}`);

  return safeArray(data)
    .filter((town) => town?.id && town?.name)
    .map((town) => ({
      id: town.id,
      cityId: town.cityId,
      abbr: town.abbr,
      name: town.name,
      city: town.city
        ? {
            id: town.city.id,
            abbr: town.city.abbr,
            name: town.city.name,
          }
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// ====================== GET DROP-OFF LOCATIONS ======================
export const getRedstarDropoffLocations = async (cityAbbr) => {
  const { data } = await redstar.get(`/api/Operations/DropOffLocations/${cityAbbr}`);

  return safeArray(data)
    .filter((location) => location?.name)
    .map((location) => ({
      name: location.name,
      address: location.address || "",
      abbr: location.abbr || "",
    }));
};

// ====================== CALCULATE DELIVERY FEE ======================
export const calculateRedstarDeliveryFee = async ({
  senderCity,
  recipientCity,
  recipientTownID,
  senderTownID,
  pickupType,
  weight,
}) => {
  const payload = {
    senderCity,
    recipientCity,
    recipientTownID,
    senderTownID,
    pickupType,
    weight,
  };

//   console.log("========== REDSTAR DELIVERY FEE PAYLOAD ==========");
//   console.log(payload);

  try {
    const { data } = await redstar.post("/api/Operations/DeliveryFee", payload);

    // console.log("========== REDSTAR DELIVERY FEE RESPONSE ==========");
    // console.log(data);

    return data;
  } catch (error) {
    // console.log("========== REDSTAR DELIVERY FEE ERROR ==========");
    // console.log("Status:", error.response?.status);
    // console.log("Data:", error.response?.data);
    // console.log("Payload Sent:", payload);

    throw error;
  }
};


// ====================== CREATE SHIPMENT ======================
export const createRedstarShipment = async (payload) => {
  try {
    const { data } = await redstar.post(
      "/api/Operations/PickupRequest",
      payload
    );

    return data;
  } catch (error) {
    console.log("========== REDSTAR SHIPMENT ERROR ==========");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Payload:", payload);

    throw error;
  }
};



// ================= TRACK SHIPMENT =================

export const trackRedstarShipment = async (trackingNumber) => {


  const { data } = await axios.get(
    `${REDSTAR_BASE_URL}/api/Operations/TrackShipment`,
    {
      params: {
        Waybillno: trackingNumber,
      },
      headers: {
        "X-API-KEY": REDSTAR_API_KEY,
      },
    }
  );

  return data;
};