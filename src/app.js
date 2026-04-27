import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "../src/routes/authRoutes.js";
import { startShipmentSyncJob } from "./jobs/shipmentSync.job.js";
import { notFound, errorHandler } from "../src/middlewares/errorMiddleware.js";
import userRoutes from "../src/routes/userRoutes.js";
import uploadRoutes from "../src/routes/uploadRoutes.js";
import cloudinary from "./config/cloudinary.js";
import categoryRoutes from "../src/routes/categoryRoutes.js";
import productRoutes from "./routes/product.routes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkout.route.js";
import shippingRoutes from "./routes/shipping.route.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import shipmentRoutes from "./routes/shipment.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import sideBannerRoutes from "./routes/sideBanner.routes.js";
import preOrderProductRoutes from "./routes/preOrderProduct.routes.js";
import preOrderEnquiryRoutes from "./routes/preOrderEnquiry.routes.js";











const app = express();

// VERY IMPORTANT for Render / production
app.set("trust proxy", 1);


// cron job for automatic shipment tracking
startShipmentSyncJob();



// ============ CORS config =======================================

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://cheepcart-project.onrender.com",
  "https://cheepcart-api-documentation.vercel.app",
  "https://cheepcart.vercel.app",
  "https://cheepcart-15o1.vercel.app",
]);

const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
};

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(normalizeOrigin(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS to all routes
app.use(cors(corsOptions));




// ✅ FIRST: webhook raw parser (VERY IMPORTANT)
app.use(
  "/api/payments/webhook",
  express.raw({ type: "*/*" })
);




// Security & middleware
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CheepCart API is running" });
});



// =================routing===================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/banners", bannerRoutes);  
app.use("/api/side-banners", sideBannerRoutes);
app.use("/api/pre-order-products", preOrderProductRoutes);
app.use("/api/pre-order-enquiries", preOrderEnquiryRoutes);

// cart route
app.use("/api/cart", cartRoutes);

// Use Checkout Routes
app.use("/api/checkout", checkoutRoutes);






// ================Error handling (ALWAYS LAST)=====================
app.use(notFound);
app.use(errorHandler);





export default app;
