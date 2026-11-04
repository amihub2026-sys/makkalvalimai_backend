
const News = require("../models/news.model");
const NewsCategory = require("../models/news-category.model");
const { z } = require("zod");

const {
  bi,
  safeUrl,
  err,
  slug,
  dayRange,
  clean,
} = require("../utils/common");

// Dynamic article validation
const schema = z.object({
  // Category slug is validated against MongoDB below
  kind: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

  title: bi,
  body: bi,

  area: z.string().trim().min(2).max(160),

  image: safeUrl.default(""),
  video: safeUrl.default(""),

  audio: bi.default({
    ta: "",
    en: "",
  }),

  published: z.boolean().default(false),
  featured: z.boolean().default(false),

  publishedAt: z.coerce.date(),

  slug: z.string().optional(),

  source: z.string().max(500).default(""),
});

// Validate category using MongoDB, not a fixed enum
async function validateCategory(kind, source, published) {
  const category = await NewsCategory.findOne({
    slug: kind,
    active: true,
  })
    .select("slug requiresVerifiedSource")
    .lean();

  if (!category) {
    throw err(
      400,
      "Invalid or disabled news category"
    );
  }

  // Verified source is required only when publishing
  if (
    published &&
    category.requiresVerifiedSource &&
    !source.trim()
  ) {
    throw err(
      400,
      "Verified news source required for this category"
    );
  }

  return category;
}

// PUBLIC: LIST PUBLISHED NEWS
exports.list = async (q = {}) => {
  const now = new Date();

  const filter = {
    published: true,
    publishedAt: {
      $lte: now,
    },
  };

  // Dynamic category filtering
  if (typeof q.kind === "string" && q.kind.trim()) {
    filter.kind = q.kind.trim().toLowerCase();
  }

  // Madurai area filtering
  if (typeof q.area === "string" && q.area.trim()) {
    filter.area = {
      $in: [q.area.trim(), "Madurai district"],
    };
  }

  // Date archive filtering
  if (typeof q.date === "string" && q.date.trim()) {
    const range = dayRange(q.date.trim());

    filter.publishedAt = {
      ...range,
      $lte: now,
    };
  }

  const page = Math.max(
    1,
    Math.min(1000, parseInt(q.page, 10) || 1)
  );

  const limit = Math.min(
    100,
    Math.max(1, parseInt(q.limit, 10) || 30)
  );

  const articles = await News.find(filter)
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return articles.map(clean);
};

// PUBLIC: GET SINGLE ARTICLE
exports.single = async (articleSlug) => {
  const article = await News.findOne({
    slug: articleSlug,
    published: true,
    publishedAt: {
      $lte: new Date(),
    },
  }).lean();

  if (!article) {
    throw err(404, "Article not found");
  }

  return clean(article);
};

// ADMIN: GET ALL ARTICLES, INCLUDING DRAFTS
exports.adminList = async () => {
  const articles = await News.find()
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return articles.map(clean);
};

// ADMIN: CREATE OR UPDATE NEWS ARTICLE
exports.save = async (id, data) => {
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id)) {
    throw err(400, "Invalid article ID");
  }

  const d = schema.parse(data);

  // Validate the selected category from MongoDB
  await validateCategory(
    d.kind,
    d.source,
    d.published
  );

  // Require both languages before publishing
  if (d.published) {
    if (
      !d.title.ta.trim() ||
      !d.title.en.trim() ||
      !d.body.ta.trim() ||
      !d.body.en.trim()
    ) {
      throw err(
        400,
        "Tamil and English title/body are required"
      );
    }
  }

  // Generate news URL slug
  const articleSlug = slug(
    d.slug || d.title.en
  ) || id;

  const article = await News.findOneAndUpdate(
    { id },
    {
      $set: {
        ...d,
        slug: articleSlug,
      },
      $setOnInsert: {
        id,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return clean(article);
};

// ADMIN: DELETE ARTICLE
exports.remove = async (id) => {
  const deleted = await News.findOneAndDelete({
    id,
  });

  if (!deleted) {
    throw err(404, "Article not found");
  }

  return {
    deleted: true,
  };
};
