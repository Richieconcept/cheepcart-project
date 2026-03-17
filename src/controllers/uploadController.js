import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cheepcart",
            transformation: [
              { width: 800, crop: "limit" },  // prevent huge images
              { quality: "auto" },            // auto compression
              { fetch_format: "auto" }        // auto convert to WebP
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    next(error);
  }
};
