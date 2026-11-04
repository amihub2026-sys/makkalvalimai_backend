
const crypto = require("node:crypto");
const { z } = require("zod");

// ======================================
// BILINGUAL CONTENT
// ======================================

const bi = z.object({
  ta: z.string().default(""),
  en: z.string().default("")
});

const audio = bi;

// ======================================
// SAFE MEDIA URL VALIDATION
// ======================================

function isSafeUrl(value) {
  if (value === "") {
    return true;
  }

  // Backend media reference
  // Example: /api/public/media/UUID
  if (
    /^\/api\/public\/media\/[a-f0-9-]+$/i.test(value)
  ) {
    return true;
  }

  try {
    const url = new URL(value);

    // No embedded usernames or passwords
    if (url.username || url.password) {
      return false;
    }

    // Production-compatible HTTPS URLs
    if (url.protocol === "https:") {
      return true;
    }

    // Local development media only
    // Never allow these HTTP URLs in production
    const isDevelopment =
      process.env.NODE_ENV !== "production";

    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";

    const isLocalMedia =
      url.protocol === "http:" &&
      isLocalhost &&
      url.port === "5000" &&
      /^\/api\/public\/media\/[a-f0-9-]+$/i.test(
        url.pathname
      ) &&
      !url.search &&
      !url.hash;

    if (isDevelopment && isLocalMedia) {
      return true;
    }

    return false;

  } catch {
    return false;
  }
}

const safeUrl = z
  .string()
  .max(2048)
  .refine(isSafeUrl, "Invalid URL");

// ======================================
// UNIQUE ID
// ======================================

const uid = () => crypto.randomUUID();

// ======================================
// ASYNC CONTROLLER WRAPPER
// ======================================

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(
    fn(req, res, next)
  ).catch(next);

// ======================================
// ERROR HELPER
// ======================================

const err = (status, message) =>
  Object.assign(
    new Error(message),
    { status }
  );

// ======================================
// CLEAN DATABASE RESPONSE
// ======================================

const clean = (x) => {
  const d = x?.toObject
    ? x.toObject({ flattenMaps: true })
    : { ...x };

  delete d._id;
  delete d.__v;
  delete d.passwordHash;
  delete d.r2Key;
  delete d.privateR2Key;
  delete d.voterKey;

  return d;
};

// ======================================
// GENERATE ARTICLE URL SLUG
// ======================================

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9஀-௿]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 85);

// ======================================
// INDIA DATE ARCHIVE
// ======================================

const dayRange = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw err(400, "Invalid date");
  }

  const d = new Date(s + "T00:00:00Z");

  if (
    Number.isNaN(d.valueOf()) ||
    d.toISOString().slice(0, 10) !== s
  ) {
    throw err(400, "Invalid date");
  }

  // Asia/Kolkata calendar day
  const start = new Date(
    d.valueOf() - 330 * 60000
  );

  return {
    $gte: start,
    $lt: new Date(
      start.valueOf() + 86400000
    )
  };
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  bi,
  audio,
  safeUrl,
  uid,
  wrap,
  err,
  clean,
  slug,
  dayRange
};
