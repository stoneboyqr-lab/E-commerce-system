import express from "express";
import {
  initializeOrder,
  verifyPayment,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { verifyUser } from "../middleware/verifyUser.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/initialize", verifyUser, initializeOrder);
router.post("/verify-payment", verifyUser, verifyPayment);
router.get("/", verifyUser, getUserOrders);
router.get("/admin/all", verifyAdmin, getAllOrders);
router.get("/:id", verifyUser, getOrder);
router.patch("/:id/status", verifyAdmin, updateOrderStatus);

export default router;