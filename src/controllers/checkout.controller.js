import Cart from "../models/cart.model.js";
import Address from "../models/address.model.js";
import { calculateRedstarDeliveryFee } from "../services/redstar.service.js";

// ========================== GET USER BILLING ADDRESS ==========================
export const getBillingAddress = async (req, res, next) => {
  try {
    const billingAddress = await Address.findOne({
      user: req.user._id,
      isBillingAddress: true,
    });

    if (!billingAddress) {
      return res.status(404).json({
        success: false,
        message: "No billing address found. Please fill in your billing details.",
        billingAddress: null,
      });
    }

    return res.status(200).json({
      success: true,
      billingAddress,
      shipToDifferentAddress: true,
    });
  } catch (error) {
    next(error);
  }
};

// ========================== INITIALIZE CHECKOUT ==========================
export const initializeCheckout = async (req, res, next) => {
  try {
    const {
      shipToDifferentAddress = false,
      billingAddress,
      shippingAddress,
      recipientCity,
      recipientTownID,
    } = req.body;

    // ====================== BASIC VALIDATION ======================
    if (!billingAddress) {
      return res.status(400).json({
        success: false,
        message: "Billing address is required",
      });
    }

    if (!recipientCity || !recipientTownID) {
      return res.status(400).json({
        success: false,
        message: "recipientCity and recipientTownID are required",
      });
    }

    // Use billing as shipping if user didn't choose separate shipping
    const finalShippingAddress = shipToDifferentAddress
      ? shippingAddress
      : billingAddress;

    if (!finalShippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Validate required shipping fields
    if (
  !finalShippingAddress.fullName ||
  !finalShippingAddress.phone ||
  !finalShippingAddress.addressLine1 ||
  !finalShippingAddress.redstarCityAbbr ||
  !finalShippingAddress.redstarTownId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Shipping address must include fullName, phone and addressLine1",
      });
    }

    // ====================== GET USER CART ======================
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

    // ====================== VALIDATE CART ======================
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
        message: "Some items are unavailable or out of stock",
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

    // ====================== STORE ORIGIN ======================
    const senderCity = process.env.REDSTAR_SENDER_CITY || "ASB";
    const senderTownID = Number(process.env.REDSTAR_SENDER_TOWN_ID) || 480;
    const pickupType = Number(process.env.REDSTAR_PICKUP_TYPE) || 1;

    // ====================== CALCULATE DELIVERY FEE ======================
    const redstarResponse = await calculateRedstarDeliveryFee({
      senderCity,
      recipientCity: recipientCity.trim(),
      recipientTownID: Number(recipientTownID),
      senderTownID,
      pickupType,
      weight: Number(totalWeight),
    });

    // ====================== NORMALIZE REDSTAR RESPONSE ======================
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

    // ====================== SAVE BILLING ADDRESS IF NEW ======================
    const existingBillingAddress = await Address.findOne({
      user: req.user._id,
      isBillingAddress: true,
    });

    if (!existingBillingAddress) {
      // Save the new billing address if it doesn't exist
      const newBillingAddress = new Address({
        user: req.user._id,
        ...billingAddress,
        isBillingAddress: true,
      });

      await newBillingAddress.save();
    }

    // ====================== RETURN PAYMENT-READY CHECKOUT ======================
    return res.status(200).json({
      success: true,
      message: "Checkout initialized successfully",
      checkout: {
        items: validatedItems,
        pricing: {
          subtotal,
          deliveryFee: Number(deliveryFee),
          vatAmount: Number(vatAmount),
          shippingTotal: Number(shippingTotal),
          totalAmount,
        },
        billingAddress,
        shippingAddress: finalShippingAddress,
        meta: {
          totalItems: cart.totalItems,
          totalWeight,
          pickupType,
          senderCity,
          rerecipientCity: recipientCity.trim(),
          recipientTownID: Number(recipientTownID),
          shipToDifferentAddress,
        },
        redstarRaw: redstarResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};