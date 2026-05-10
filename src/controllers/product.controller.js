import Product from "../models/product.model.js";
import Category from "../models/category.js";

const buildProductFilter = (query) => {
   const filter = { isActive: true };

   // Category filter
   if (query.category) {
      filter.category = query.category;
   }

   // Featured filter
   if (query.featured === "true") {
      filter.isFeatured = true;
   }

   // Search by name OR description
   if (query.keyword) {
      filter.$or = [
         { name: { $regex: query.keyword, $options: "i" } },
         { description: { $regex: query.keyword, $options: "i" } }
      ];
   }

   // Price range filter
   if (query.min || query.max) {
      filter.price = {};
      if (query.min) filter.price.$gte = Number(query.min);
      if (query.max) filter.price.$lte = Number(query.max);
   }

   return filter;
};

const buildProductSort = (query) => {
   if (query.sort === "price_asc") {
      return { price: 1 };
   }

   if (query.sort === "price_desc") {
      return { price: -1 };
   }

   if (query.sort === "best_selling") {
      return { sold: -1 };
   }

   return { isFeatured: -1, createdAt: -1 };
};



// ================================= Create Product =================================
export const createProduct = async (req, res, next) => {
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
      next(error);
   }
};



// ============================ Get All Products (Public) ============================
export const getProducts = async (req, res, next) => {
   try {

      const page = Number(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      const filter = buildProductFilter(req.query);
      const sortOption = buildProductSort(req.query);

      const products = await Product.find(filter)
         .populate("category", "name slug")
         .skip(skip)
         .limit(limit)
         .sort(sortOption);

      const total = await Product.countDocuments(filter);

      res.status(200).json({
         total,
         page,
         pages: Math.ceil(total / limit),
         products
      });

   } catch (error) {
      next(error);
   }
};


// ============================ Get All Products Without Pagination (Public) ============================
export const getAllProducts = async (req, res, next) => {
   try {

      const filter = buildProductFilter(req.query);
      const sortOption = buildProductSort(req.query);

      const products = await Product.find(filter)
         .populate("category", "name slug")
         .sort(sortOption);

      res.status(200).json({
         total: products.length,
         products
      });

   } catch (error) {
      next(error);
   }
};



// ============================ Get Single Product (By Slug) ============================
export const getSingleProduct = async (req, res, next) => {
   try {

      const product = await Product.findOne({
         slug: req.params.slug,
         isActive: true
      }).populate("category", "name slug");
      console.log("Slug from request:", req.params.slug);


      if (!product) {
         return res.status(404).json({
            message: "Product not found"
         });
      }

      res.status(200).json(product);

   } catch (error) {
      next(error);
   }
};


// ============================ Update Product (Admin) ============================
export const updateProduct = async (req, res, next) => {
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
      next(error);
   }
};



// ============================ Delete Product (Admin - Soft Delete) ============================
export const deleteProduct = async (req, res, next) => {
   try {

      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
         return res.status(404).json({
            message: "Product not found"
         });
      }

      res.status(200).json({
         message: "Product permanently deleted"
      });

   } catch (error) {
      next(error);
   }
};
