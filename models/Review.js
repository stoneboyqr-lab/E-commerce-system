import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, "Review comment is required"],
    trim: true,
  },
}, { timestamps: true });

// One review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);