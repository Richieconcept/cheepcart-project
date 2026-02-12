import Category from "../models/category.js";

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res, next) => {
  try {
    const { name, image, order } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Category name is required");
    }

    const category = await Category.create({
      name,
      image,
      order
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });

  } catch (error) {
    next(error);
  }
};




// ================= GET ALL CATEGORIES =================
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      categories,
    });

  } catch (error) {
    next(error);
  }
};



// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res, next) => {
  try {
    const { name, image, isActive, order } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    if (name) category.name = name;
    if (image) category.image = image;
    if (typeof isActive === "boolean") category.isActive = isActive;
    if (order !== undefined) category.order = order;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });

  } catch (error) {
    next(error);
  }
};




// ================= DELETE CATEGORY =================
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category disabled successfully",
    });

  } catch (error) {
    next(error);
  }
};
