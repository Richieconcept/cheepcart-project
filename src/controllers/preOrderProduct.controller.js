import PreOrderProduct from "../models/preOrderProduct.model.js";
import {
  deletePreOrderImages,
  normalizePreOrderImages,
  uploadPreOrderImages
} from "../services/preOrderProduct.service.js";

const MAX_PRE_ORDER_IMAGES = 4;

const getUploadedPreOrderImages = req => {
  if (!req.files) return [];

  if (Array.isArray(req.files)) {
    return req.files;
  }

  return [
    ...(req.files.images || []),
    ...(req.files.image || [])
  ];
};

const getStoredPreOrderImages = product => {
  if (product.images?.length) return product.images;
  if (product.image) return [product.image];
  return [];
};

const validatePreOrderImages = images => {
  if (!Array.isArray(images) || images.length === 0) {
    return "At least one product image with secure_url and public_id is required";
  }

  if (images.length > MAX_PRE_ORDER_IMAGES) {
    return "You can upload up to 4 pre-order product images";
  }

  if (images.some(image => !image?.secure_url || !image?.public_id)) {
    return "Each product image must include secure_url and public_id";
  }

  return null;
};

// ============================ Create Pre-order Product (Admin) ============================
export const createPreOrderProduct = async (req, res, next) => {
  try {
    const { name, description, price, status, displayOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const uploadedImages = getUploadedPreOrderImages(req);

    if (uploadedImages.length > MAX_PRE_ORDER_IMAGES) {
      return res.status(400).json({
        message: "You can upload up to 4 pre-order product images"
      });
    }

    const images = uploadedImages.length
      ? await uploadPreOrderImages(uploadedImages)
      : normalizePreOrderImages(req.body.images ?? req.body.image);

    const imageError = validatePreOrderImages(images);

    if (imageError) {
      return res.status(400).json({ message: imageError });
    }

    const product = await PreOrderProduct.create({
      name,
      description,
      price,
      image: images[0],
      images,
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

    const { image, images, ...updates } = req.body;
    Object.assign(product, updates);

    const uploadedImages = getUploadedPreOrderImages(req);
    let oldImagesToDelete = [];

    if (uploadedImages.length > MAX_PRE_ORDER_IMAGES) {
      return res.status(400).json({
        message: "You can upload up to 4 pre-order product images"
      });
    }

    if (uploadedImages.length) {
      oldImagesToDelete = getStoredPreOrderImages(product);
      const nextImages = await uploadPreOrderImages(uploadedImages);
      product.images = nextImages;
      product.image = nextImages[0];
    } else if (images !== undefined || image !== undefined) {
      const normalizedImages = normalizePreOrderImages(images ?? image);
      const imageError = validatePreOrderImages(normalizedImages);

      if (imageError) {
        return res.status(400).json({ message: imageError });
      }

      product.images = normalizedImages;
      product.image = normalizedImages[0];
    }

    await product.save();

    if (oldImagesToDelete.length) {
      deletePreOrderImages(oldImagesToDelete).catch(error => {
        console.error("Failed to delete old pre-order product images", error);
      });
    }

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
