import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", verifyAdmin, upload.single("image"), createCategory);
router.put("/:id", verifyAdmin, upload.single("image"), updateCategory);
router.delete("/:id", verifyAdmin, deleteCategory);

export default router;