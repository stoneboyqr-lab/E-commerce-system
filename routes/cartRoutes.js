import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

router.get("/", verifyUser, getCart);
router.post("/", verifyUser, addToCart);
router.patch("/:itemId", verifyUser, updateCartItem);
router.delete("/:itemId", verifyUser, removeFromCart);
router.delete("/", verifyUser, clearCart);

export default router;