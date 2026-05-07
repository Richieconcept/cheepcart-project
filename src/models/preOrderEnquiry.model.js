import mongoose from "mongoose";

const productSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    price: Number,
    image: {
      secure_url: String,
      public_id: String
    },
    images: [
      {
        secure_url: String,
        public_id: String
      }
    ]
  },
  { _id: false }
);

const preOrderEnquirySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PreOrderProduct",
      required: true
    },

    productSnapshot: productSnapshotSchema,

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1
    },

    location: {
      type: String,
      trim: true
    },

    message: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "contacted", "confirmed", "cancelled", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("PreOrderEnquiry", preOrderEnquirySchema);
