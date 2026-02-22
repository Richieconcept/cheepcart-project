import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";





// ==========================Add to Cart===============================================================

export const addToCart = async (req, res, next) => {
  try {

    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock"
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: product.price
      });
    }

    // Recalculate totals
    cart.totalItems = cart.items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart
    });

  } catch (error) {
    next(error);
  }
};




// ====================GET USER CART======================================


export const getCart = async (req, res, next) => {
  try {

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name slug price images stock");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      cart
    });

  } catch (error) {
    next(error);
  }
};




// ============================UPDATE ITEM QUANTITY==========================================

export const updateCartItem = async (req, res, next) => {
  try {

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    const product = await Product.findById(productId);

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    item.quantity = quantity;

    cart.totalItems = cart.items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart
    });

  } catch (error) {
    next(error);
  }
};


// =======================================REMOVE ITEM===================================

export const removeFromCart = async (req, res, next) => {
  try {

    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    cart.totalItems = cart.items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed",
      cart
    });

  } catch (error) {
    next(error);
  }
};



// ==============================CLEAR CART============================


export const clearCart = async (req, res, next) => {
  try {

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalItems: 0, totalPrice: 0 }
    );

    res.status(200).json({
      success: true,
      message: "Cart cleared"
    });

  } catch (error) {
    next(error);
  }
};



// ===========merge cart comming from frontend storage (hybrid approach)=============

export const mergeCart = async (req, res, next) => {
  try {

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        message: "Invalid cart items"
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    for (const guestItem of items) {

      const product = await Product.findById(guestItem.productId);

      if (!product || !product.isActive) continue;

      if (product.stock < guestItem.quantity) continue;

      const existingItem = cart.items.find(
        item => item.product.toString() === guestItem.productId
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        cart.items.push({
          product: product._id,
          quantity: guestItem.quantity,
          price: product.price
        });
      }
    }

    // Recalculate totals
    cart.totalItems = cart.items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart merged successfully",
      cart
    });

  } catch (error) {
    next(error);
  }
};