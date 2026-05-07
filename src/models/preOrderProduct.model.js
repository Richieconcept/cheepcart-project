import mongoose from "mongoose";
import slugify from "slugify";

const preOrderImageSchema = new mongoose.Schema(
  {
    secure_url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const preOrderProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true
    },

    description: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      min: 0
    },

    image: {
      type: preOrderImageSchema
    },

    images: {
      type: [preOrderImageSchema],
      validate: [
        {
          validator: images => Array.isArray(images) && images.length > 0,
          message: "At least one pre-order product image is required"
        },
        {
          validator: images => !images || images.length <= 4,
          message: "Pre-order product can have at most 4 images"
        }
      ]
    },

    status: {
      type: String,
      enum: ["available", "coming_soon", "closed"],
      default: "available"
    },

    displayOrder: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

preOrderProductSchema.pre("validate", function () {
  if ((!this.images || this.images.length === 0) && this.image) {
    this.images = [this.image];
  }

  if (this.images?.length) {
    this.image = this.images[0];
  }
});

preOrderProductSchema.pre("save", async function () {
  if (!this.isModified("name")) return;

  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.PreOrderProduct.findOne({
      slug,
      _id: { $ne: this._id }
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
});

export default mongoose.model("PreOrderProduct", preOrderProductSchema);
