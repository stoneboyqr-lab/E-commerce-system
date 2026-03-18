import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Product title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Product description is required"],
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: 0,
  },
  salePrice: {
    type: Number,
    default: null,
  },
  onSale: {
    type: Boolean,
    default: false,
  },
  saleEnds: {
    type: Date,
    default: null,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
  },
  images: [String],
  stock: {
    type: Number,
    required: [true, "Stock is required"],
    min: 0,
    default: 0,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);