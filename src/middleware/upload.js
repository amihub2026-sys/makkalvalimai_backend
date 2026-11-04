
const multer = require("multer");
const path = require("node:path");

// ==========================================
// MAKKAL VALIMAI - FILE UPLOAD MIDDLEWARE
// Images, MP3, WhatsApp OGG, MP4 and WebM
// ==========================================

// Existing supported file types + OGG audio.

const allowedTypes = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // MP3 audio
  "audio/mpeg",
  "audio/mp3",

  // WhatsApp OGG / Opus audio
  "audio/ogg",
  "application/ogg",
  "audio/opus",

  // Video
  "video/mp4",
  "video/webm"
]);

// ==========================================
// MULTER UPLOAD CONFIGURATION
// ==========================================

const upload = multer({

  // Keep uploaded files temporarily in memory.
  // The existing media controller handles storage.

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 60 * 1024 * 1024,
    files: 1
  },

  fileFilter: (req, file, cb) => {

    const mimeType = (file.mimetype || "")
      .split(";")[0]
      .toLowerCase()
      .trim();

    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    // ======================================
    // VALIDATE OGG AUDIO EXTENSION
    // ======================================

    const oggTypes = new Set([
      "audio/ogg",
      "application/ogg",
      "audio/opus"
    ]);

    if (oggTypes.has(mimeType)) {

      if (
        extension === ".ogg" ||
        extension === ".oga"
      ) {
        return cb(null, true);
      }

      return cb(
        new Error(
          "Invalid OGG audio extension. Use .ogg or .oga."
        )
      );
    }

    // ======================================
    // VALIDATE EXISTING SUPPORTED FILE TYPES
    // ======================================

    if (allowedTypes.has(mimeType)) {
      return cb(null, true);
    }

    // ======================================
    // REJECT UNSUPPORTED FILES
    // ======================================

    return cb(
      new Error(
        "Unsupported file type. Upload JPG, PNG, WebP, MP3, OGG, MP4 or WebM."
      )
    );
  }

});

module.exports = upload;
