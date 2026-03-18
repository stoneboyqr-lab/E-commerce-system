import Notification from "../models/Notification.js";

// @desc    Get user notifications
// @route   GET /api/notifications
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Send notification to all users (admin)
// @route   POST /api/notifications/broadcast
export const broadcastNotification = async (req, res) => {
  const { message, type } = req.body;

  try {
    const User = (await import("../models/User.js")).default;
    const users = await User.find({ isActive: true }, "_id");

    const notifications = users.map((user) => ({
      user: user._id,
      message,
      type: type || "system",
    }));

    await Notification.insertMany(notifications);

    res.json({ message: `Notification sent to ${users.length} users` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};