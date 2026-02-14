import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
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
      required: true
   },

   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
   },

   brand: {
      type: String
   },

   price: {
      type: Number,
      required: true
   },

   comparePrice: {
      type: Number
   },

   discountPercentage: {
      type: Number,
      default: 0
   },

   weight: {
      type: Number,
      required: true
   },

   stock: {
      type: Number,
      required: true
   },

   sold: {
      type: Number,
      default: 0
   },

   images: [
      {
         secure_url: String,
         public_id: String
      }
   ],

   averageRating: {
      type: Number,
      default: 0
   },

   totalReviews: {
      type: Number,
      default: 0
   },

   isActive: {
      type: Boolean,
      default: true
   },

   isFeatured: {
      type: Boolean,
      default: false
   }
},
{ timestamps: true }
);


// 🔥 Auto-generate slug
productSchema.pre("save", function (next) {
   if (this.isModified("name")) {
      this.slug = slugify(this.name, { lower: true, strict: true });
   }

   // Auto-calculate discount
   if (this.comparePrice && this.comparePrice > this.price) {
      this.discountPercentage = Math.round(
         ((this.comparePrice - this.price) / this.comparePrice) * 100
      );
   }

   next();
});


export default mongoose.model("Product", productSchema);
