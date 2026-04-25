import Banner from "../models/banner.model.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// We infer the media type from the uploaded file so the frontend knows how to render each slide.
const getMediaTypeFromMime = (mimetype = "") => {
  if (mimetype === "image/svg+xml") return "svg";
  if (mimetype.startsWith("video/")) return "video";
  return "image";
};

// Banner uploads use a dedicated Cloudinary folder and allow mixed file types.
const streamUpload = (file, folder) => {
  return new Promise((resolve, reject) => {
    let isSettled = false;
    const timeout = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error("Banner upload to Cloudinary timed out"));
      }
    }, 60000);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto"
      },
      (error, result) => {
        if (isSettled) return;

        clearTimeout(timeout);
        isSettled = true;

        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// This keeps create/update backward-friendly while supporting the new slider array structure.
export const normalizeMediaItems = (body = {}) => {
  if (body.mediaItems) {
    return typeof body.mediaItems === "string"
      ? JSON.parse(body.mediaItems)
      : body.mediaItems;
  }

  if (body.media && body.mediaType) {
    return [
      {
        ...body.media,
        mediaType: body.mediaType,
        resource_type: body.mediaType === "video" ? "video" : "image"
      }
    ];
  }

  return [];
};

// Upload slider files sequentially to reduce long stalls when several large files hit Cloudinary together.
export const uploadBannerFiles = async files => {
  const folder = "cheepcart/banners";
  const mediaItems = [];

  console.log(`Uploading ${files.length} banner media file(s) to Cloudinary...`);

  for (const file of files) {
    console.log(`Starting upload for: ${file.originalname}`);
    const uploadedFile = await streamUpload(file, folder);
    console.log(`Completed upload for: ${file.originalname}`);

    mediaItems.push({
      secure_url: uploadedFile.secure_url,
      public_id: uploadedFile.public_id,
      mediaType: getMediaTypeFromMime(file.mimetype),
      resource_type: uploadedFile.resource_type
    });
  }

  return mediaItems;
};

// Hero and side banners each behave like one managed slider document tied to a fixed type.
export const saveBannerByType = async ({ bannerType, body = {}, files, existingBanner }) => {
  const { title, subtitle, link, order } = body;
  let mediaItems = normalizeMediaItems(body);

  if (files && files.length > 0) {
    mediaItems = await uploadBannerFiles(files);
  }

  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    const error = new Error("At least one banner media item is required");
    error.statusCode = 400;
    throw error;
  }

  if (mediaItems.length > 5) {
    const error = new Error("A banner slider can contain at most 5 media items");
    error.statusCode = 400;
    throw error;
  }

  const banner = existingBanner || new Banner({ type: bannerType });

  banner.type = bannerType;
  banner.mediaItems = mediaItems;

  // These fields stay optional and are only overwritten when the admin sends them.
  if (title !== undefined) banner.title = title;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (link !== undefined) banner.link = link;
  if (order !== undefined) banner.order = order;
  banner.isActive = true;

  await banner.save();

  return banner;
};
