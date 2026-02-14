import Product from "../models/product.model.js";
import Category from "../models/category.model.js";


// =================================Create Product)================================

export const createProduct = async (req, res) => {
   try {

      const {
         name,
         description,
         category,
         brand,
         price,
         comparePrice,
         weight,
         stock,
         images
      } = req.body;

      // Validate category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
         return res.status(404).json({
            message: "Category not found"
         });
      }

      const product = await Product.create({
         name,
         description,
         category,
         brand,
         price,
         comparePrice,
         weight,
         stock,
         images
      });

      res.status(201).json({
         message: "Product created successfully",
         product
      });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};




// =====================Get All Products (Public)=================================

export const getProducts = async (req, res) => {
   try {

      const page = Number(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const filter = { isActive: true };

      if (req.query.category) {
         filter.category = req.query.category;
      }

      if (req.query.featured) {
         filter.isFeatured = true;
      }

      const products = await Product.find(filter)
         .populate("category", "name slug")
         .skip(skip)
         .limit(limit)
         .sort({ createdAt: -1 });

      const total = await Product.countDocuments(filter);

      res.status(200).json({
         total,
         page,
         pages: Math.ceil(total / limit),
         products
      });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};




// =====================Get Single Product (By Slug)===========================

export const getSingleProduct = async (req, res) => {
   try {

      const product = await Product.findOne({
         slug: req.params.slug,
         isActive: true
      }).populate("category", "name slug");

      if (!product) {
         return res.status(404).json({
            message: "Product not found"
         });
      }

      res.status(200).json(product);

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};




// ============================Update Product (Admin)===============================

export const updateProduct = async (req, res) => {
   try {

      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            message: "Product not found"
         });
      }

      Object.assign(product, req.body);

      await product.save();

      res.status(200).json({
         message: "Product updated successfully",
         product
      });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};





// ==============================Delete Product (Admin)=============================

export const deleteProduct = async (req, res) => {
   try {

      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            message: "Product not found"
         });
      }

      product.isActive = false;
      await product.save();

      res.status(200).json({
         message: "Product deactivated successfully"
      });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};
