import express from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
  getAllReviews,
} from "../controllers/reviewController.js";
import { verifyUser } from "../middleware/verifyUser.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/", verifyAdmin, getAllReviews);
router.get("/:productId", getProductReviews);
router.post("/:productId", verifyUser, createReview);
router.delete("/:id", verifyAdmin, deleteReview);

export default router;