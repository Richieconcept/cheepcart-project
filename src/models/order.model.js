// models/order.model.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    weight: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    town: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Nigeria" },
    redstarCityAbbr: { type: String, required: true },
    redstarTownId: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must have at least one item"],
    },

    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true, default: 0 },
      vatAmount: { type: Number, required: true, default: 0 },
      shippingTotal: { type: Number, required: true, default: 0 },
      totalAmount: { type: Number, required: true },
    },

    billingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },

    shippingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },

    meta: {
      totalItems: { type: Number, required: true },
      totalWeight: { type: Number, required: true },
      pickupType: { type: Number, required: true, default: 1 },
      senderCity: { type: String, required: true },
      senderTownID: { type: Number, required: true },
      recipientCity: { type: String, required: true },
      recipientTownID: { type: Number, required: true },
      shipToDifferentAddress: { type: Boolean, default: false },
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["paystack"],
      default: "paystack",
    },
    paymentReference: {
      type: String,
      default: null,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },


shipmentStatus: {
  type: String,
  enum: [
    "not_created",
    "pending",
    "created",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed"
  ],
  default: "not_created",
  index: true,
},

// 🔥 NEW — USER-FACING DELIVERY STATUS
deliveryStatus: {
  type: String,
  enum: [
    "pending",
    "picked",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "issue",
    "delayed"
  ],
  default: "pending",
  index: true,
},

// 🔥 TRACKING + REFERENCE
shipmentReference: {
  type: String,
  default: null,
},

trackingNumber: {
  type: String,
  default: null,
  index: true,
},

shipmentCreatedAt: {
  type: Date,
  default: null,
},

// 🔥 ERROR HANDLING (VERY IMPORTANT)
shipmentError: {
  type: String,
  default: null,
},

// 🔁 RETRY CONTROL
shipmentRetryCount: {
  type: Number,
  default: 0,
},

// 🕒 LAST TRACK SYNC
lastTrackedAt: {
  type: Date,
  default: null,
},


    shipmentReference: {
      type: String,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    shipmentCreatedAt: {
      type: Date,
      default: null,
    },

    abandonedEmailSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    abandonedEmailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ========================== FIXED pre-save hook ==========================
// Modern async style — do NOT use `next` here
orderSchema.pre("save", async function () {
  if (!this.isNew || this.orderNumber) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;

  const count = await mongoose.models.Order.countDocuments({
    createdAt: {
      $gte: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`),
      $lt: new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`),
    },
  });

  this.orderNumber = `CHP-${datePart}-${String(count + 1).padStart(4, "0")}`;
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
