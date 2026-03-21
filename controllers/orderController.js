import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import { verifyPaystackTransaction } from "../utils/paystackHelper.js";

// @desc    Initialize order + Paystack payment
// @route   POST /api/orders/initialize
export const initializeOrder = async (req, res) => {
  const { deliveryAddress, couponCode } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "title price salePrice onSale stock");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product.title}`,
        });
      }
    }

    // Calculate total
    let totalBeforeDiscount = cart.items.reduce((acc, item) => {
      const price = item.product.onSale && item.product.salePrice
        ? item.product.salePrice
        : item.product.price;
      return acc + price * item.quantity;
    }, 0);

    let discountAmount = 0;
    let couponId = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon && totalBeforeDiscount >= coupon.minOrderAmount) {
        discountAmount = coupon.type === "percentage"
          ? (totalBeforeDiscount * coupon.discount) / 100
          : coupon.discount;
        couponId = coupon._id;
      }
    }

    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    // Build order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.onSale && item.product.salePrice
        ? item.product.salePrice
        : item.product.price,
    }));

    // Create pending order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      deliveryAddress,
      coupon: couponId,
      totalBeforeDiscount,
      discountAmount,
      totalAfterDiscount,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    res.status(201).json({
      message: "Order initialized",
      order,
      paystackAmount: totalAfterDiscount * 100, // Paystack uses kobo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Verify payment and confirm order
// @route   POST /api/orders/verify-payment
export const verifyPayment = async (req, res) => {
  const { reference, orderId } = req.body;

  try {
    const paystackRes = await verifyPaystackTransaction(reference);

    if (!paystackRes || !paystackRes.data) {
      return res.status(400).json({ message: "Payment verification failed - could not reach paystack" });
    }

    if (
      paystackRes.data.status !== "success"
    ) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update order
    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.paymentReference = reference;
    await order.save();

    // Deduct stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Increment coupon usage
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon, {
        $inc: { usedCount: 1 },
      });
    }

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user.id });

    // Create notification
    await Notification.create({
      user: req.user.id,
      message: `Your order ${order.orderId} has been confirmed and is being processed.`,
      type: "order",
    });

    res.json({ message: "Payment verified, order confirmed", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "title images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "title images price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "title")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update order status (admin)
// @route   PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const { orderStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Notify user
    await Notification.create({
      user: order.user,
      message: `Your order ${order.orderId} status has been updated to ${orderStatus}.`,
      type: "order",
    });

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};