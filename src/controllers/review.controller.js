import Review from "../models/review.model.js";
import Product from "../models/product.model.js";

// ================= ADD REVIEW =================
export const addReview = async (req, res, next) => {
   try {

      const { rating, comment } = req.body;

      const product = await Product.findById(req.params.productId);

      if (!product) {
         return res.status(404).json({ message: "Product not found" });
      }

      // Check if user already reviewed
      const existingReview = await Review.findOne({
         product: product._id,
         user: req.user._id
      });

      if (existingReview) {
         return res.status(400).json({
            message: "You have already reviewed this product"
         });
      }

      // Create review
      await Review.create({
         product: product._id,
         user: req.user._id,
         rating,
         comment
      });

      // Recalculate rating
      const reviews = await Review.find({ product: product._id });

      product.totalReviews = reviews.length;

      product.averageRating =
         reviews.reduce((acc, item) => acc + item.rating, 0) /
         reviews.length;

      await product.save();

      res.status(201).json({
         message: "Review added successfully"
      });

   } catch (error) {
      next(error);
   }
};


// ================= GET PRODUCT REVIEWS =================
export const getProductReviews = async (req, res, next) => {
   try {

      const reviews = await Review.find({
         product: req.params.productId
      })
      .populate("user", "name")
      .sort({ createdAt: -1 });

      res.status(200).json({
         total: reviews.length,
         reviews
      });

   } catch (error) {
      next(error);
   }
};


// ================= DELETE REVIEW =================
export const deleteReview = async (req, res, next) => {
   try {

      const review = await Review.findById(req.params.reviewId);

      if (!review) {
         return res.status(404).json({
            message: "Review not found"
         });
      }

      // Only review owner or admin can delete
      if (
         review.user.toString() !== req.user._id.toString() &&
         req.user.role !== "admin"
      ) {
         return res.status(403).json({
            message: "Not authorized"
         });
      }

      const productId = review.product;

      await review.deleteOne();

      // Recalculate rating
      const reviews = await Review.find({ product: productId });

      const product = await Product.findById(productId);

      product.totalReviews = reviews.length;

      product.averageRating =
         reviews.length === 0
            ? 0
            : reviews.reduce((acc, item) => acc + item.rating, 0) /
              reviews.length;

      await product.save();

      res.status(200).json({
         message: "Review deleted successfully"
      });

   } catch (error) {
      next(error);
   }
};