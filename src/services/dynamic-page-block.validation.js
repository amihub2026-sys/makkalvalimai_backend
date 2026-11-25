
const { z } = require("zod");
const { safeUrl } = require("../utils/common");

// ==========================================
// BILINGUAL CONTENT VALIDATION
// ==========================================

const bilingualText = (maxLength = 5000) =>
  z.object({
    ta: z.string().trim().min(1).max(maxLength),
    en: z.string().trim().min(1).max(maxLength)
  }).strict();

const optionalBilingualText = (maxLength = 2000) =>
  z.object({
    ta: z.string().trim().max(maxLength),
    en: z.string().trim().max(maxLength)
  }).strict().optional();

// ==========================================
// MEDIA URL VALIDATION
// ==========================================

// Reuse the existing backend media validator.
// The uploaded media URL cannot be empty.

const requiredMediaUrl = safeUrl.refine(
  value => value.trim().length > 0,
  "An uploaded media URL is required."
);

// ==========================================
// TOOL KEY VALIDATION
// ==========================================

const toolKeySchema = z.string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// ==========================================
// IMAGE CONTENT
// ==========================================

const imageContentSchema = z.object({
  url: requiredMediaUrl,
  alt: bilingualText(300),
  caption: optionalBilingualText(1000)
}).strict();

// ==========================================
// GALLERY ITEM
// ==========================================

const galleryItemSchema = imageContentSchema;

// ==========================================
// CARD ITEM
// ==========================================

const cardItemSchema = z.object({
  title: bilingualText(200),
  description: optionalBilingualText(2000),
  imageUrl: safeUrl.optional(),
  linkUrl: safeUrl.optional()
}).strict();

// ==========================================
// SUPPORTED RENDERER CONTENT SCHEMAS
// ==========================================

// These define what each supported renderer
// can store, not which tools Admin creates.
//
// Tool names, icons and assigned renderers
// remain dynamic in editing_tools MongoDB.

const blockContentSchemas = {

  // HEADING
  heading: z.object({
    text: bilingualText(500),
    level: z.number()
      .int()
      .min(1)
      .max(6)
      .default(2)
  }).strict(),

  // TEXT
  text: z.object({
    text: bilingualText(20000)
  }).strict(),

  // IMAGE
  image: imageContentSchema,

  // VIDEO
  video: z.object({
    url: requiredMediaUrl,
    caption: optionalBilingualText(1000)
  }).strict(),

  // AUDIO
  audio: z.object({
    url: requiredMediaUrl,
    caption: optionalBilingualText(1000)
  }).strict(),

  // GALLERY
  gallery: z.object({
    items: z.array(galleryItemSchema)
      .min(1)
      .max(30)
  }).strict(),

  // CARDS
  cards: z.object({
    items: z.array(cardItemSchema)
      .min(1)
      .max(30)
  }).strict()
};

// ==========================================
// BLOCK INPUT VALIDATION
// ==========================================

const blockInputSchema = z.object({
  toolKey: toolKeySchema,

  sortOrder: z.number()
    .int()
    .min(0)
    .max(10000)
    .default(0),

  enabled: z.boolean().default(true),

  content: z.unknown()
}).strict();

// ==========================================
// VALIDATE CONTENT FOR SELECTED RENDERER
// ==========================================

function validateBlockContent(rendererType, content) {

  const schema = blockContentSchemas[rendererType];

  if (!schema) {
    throw new Error(
      "Unsupported editing tool renderer."
    );
  }

  return schema.parse(content);
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  toolKeySchema,
  blockInputSchema,
  blockContentSchemas,
  validateBlockContent
};
