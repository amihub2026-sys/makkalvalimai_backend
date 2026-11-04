
const NewsCategory = require("../models/news-category.model");
const { z } = require("zod");
const { err } = require("../utils/common");

const categorySchema = z.object({
  name: z.object({
    ta: z.string().trim().min(1).max(120),
    en: z.string().trim().min(1).max(120),
  }),

  active: z.boolean().default(true),

  showInMenu: z.boolean().default(false),

  sortOrder: z.number().int().min(0).default(0),

  requiresVerifiedSource: z.boolean().default(false),
});

const validSlug = (value) =>
  typeof value === "string" &&
  value.length <= 80 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

// Public: get active news categories
exports.publicList = async () => {
  return NewsCategory.find({ active: true })
    .select("slug name showInMenu sortOrder")
    .sort({ sortOrder: 1, slug: 1 })
    .lean();
};

// Admin: get all categories, including disabled ones
exports.adminList = async () => {
  return NewsCategory.find()
    .sort({ sortOrder: 1, slug: 1 })
    .lean();
};

// Admin: create or update a category
exports.save = async (slug, body) => {
  if (!validSlug(slug)) {
    throw err(400, "Invalid category slug");
  }

  const data = categorySchema.parse(body);

  return NewsCategory.findOneAndUpdate(
    { slug },
    {
      $set: data,
      $setOnInsert: { slug },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
};

// Validate an article's category against MongoDB
exports.validateForPublishing = async (
  slug,
  source = ""
) => {
  const category = await NewsCategory.findOne({
    slug,
    active: true,
  }).lean();

  if (!category) {
    throw err(400, "Invalid or disabled news category");
  }

  if (
    category.requiresVerifiedSource &&
    !source.trim()
  ) {
    throw err(400, "Verified source required");
  }

  return category;
};
