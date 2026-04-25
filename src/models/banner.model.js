// models/banner.model.js

import mongoose from "mongoose";

// Each banner slider item can be an image, video, or svg stored on Cloudinary.
const bannerMediaSchema = new mongoose.Schema(
  {
    secure_url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "svg"],
      required: true
    },
    resource_type: {
      type: String,
      default: "image"
    }
  },
  { _id: false }
);

const bannerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "secondary"],
      required: true
    },

    // Option A: one banner document holds the full slider as an array of media items.
    mediaItems: {
      type: [bannerMediaSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0 && value.length <= 5;
        },
        message: "Banner must contain between 1 and 5 media items"
      }
    },

    title: String,
    subtitle: String,
    link: String,

    order: {
      type: Number,
      default: 1
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
