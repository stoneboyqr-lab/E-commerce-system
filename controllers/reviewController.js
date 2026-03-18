import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// @desc    Create review
// @route   POST /api/reviews/:productId
export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  try {
    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      "items.product": productId,
      paymentStatus: "paid",
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "You can only review products you have purchased",
      });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      user: req.user.id,
      product: productId,
    });

    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      comment,
    });

    // Update product ratings
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      ratings: avgRating.toFixed(1),
      reviewCount: reviews.length,
    });

    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Recalculate product ratings
    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.length
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    await Product.findByIdAndUpdate(review.product, {
      ratings: avgRating.toFixed(1),
      reviewCount: reviews.length,
    });

    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("product", "title")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};