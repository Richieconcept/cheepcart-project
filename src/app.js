import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "../src/routes/authRoutes.js";
import { notFound, errorHandler } from "../src/middlewares/errorMiddleware.js";
import userRoutes from "../src/routes/userRoutes.js";
import uploadRoutes from "../src/routes/uploadRoutes.js";
import cloudinary from "./config/cloudinary.js";
import categoryRoutes from "../src/routes/categoryRoutes.js";





const app = express();

// VERY IMPORTANT for Render / production
app.set("trust proxy", 1);






// ============cors config===================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://cheepcart-project.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.options("*", cors());



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






// ================Error handling (ALWAYS LAST)=====================
app.use(notFound);
app.use(errorHandler);





export default app;
