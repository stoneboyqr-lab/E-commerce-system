import Product from "../models/Product.js";

// @desc    Get all products (with search, filter, pagination)
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, onSale, page = 1, limit = 12 } = req.query;

    const query = {};

    if (search) query.title = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (onSale === "true") query.onSale = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, salePrice, onSale, saleEnds } = req.body;

    const images = req.files ? req.files.map((f) => f.filename) : [];

    const product = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      salePrice: salePrice || null,
      onSale: onSale === "true",
      saleEnds: saleEnds || null,
      images,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, salePrice, onSale, saleEnds } = req.body;

    const updates = {
      title,
      description,
      price,
      category,
      stock,
      salePrice: salePrice || null,
      onSale: onSale === "true",
      saleEnds: saleEnds || null,
    };

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((f) => f.filename);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle sale on/off
// @route   PATCH /api/products/:id/toggle-sale
export const toggleSale = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.onSale = !product.onSale;
    if (!product.onSale) {
      product.salePrice = null;
      product.saleEnds = null;
    }

    await product.save();
    res.json({ message: `Sale ${product.onSale ? "enabled" : "disabled"}`, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};