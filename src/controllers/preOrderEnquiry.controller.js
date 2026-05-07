import PreOrderEnquiry from "../models/preOrderEnquiry.model.js";
import PreOrderProduct from "../models/preOrderProduct.model.js";

const allowedStatuses = ["pending", "contacted", "confirmed", "cancelled", "completed"];

// ============================ Submit Pre-order Enquiry (Public) ============================
export const createPreOrderEnquiry = async (req, res, next) => {
  try {
    const {
      productId,
      fullName,
      phone,
      email,
      quantity,
      location,
      message
    } = req.body;

    if (!productId || !fullName || !phone) {
      return res.status(400).json({
        message: "Product, full name and phone number are required"
      });
    }

    const product = await PreOrderProduct.findOne({
      _id: productId,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Pre-order product not found" });
    }

    if (product.status === "closed") {
      return res.status(400).json({
        message: "This pre-order product is currently closed"
      });
    }

    const productImages = product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [];

    const enquiry = await PreOrderEnquiry.create({
      product: product._id,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: productImages[0],
        images: productImages
      },
      fullName,
      phone,
      email,
      quantity,
      location,
      message
    });

    res.status(201).json({
      message: "Pre-order enquiry submitted successfully",
      enquiry
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Get Pre-order Enquiries (Admin) ============================
export const getPreOrderEnquiries = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.product) {
      filter.product = req.query.product;
    }

    const enquiries = await PreOrderEnquiry.find(filter)
      .populate("product", "name slug price image images status isActive")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PreOrderEnquiry.countDocuments(filter);

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      enquiries
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Get Single Pre-order Enquiry (Admin) ============================
export const getSinglePreOrderEnquiry = async (req, res, next) => {
  try {
    const enquiry = await PreOrderEnquiry.findById(req.params.id)
      .populate("product", "name slug price image images status isActive");

    if (!enquiry) {
      return res.status(404).json({ message: "Pre-order enquiry not found" });
    }

    res.status(200).json(enquiry);
  } catch (error) {
    next(error);
  }
};

// ============================ Update Pre-order Enquiry Status (Admin) ============================
export const updatePreOrderEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid enquiry status"
      });
    }

    const enquiry = await PreOrderEnquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Pre-order enquiry not found" });
    }

    enquiry.status = status;
    await enquiry.save();

    res.status(200).json({
      message: "Pre-order enquiry status updated successfully",
      enquiry
    });
  } catch (error) {
    next(error);
  }
};

// ============================ Delete Pre-order Enquiry (Admin) ============================
export const deletePreOrderEnquiry = async (req, res, next) => {
  try {
    const enquiry = await PreOrderEnquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Pre-order enquiry not found" });
    }

    res.status(200).json({
      message: "Pre-order enquiry deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
