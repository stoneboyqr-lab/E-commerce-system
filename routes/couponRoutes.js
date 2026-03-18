import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  toggleCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { verifyUser } from "../middleware/verifyUser.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/validate", verifyUser, validateCoupon);
router.get("/", verifyAdmin, getCoupons);
router.post("/", verifyAdmin, createCoupon);
router.patch("/:id/toggle", verifyAdmin, toggleCoupon);
router.delete("/:id", verifyAdmin, deleteCoupon);

export default router;