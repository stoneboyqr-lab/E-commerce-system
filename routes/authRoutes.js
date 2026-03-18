import express from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import { verifyUser } from "../middleware/verifyUser.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  handler: (req, res) => {
    console.warn(`⚠ Brute force attempt - IP: ${req.ip} - ${new Date().toISOString()}`);
    res.status(429).json({ message: "Too many login attempts. Try again later." });
  },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", verifyUser, getMe);

export default router;