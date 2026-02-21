import User from "../models/user.js";

// ====================== GET USER PROFILE ======================
export const getUserProfile = async (req, res, next) => {
  try {
    // req.user already populated by protect middleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isVerified: req.user.isVerified,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};






// ====================== UPDATE USER PROFILE ======================
export const updateUserProfile = async (req, res, next) => {
  try {
    const {name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};






// ====================== GET ALL USERS (ADMIN) ======================
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password -emailVerificationCode -passwordResetCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// ====================== GET SINGLE USER (ADMIN) ======================
export const getSingleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -emailVerificationCode -passwordResetCode");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ====================== UPDATE USER ROLE (ADMIN) ======================
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ====================== DEACTIVATE USER (ADMIN) ======================
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ====================== ACTIVATE USER (ADMIN) ======================
export const activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User activated successfully"
    });
  } catch (error) {
    next(error);
  }
};




// ===========================GET WISHLIST===============================================

export const getWishlist = async (req, res, next) => {
  try {

    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        match: { isActive: true },
        select: "name slug price images averageRating totalReviews stock"
      });

    res.status(200).json({
      success: true,
      total: user.wishlist.length,
      wishlist: user.wishlist
    });

  } catch (error) {
    next(error);
  }
};



// ======================ADD TO WISHLIST (SAFE VERSION)=================================



import Product from "../models/product.model.js";

export const addToWishlist = async (req, res, next) => {
  try {

    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        message: "Product already in wishlist"
      });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist"
    });

  } catch (error) {
    next(error);
  }
};




// =============================REMOVE FROM WISHLIST===================================


export const removeFromWishlist = async (req, res, next) => {
  try {

    const productId = req.params.productId;

    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist"
    });

  } catch (error) {
    next(error);
  }
};





// ================CLEAR WISHLIST=========================================

export const clearWishlist = async (req, res, next) => {
  try {

    const user = await User.findById(req.user._id);

    user.wishlist = [];

    await user.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared"
    });

  } catch (error) {
    next(error);
  }
};