import Category from "../models/Category.js";
import slugify from "slugify";

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create category
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  const { name } = req.body;

  try {
    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      slug,
      image: req.file ? req.file.path : null,
    });

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  const { name } = req.body;

  try {
    const slug = slugify(name, { lower: true, strict: true });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, image: req.file ? req.file.path : undefined },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};