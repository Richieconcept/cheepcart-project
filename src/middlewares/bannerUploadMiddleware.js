import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/svg+xml"
];

const bannerUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Banner slider supports mixed media, unlike the general upload middleware.
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isSvg = allowedMimeTypes.includes(file.mimetype);

    if (isImage || isVideo || isSvg) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, or svg files are allowed"), false);
    }
  }
});

export default bannerUpload;
