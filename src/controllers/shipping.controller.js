import Cart from "../models/cart.model.js";
import Address from "../models/address.model.js";
import {
  calculateRedstarDeliveryFee,
  getRedstarCities,
  getRedstarTowns,
} from "../services/redstar.service.js";

// ========================== GET SHIPPING CITIES ==========================
export const getShippingCities = async (req, res, next) => {
  try {
    const cities = await getRedstarCities(); // Call RedStar API

    return res.status(200).json({
      success: true,
      cities,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== GET SHIPPING TOWNS ==========================
export const getShippingTowns = async (req, res, next) => {
  try {
    const { cityAbbr } = req.params;

    if (!cityAbbr) {
      return res.status(400).json({
        success: false,
        message: "City abbreviation is required",
      });
    }

    const towns = await getRedstarTowns(cityAbbr.toUpperCase());

    return res.status(200).json({
      success: true,
      towns,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== CALCULATE DELIVERY FEE ==========================
export const calculateDeliveryFee = async (req, res, next) => {
  try {
    const { recipientCity, recipientTownID } = req.body;

    if (!recipientCity || !recipientTownID) {
      return res.status(400).json({
        success: false,
        message: "recipientCity and recipientTownID are required",
      });
    }

    // ========================== GET USER CART ==========================
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name slug price images stock weight isActive"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let subtotal = 0;
    let totalWeight = 0;
    let unavailableItems = [];
    let validatedItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive || product.stock < item.quantity) {
        unavailableItems.push({
          productId: product?._id || item.product,
          name: product?.name || "Unknown Product",
        });
        continue;
      }

      const itemSubtotal = product.price * item.quantity;
      const itemWeight = (product.weight || 0) * item.quantity;

      subtotal += itemSubtotal;
      totalWeight += itemWeight;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.secure_url || "",
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        weight: itemWeight,
      });
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some cart items are unavailable or out of stock",
        unavailableItems,
      });
    }

    if (totalWeight <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to calculate delivery fee because product weight is missing",
      });
    }

    // ========================== STORE ORIGIN ==========================
    const senderCity = process.env.REDSTAR_SENDER_CITY || "ASB";
    const senderTownID = Number(process.env.REDSTAR_SENDER_TOWN_ID) || 480;
    const pickupType = Number(process.env.REDSTAR_PICKUP_TYPE) || 1;

    // ========================== CALCULATE DELIVERY FEE ==========================
    const redstarResponse = await calculateRedstarDeliveryFee({
      senderCity,
      recipientCity: recipientCity.toUpperCase(),
      recipientTownID: Number(recipientTownID),
      senderTownID,
      pickupType,
      weight: Number(totalWeight),
    });

    // ========================== NORMALIZE REDSTAR RESPONSE ==========================
    const deliveryFee =
      redstarResponse?.DeliveryFee ??
      redstarResponse?.deliveryFee ??
      redstarResponse?.amount ??
      redstarResponse?.TotalAmount ??
      redstarResponse?.totalAmount ??
      redstarResponse?.price ??
      0;

    const vatAmount = redstarResponse?.VatAmount ?? 0;
    const shippingTotal = redstarResponse?.TotalAmount ?? deliveryFee;
    const totalAmount = subtotal + Number(shippingTotal);

    return res.status(200).json({
      success: true,
      message: "Delivery fee calculated successfully",
      checkout: {
        items: validatedItems,
        pricing: {
          subtotal,
          deliveryFee: Number(deliveryFee),
          vatAmount: Number(vatAmount),
          shippingTotal: Number(shippingTotal),
          totalAmount,
        },
        meta: {
          totalItems: cart.totalItems,
          totalWeight,
          pickupType,
          senderCity,
          recipientCity: recipientCity.toUpperCase(),
          recipientTownID: Number(recipientTownID),
        },
        redstarRaw: redstarResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};