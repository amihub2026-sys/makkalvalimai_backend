
const { wrap } = require("../utils/common");

exports.make = (media) => ({

  // ==========================================
  // ADMIN MEDIA UPLOAD
  // ==========================================

  upload: wrap(async (req, res) => {

    const result = await media.upload(
      req.file,
      "public",
      String(req.admin._id)
    );

    res.status(201).json(result);

  }),

  // ==========================================
  // PUBLIC IMAGE / VIDEO / AUDIO
  // ==========================================

  publicRead: wrap(async (req, res) => {

    const file = await media.get(
      req.params.id,
      true
    );

    res.set({
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin"
    });

    file.stream.pipe(res);

  }),

  // ==========================================
  // PRIVATE ISSUE PHOTOS
  // ADMIN ACCESS ONLY
  // ==========================================

  privateRead: wrap(async (req, res) => {

    const file = await media.get(
      req.params.id,
      false
    );

    res.set({
      "Content-Type": file.contentType,

      // Never cache private issue photos
      "Cache-Control": "private, no-store",

      "X-Content-Type-Options": "nosniff",

      // Allow localhost:4200 to display images
      // served from localhost:5000.
      // Both origins belong to the same site.
      "Cross-Origin-Resource-Policy": "same-site"
    });

    file.stream.pipe(res);

  }),

  // ==========================================
  // DELETE MEDIA
  // ==========================================

  remove: wrap(async (req, res) => {

    await media.remove(req.params.id);

    res.json({
      deleted: true
    });

  })

});
