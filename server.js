import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Wait for MongoDB before accepting requests so auth/controllers do not hit buffering timeouts.
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CheepCart server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
