import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["order", "promo", "system"],
    default: "system",
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);