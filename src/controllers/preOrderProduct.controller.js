import PreOrderProduct from "../models/preOrderProduct.model.js";
import {
  deletePreOrderImage,
  normalizePreOrderImage,
  uploadPreOrderImage
} from "../services/preOrderProduct.service.js";

// ============================ Create Pre-order Product (Admin) ============================
export const createPreOrderProduct = async (req, res, next) => {
  try {
    const { name, description, price, status, displayOrder, isActive } = req.body;
    const image = req.file
      ? await uploadPreOrderImage(req.file)
      : normalizePreOrderImage(req.body.image);

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (!image?.secure_url || !image?.public_id) {
      return res.status(400).json({
        message: "Product image with secure_url and public_id is required"
      });
    }

    const product = await PreOrderProduct.create({
      name,
      description,
      price,
      image,
      status,
      displayOrder,
      isActive
    });

    res.status(201).json({
      message: "Pre-order product created successfully",
      product
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Get Active Pre-order Products (Public) ============================
export const getPreOrderProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.keyword) {
      filter.$or = [
        { name: { $regex: req.query.keyword, $options: "i" } },
        { description: { $regex: req.query.keyword, $options: "i" } }
      ];
    }

    const products = await PreOrderProduct.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ displayOrder: 1, createdAt: -1 });

    const total = await PreOrderProduct.countDocuments(filter);

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

// ============================ Get All Pre-order Products (Admin) ============================
export const getAdminPreOrderProducts = async (req, res, next) => {
  try {
    const products = await PreOrderProduct.find({})
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      total: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Get Single Pre-order Product (Public by Slug) ============================
export const getSinglePreOrderProduct = async (req, res, next) => {
  try {
    const product = await PreOrderProduct.findOne({
      slug: req.params.slug,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Pre-order product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// ============================ Get Single Pre-order Product (Admin by ID) ============================
export const getAdminPreOrderProduct = async (req, res, next) => {
  try {
    const product = await PreOrderProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Pre-order product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// ============================ Update Pre-order Product (Admin) ============================
export const updatePreOrderProduct = async (req, res, next) => {
  try {
    const product = await PreOrderProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Pre-order product not found" });
    }

    const { image, ...updates } = req.body;
    Object.assign(product, updates);

    if (req.file) {
      const oldPublicId = product.image?.public_id;
      product.image = await uploadPreOrderImage(req.file);
      await deletePreOrderImage(oldPublicId);
    } else if (image !== undefined) {
      const normalizedImage = normalizePreOrderImage(image);

      if (!normalizedImage?.secure_url || !normalizedImage?.public_id) {
        return res.status(400).json({
          message: "Product image with secure_url and public_id is required"
        });
      }

      product.image = normalizedImage;
    }

    await product.save();

    res.status(200).json({
      message: "Pre-order product updated successfully",
      product
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Delete Pre-order Product (Admin - Soft Delete) ============================
export const deletePreOrderProduct = async (req, res, next) => {
  try {
    const product = await PreOrderProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Pre-order product not found" });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      message: "Pre-order product removed"
    });
  } catch (error) {
    next(error);
  }
};
