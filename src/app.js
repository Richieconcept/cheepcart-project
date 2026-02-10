import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "../src/routes/authRoutes.js";
import { notFound, errorHandler } from "../src/middlewares/errorMiddleware.js";








const app = express();

// VERY IMPORTANT for Render / production
app.set("trust proxy", 1);




// Security & middleware
app.use(cors());
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

// ================Error handling (ALWAYS LAST)=====================
app.use(notFound);
app.use(errorHandler);




const allowedOrigins = [
  process.env.FRONTEND_URL
];

// cors ======================================configuration==================================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);


export default app;
