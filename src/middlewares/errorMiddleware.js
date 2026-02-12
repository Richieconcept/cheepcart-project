export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Server error";

  // ================= Multer File Size Error =================
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message =
      "Image too large. Maximum allowed size is 2MB. Please reduce the file size.";
  }

  // ================= Multer File Type Error =================
  if (err.message === "Only image files are allowed") {
    statusCode = 400;
    message = "Only image files are allowed.";
  }

  // ================= MongoDB Duplicate Key Error =================
  if (err.code === 11000) {
    statusCode = 400;

    const field = Object.keys(err.keyValue || {})[0];

    if (field) {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    } else {
      message = "Duplicate field value entered.";
    }
  }

  // ================= MongoDB Cast Error (Invalid ID) =================
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
