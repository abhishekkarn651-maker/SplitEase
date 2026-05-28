const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

/**
 * ========================================
 * CLOUDINARY CONFIGURATION
 * ========================================
 *
 * Sets up Cloudinary SDK and multer-storage-cloudinary
 * for handling community post photo uploads.
 *
 * Limits:
 *  - Max 5 files per upload
 *  - Max 5MB per file
 *  - Allowed: jpeg, png, webp
 *  - Folder: splitease/community/
 */

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "splitease/community",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto" }],
  },
});

// File filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

// Multer upload middleware — max 5 photos, 10MB each
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});

module.exports = { cloudinary, upload };
