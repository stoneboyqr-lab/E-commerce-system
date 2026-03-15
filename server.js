import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

// Load env variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Security Middleware ──
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.set("trust proxy", 1);

// ── Rate Limiter (global) ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ── Auth Rate Limiter (login only) ──
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    console.warn(`⚠ Brute force attempt - IP: ${req.ip} - ${new Date().toISOString()}`);
    res.status(429).json({ message: "Too many login attempts. Try again later." });
  },
});

// ── CORS ──
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ── Body Parsers ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static Files ──
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── MongoDB ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✔ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Routes (will be added as we build) ──
// import authRoutes from "./routes/authRoutes.js";
// app.use("/api/auth", authRoutes);

// ── Catch all — serve frontend ──
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✔ Server running on port ${PORT}`);
});