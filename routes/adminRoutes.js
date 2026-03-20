import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleBanUser,
  deleteUser,
  getAdminProfile,
  updateAdminProfile,
  resetAdminPassword,
} from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/dashboard", verifyAdmin, getDashboardStats);
router.get("/users", verifyAdmin, getAllUsers);
router.delete("/users/:id", verifyAdmin, deleteUser);
router.get("/profile", verifyAdmin, getAdminProfile);
router.patch("/profile", verifyAdmin, updateAdminProfile);
router.patch("/users/:id/toggle-ban", verifyAdmin, toggleBanUser);
router.patch("/password", verifyAdmin, resetAdminPassword);

export default router;