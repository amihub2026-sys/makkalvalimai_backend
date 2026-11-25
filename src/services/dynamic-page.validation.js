
const { z } = require("zod");

// ==========================================
// DYNAMIC PAGE VALIDATION
// ==========================================

// Unique URL slug
// Examples: about-us, contact-us, our-team

const pageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Invalid page URL slug."
  );

// ==========================================
// BILINGUAL PAGE TITLE
// ==========================================

const bilingualTitleSchema = z.object({
  ta: z.string()
    .trim()
    .min(1, "Tamil title is required.")
    .max(200),

  en: z.string()
    .trim()
    .min(1, "English title is required.")
    .max(200)
}).strict();

// ==========================================
// CREATE NEW DYNAMIC PAGE
// ==========================================

const createPageSchema = z.object({
  slug: pageSlugSchema,

  title: bilingualTitleSchema
}).strict();

// ==========================================
// UPDATE PAGE DETAILS
// ==========================================

// Slug cannot be edited after creation.
// Publishing and archiving use separate actions.

const updatePageSchema = z.object({
  title: bilingualTitleSchema
}).strict();

// ==========================================
// EXPORT VALIDATORS
// ==========================================

module.exports = {
  pageSlugSchema,
  bilingualTitleSchema,
  createPageSchema,
  updatePageSchema
};
