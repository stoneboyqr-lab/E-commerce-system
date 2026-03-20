import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
// import helmet from "helmet";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import startSaleExpiryJob from "./utils/saleExpiry.js";
import dns from "dns"

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Must be first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS
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

// Body parsing — must be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
// app.use(helmet());
app.use(hpp());
app.set("trust proxy", 1);

// Manual XSS and MongoDB injection sanitization
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return;
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key].replace(/\$/g, "");
        obj[key] = obj[key].replace(/<script.*?>.*?<\/script>/gi, "");
        obj[key] = obj[key].replace(/<[^>]*>/g, "");
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
  
  // Start cron jobs
startSaleExpiryJob();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/api/config/paystack", (req, res) => {
  res.json({ publicKey: process.env.PAYSTACK_PUBLIC_KEY });
});

app.get("/", (req, res) => {
  res.send("E-commerce API running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});