import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// helper function
const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" }
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

// ✅ Upload multiple images
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const folderType = req.body.type || "general";
    const folder = `cheepcart/${folderType}`;

    const results = await Promise.all(
      req.files.map(file => streamUpload(file.buffer, folder))
    );

  const images = results.map(item => ({
  secure_url: item.secure_url,
  public_id: item.public_id
  }));

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images
    });

  } catch (error) {
    next(error);
  }
};

// ✅ Update images (delete old + upload new)
export const updateImages = async (req, res, next) => {
  try {
    const { oldImages } = req.body;

    // delete old images
    if (oldImages && oldImages.length > 0) {
      await Promise.all(
        oldImages.map(id => cloudinary.uploader.destroy(id))
      );
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new images uploaded"
      });
    }

    const results = await Promise.all(
      req.files.map(file =>
        streamUpload(file.buffer, "cheepcart/products")
      )
    );

    const images = results.map(item => ({
      url: item.secure_url,
      public_id: item.public_id
    }));

    res.status(200).json({
      success: true,
      message: "Images updated successfully",
      images
    });

  } catch (error) {
    next(error);
  }
};

// ✅ Delete images
export const deleteImages = async (req, res, next) => {
  try {
    const { public_ids } = req.body;

    if (!public_ids || public_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided"
      });
    }

    await Promise.all(
      public_ids.map(id => cloudinary.uploader.destroy(id))
    );

    res.status(200).json({
      success: true,
      message: "Images deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};