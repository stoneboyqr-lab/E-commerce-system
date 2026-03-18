import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
} from "../controllers/notificationController.js";
import { verifyUser } from "../middleware/verifyUser.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/", verifyUser, getUserNotifications);
router.patch("/read-all", verifyUser, markAllAsRead);
router.patch("/:id/read", verifyUser, markAsRead);
router.delete("/:id", verifyUser, deleteNotification);
router.post("/broadcast", verifyAdmin, broadcastNotification);

export default router;