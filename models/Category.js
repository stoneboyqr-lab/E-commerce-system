import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  image: {
    type: String,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("Category", CategorySchema);