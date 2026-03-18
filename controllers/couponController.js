import Coupon from "../models/Coupon.js";

// @desc    Validate coupon
// @route   POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  const { code, orderTotal } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is inactive" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: "Coupon has expired" });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount is ₦${coupon.minOrderAmount.toLocaleString()}`,
      });
    }

    const discount =
      coupon.type === "percentage"
        ? (orderTotal * coupon.discount) / 100
        : coupon.discount;

    res.json({
      message: "Coupon applied",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount,
      },
      discountAmount: discount,
      totalAfterDiscount: orderTotal - discount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create coupon
// @route   POST /api/coupons
export const createCoupon = async (req, res) => {
  try {
    const { code, type, discount, minOrderAmount, usageLimit, expiresAt } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({
      code,
      type,
      discount,
      minOrderAmount,
      usageLimit,
      expiresAt,
    });

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle coupon active/inactive
// @route   PATCH /api/coupons/:id/toggle
export const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`, coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json({ message: "Coupon deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};