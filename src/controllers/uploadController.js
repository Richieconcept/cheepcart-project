import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No images uploaded");
    }

    const uploadedImages = [];

    // If there's an existing image public_id, delete the old image first
    if (req.body.public_id) {
      await cloudinary.uploader.destroy(req.body.public_id, (error, result) => {
        if (error) {
          res.status(500).json({ message: "Error deleting previous image", error });
          return;
        }
      });
    }

    // Function to upload a single image to Cloudinary
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cheepcart",
            transformation: [
              { width: 800, crop: "limit" },  // Prevent uploading huge images
              { quality: "auto" },             // Auto compression
              { fetch_format: "auto" }         // Auto convert to WebP
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

    // Loop over each uploaded file and upload them one by one
    for (const file of req.files) {
      const result = await streamUpload(file.buffer);
      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    // Send back the URLs and public_ids of the uploaded images
    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: uploadedImages
    });

  } catch (error) {
    next(error);
  }
};