
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const Media = require("../models/media.model");
const { err, uid } = require("../utils/common");

// ==========================================
// MAKKAL VALIMAI - LOCAL MEDIA STORAGE
//
// Supported:
// JPG, PNG, WebP
// MP3
// OGG / Opus / Vorbis
// MP4, WebM
// ==========================================

// Local development storage folder
const STORAGE_ROOT = path.resolve(
  process.cwd(),
  "uploads",
  "media"
);

// ==========================================
// DETECT GENUINE OGG AUDIO
// ==========================================

function isValidOggAudio(buffer) {

  // OGG page needs at least 27 bytes.
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 28
  ) {
    return false;
  }

  // Every OGG container begins with "OggS".
  if (
    buffer.subarray(0, 4).toString("ascii") !==
    "OggS"
  ) {
    return false;
  }

  // Supported OGG stream structure version.
  if (buffer[4] !== 0) {
    return false;
  }

  // The first page contains a segment table.
  const segmentCount = buffer[26];

  const packetStart = 27 + segmentCount;

  if (segmentCount === 0) {
    return false;
  }

  if (packetStart >= buffer.length) {
    return false;
  }

  // WhatsApp recordings generally contain
  // Opus audio within an OGG container.
  const opusHeader = buffer
    .subarray(packetStart, packetStart + 8)
    .toString("ascii");

  if (opusHeader === "OpusHead") {
    return true;
  }

  // Also support ordinary OGG Vorbis recordings.
  const vorbisHeader = buffer.subarray(
    packetStart,
    packetStart + 7
  );

  const isVorbis =
    vorbisHeader.length === 7 &&
    vorbisHeader[0] === 0x01 &&
    vorbisHeader.subarray(1).toString("ascii") ===
      "vorbis";

  if (isVorbis) {
    return true;
  }

  return false;
}

// ==========================================
// DETECT ACTUAL FILE CONTENTS
// ==========================================

function detectFile(buffer) {

  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 12
  ) {
    throw err(400, "Invalid or empty file");
  }

  // ======================================
  // JPEG
  // ======================================

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return [
      "image",
      "image/jpeg",
      "jpg"
    ];
  }

  // ======================================
  // PNG
  // ======================================

  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([
        137, 80, 78, 71,
        13, 10, 26, 10
      ])
    )
  ) {
    return [
      "image",
      "image/png",
      "png"
    ];
  }

  // ======================================
  // WEBP
  // ======================================

  if (
    buffer.subarray(0, 4).toString() ===
      "RIFF" &&
    buffer.subarray(8, 12).toString() ===
      "WEBP"
  ) {
    return [
      "image",
      "image/webp",
      "webp"
    ];
  }

  // ======================================
  // MP3
  // ======================================

  if (
    buffer.subarray(0, 3).toString() === "ID3" ||
    (
      buffer[0] === 0xff &&
      (buffer[1] & 0xe0) === 0xe0
    )
  ) {
    return [
      "audio",
      "audio/mpeg",
      "mp3"
    ];
  }

  // ======================================
  // OGG AUDIO - NEW
  // ======================================

  if (isValidOggAudio(buffer)) {
    return [
      "audio",
      "audio/ogg",
      "ogg"
    ];
  }

  // ======================================
  // MP4
  // ======================================

  if (
    buffer.subarray(4, 8).toString() === "ftyp"
  ) {
    return [
      "video",
      "video/mp4",
      "mp4"
    ];
  }

  // ======================================
  // WEBM
  // ======================================

  if (
    buffer.subarray(0, 4).equals(
      Buffer.from([
        0x1a,
        0x45,
        0xdf,
        0xa3
      ])
    ) &&
    buffer
      .subarray(0, 1024)
      .includes(Buffer.from("webm"))
  ) {
    return [
      "video",
      "video/webm",
      "webm"
    ];
  }

  throw err(
    400,
    "Unsupported or invalid file contents"
  );
}

// ==========================================
// PREVENT PATH TRAVERSAL
// ==========================================

function getLocalPath(key) {

  if (
    typeof key !== "string" ||
    !key.startsWith("local/")
  ) {
    throw err(
      404,
      "Local media file not found"
    );
  }

  const location = path.resolve(
    STORAGE_ROOT,
    key
  );

  if (
    !location.startsWith(
      STORAGE_ROOT + path.sep
    )
  ) {
    throw err(
      400,
      "Invalid media path"
    );
  }

  return location;
}

// ==========================================
// LOCAL MEDIA SERVICE
// ==========================================

module.exports = () => ({

  // ======================================
  // UPLOAD IMAGE / VIDEO / AUDIO
  // ======================================

  async upload(
    file,
    visibility = "public",
    uploader = "resident"
  ) {

    if (
      !file ||
      !file.buffer
    ) {
      throw err(
        400,
        "File required"
      );
    }

    // Detect actual uploaded file format.
    const [
      kind,
      contentType,
      extension
    ] = detectFile(file.buffer);

    // ======================================
    // NORMALIZE UPLOADED MIME TYPE
    // ======================================

    const uploadedMime = String(
      file.mimetype || ""
    )
      .split(";")[0]
      .trim()
      .toLowerCase();

    const originalExtension = path
      .extname(file.originalname || "")
      .toLowerCase();

    // ======================================
    // CHECK MIME AGAINST DETECTED CONTENT
    // ======================================

    let allowedMime =
      uploadedMime === contentType;

    // Existing MP3 MIME compatibility.
    if (
      kind === "audio" &&
      contentType === "audio/mpeg"
    ) {
      allowedMime = [
        "audio/mpeg",
        "audio/mp3"
      ].includes(uploadedMime);
    }

    // ======================================
    // WHATSAPP OGG MIME COMPATIBILITY - NEW
    // ======================================

    if (
      kind === "audio" &&
      contentType === "audio/ogg"
    ) {

      const allowedOggMimes = [
        "audio/ogg",
        "application/ogg",
        "audio/opus"
      ];

      allowedMime =
        allowedOggMimes.includes(uploadedMime);

      // Some systems label OGG files as
      // application/octet-stream.
      // Only allow this fallback for a verified
      // OGG/Opus/Vorbis file with an OGG extension.
      if (
        !allowedMime &&
        uploadedMime === "application/octet-stream"
      ) {
        allowedMime = [
          ".ogg",
          ".oga"
        ].includes(originalExtension);
      }
    }

    if (!allowedMime) {
      throw err(
        400,
        "File type does not match its contents"
      );
    }

    // ======================================
    // MAXIMUM ALLOWED SIZES
    // ======================================

    const maxSize = {
      image: 10 * 1000 * 1000,
      audio: 25 * 1000 * 1000,
      video: 60 * 1000 * 1000
    };

    if (
      file.buffer.length > maxSize[kind]
    ) {
      throw err(
        400,
        "File exceeds the allowed size"
      );
    }

    // ======================================
    // VISIBILITY VALIDATION
    // ======================================

    if (
      visibility !== "public" &&
      visibility !== "private"
    ) {
      throw err(
        400,
        "Invalid media visibility"
      );
    }

    // Resident issue uploads remain image-only.
    if (
      visibility === "private" &&
      kind !== "image"
    ) {
      throw err(
        400,
        "Public issue uploads must be images"
      );
    }

    let bytes = file.buffer;

    let ext = extension;

    let mime = contentType;

    // ======================================
    // OPTIMIZE IMAGES TO WEBP
    // ======================================

    if (kind === "image") {

      try {

        bytes = await sharp(
          bytes,
          {
            limitInputPixels: 20000000
          }
        )
          .rotate()
          .webp({
            quality: 82
          })
          .toBuffer();

        ext = "webp";

        mime = "image/webp";

      } catch {

        throw err(
          400,
          "Invalid image"
        );

      }
    }

    // MP3 and OGG stay in their original
    // audio encoding.
    // This service does not convert formats.

    // ======================================
    // GENERATE MEDIA ID
    // ======================================

    const id = uid();

    // Keep the MongoDB r2Key field
    // for compatibility.

    const key =
      `local/${visibility}/` +
      `${new Date().toISOString().slice(0, 7)}/` +
      `${id}.${ext}`;

    const location =
      getLocalPath(key);

    // ======================================
    // CREATE STORAGE DIRECTORY
    // ======================================

    await fs.promises.mkdir(
      path.dirname(location),
      {
        recursive: true
      }
    );

    // ======================================
    // SAVE FILE TO LOCAL STORAGE
    // ======================================

    await fs.promises.writeFile(
      location,
      bytes,
      {
        flag: "wx"
      }
    );

    // ======================================
    // SAVE METADATA TO MONGODB
    // ======================================

    try {

      await Media.create({
        id,
        r2Key: key,
        contentType: mime,
        size: bytes.length,
        kind,
        visibility,
        uploadedBy: uploader,
        status: "ready"
      });

    } catch (error) {

      // Remove orphaned file if
      // MongoDB insert fails.

      await fs.promises
        .unlink(location)
        .catch(() => {});

      throw error;
    }

    // ======================================
    // RETURN MEDIA URL
    // ======================================

    return {
      id,
      url:
        visibility === "public"
          ? `/api/public/media/${id}`
          : undefined,
      kind
    };
  },

  // ======================================
  // APPROVE PRIVATE ISSUE IMAGE
  // ======================================

  async approve(id) {

    const item = await Media.findOne({
      id,
      status: "ready"
    });

    if (!item) {
      throw err(
        404,
        "Media not found"
      );
    }

    if (
      item.visibility !== "public"
    ) {
      item.visibility = "public";
      await item.save();
    }

    return `/api/public/media/${id}`;
  },

  // ======================================
  // READ MEDIA FILE
  // ======================================

  async get(
    id,
    publicOnly = true
  ) {

    const item = await Media.findOne({
      id,
      status: "ready"
    }).select("+r2Key");

    if (!item) {
      throw err(
        404,
        "Media not found"
      );
    }

    // Private issue photos must remain private.
    if (
      publicOnly &&
      item.visibility !== "public"
    ) {
      throw err(
        404,
        "File not found"
      );
    }

    const location =
      getLocalPath(item.r2Key);

    try {

      await fs.promises.access(
        location,
        fs.constants.R_OK
      );

    } catch {

      throw err(
        404,
        "Stored file not found"
      );

    }

    return {
      stream:
        fs.createReadStream(location),

      contentType:
        item.contentType
    };
  },

  // ======================================
  // REMOVE MEDIA FILE
  // ======================================

  async remove(id) {

    const item = await Media.findOne({
      id,
      status: "ready"
    }).select("+r2Key");

    if (!item) {
      throw err(
        404,
        "Media not found"
      );
    }

    const location =
      getLocalPath(item.r2Key);

    await fs.promises.unlink(
      location
    );

    item.status = "deleted";

    await item.save();

    return {
      deleted: true
    };
  }

});
