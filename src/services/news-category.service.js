
const NewsCategory = require("../models/news-category.model");
const News = require("../models/news.model");

const { z } = require("zod");
const { err } = require("../utils/common");

// ==========================================
// CATEGORY VALIDATION
// ==========================================

const categorySchema = z.object({
  name: z.object({
    ta: z.string().trim().min(1).max(120),
    en: z.string().trim().min(1).max(120),
  }),

  // ENABLE / DISABLE CATEGORY
  active: z.boolean().default(true),

  // SHOW / HIDE CATEGORY IN WEBSITE MENU
  showInMenu: z.boolean().default(false),

  // HEADER NAVIGATION POSITION
  // Optional to keep older frontend requests working.
  // The Mongoose model provides the default: "more".
  headerType: z
    .enum([
      "main",
      "more",
      "about",
      "hidden",
    ])
    .optional(),

  sortOrder: z.number().int().min(0).default(0),

  requiresVerifiedSource: z.boolean().default(false),
});

const validSlug = (value) =>
  typeof value === "string" &&
  value.length <= 80 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

// ==========================================
// PUBLIC: LIST ACTIVE CATEGORIES
// ==========================================

exports.publicList = async () => {
  return NewsCategory.find({
    active: true,
  })
    .select(
      "slug name active showInMenu headerType sortOrder"
    )
    .sort({
      sortOrder: 1,
      slug: 1,
    })
    .lean();
};

// ==========================================
// ADMIN: LIST ALL CATEGORIES
// ==========================================

exports.adminList = async () => {
  return NewsCategory.find()
    .sort({
      sortOrder: 1,
      slug: 1,
    })
    .lean();
};

// ==========================================
// ADMIN: CREATE OR UPDATE CATEGORY
// ==========================================

exports.save = async (slug, body) => {
  if (!validSlug(slug)) {
    throw err(
      400,
      "Invalid category slug"
    );
  }

  const data = categorySchema.parse(body);

  return NewsCategory.findOneAndUpdate(
    { slug },
    {
      $set: data,
      $setOnInsert: {
        slug,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
};

// ==========================================
// ADMIN: DELETE CATEGORY SAFELY
// ==========================================

exports.remove = async (slug) => {
  if (!validSlug(slug)) {
    throw err(
      400,
      "Invalid category slug"
    );
  }

  // Check whether the category exists.
  const category = await NewsCategory.findOne({
    slug,
  }).lean();

  if (!category) {
    throw err(
      404,
      "News category not found"
    );
  }

  // Check ALL linked news, including:
  // 1. Published news
  // 2. Unpublished news
  // 3. Draft articles

  const newsCount = await News.countDocuments({
    kind: slug,
  });

  // Do not delete the category if it contains news.
  if (newsCount > 0) {
    throw err(
      409,
      `Cannot delete this category. It contains ${newsCount} news article(s). First delete all news articles under this category. Then delete the category.`
    );
  }

  // Delete only when no news articles are linked.
  const result = await NewsCategory.deleteOne({
    slug,
  });

  if (result.deletedCount === 0) {
    throw err(
      404,
      "News category not found"
    );
  }

  return {
    deleted: true,
    slug,
  };
};

// ==========================================
// VALIDATE CATEGORY FOR PUBLISHING
// ==========================================

exports.validateForPublishing = async (
  slug,
  source = ""
) => {
  const category = await NewsCategory.findOne({
    slug,
    active: true,
  }).lean();

  if (!category) {
    throw err(
      400,
      "Invalid or disabled news category"
    );
  }

  if (
    category.requiresVerifiedSource &&
    !source.trim()
  ) {
    throw err(
      400,
      "Verified source required"
    );
  }

  return category;
};
