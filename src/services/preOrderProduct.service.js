import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const streamUpload = file => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cheepcart/pre-order-products",
        resource_type: "image",
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

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadPreOrderImage = async file => {
  const uploadedFile = await streamUpload(file);

  return {
    secure_url: uploadedFile.secure_url,
    public_id: uploadedFile.public_id
  };
};

export const deletePreOrderImage = async publicId => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

export const normalizePreOrderImage = image => {
  if (!image) return undefined;

  if (typeof image === "string") {
    try {
      return JSON.parse(image);
    } catch {
      return undefined;
    }
  }

  return image;
};
