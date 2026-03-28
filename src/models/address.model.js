import mongoose from "mongoose";

// Schema for Address Model
const addressSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      required: true,
    },
    redstarCityAbbr: {
      type: String,
      required: [true, 'City abbreviation is required'],  // Custom message
    },
    redstarTownId: {
      type: Number,
      required: [true, 'Town ID is required'],  // Custom message
    },
    isBillingAddress: {
      type: Boolean,
      default: false,
    },
    isShippingAddress: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Custom validation before saving the address
addressSchema.pre('save', function () {
  if (!this.redstarCityAbbr || !this.redstarTownId) {
    throw new Error('Missing required redstar fields.');
  }
});

const Address = mongoose.model("Address", addressSchema);

export default Address;