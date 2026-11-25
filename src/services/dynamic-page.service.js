
const DynamicPage = require("../models/dynamic-page.model");

const {
  pageSlugSchema,
  createPageSchema,
  updatePageSchema
} = require("./dynamic-page.validation");

const { err } = require("../utils/common");

// ==========================================
// VALIDATE PAGE SLUG
// ==========================================

function checkSlug(slug) {
  const result = pageSlugSchema.safeParse(slug);

  if (!result.success) {
    throw err(400, "Invalid page URL slug.");
  }

  return result.data;
}

// ==========================================
// ADMIN - LIST ALL PAGES
// ==========================================

exports.adminList = async () => {
  return DynamicPage.find()
    .select(
      "slug title status archivedAt createdAt updatedAt"
    )
    .sort({
      updatedAt: -1
    })
    .lean();
};

// ==========================================
// ADMIN - GET SINGLE PAGE
// ==========================================

exports.getOne = async (slug) => {
  const validSlug = checkSlug(slug);

  const page = await DynamicPage.findOne({
    slug: validSlug
  }).lean();

  if (!page) {
    throw err(404, "Dynamic page not found.");
  }

  return page;
};

// ==========================================
// ADMIN - CREATE NEW PAGE
// ==========================================

exports.create = async (body) => {
  const data = createPageSchema.parse(body);

  try {
    const page = await DynamicPage.create({
      slug: data.slug,
      title: data.title
    });

    return page.toObject();

  } catch (error) {
    if (error.code === 11000) {
      throw err(
        409,
        "A page with this URL slug already exists."
      );
    }

    throw error;
  }
};

// ==========================================
// ADMIN - UPDATE PAGE DETAILS
// ==========================================

exports.update = async (slug, body) => {
  const validSlug = checkSlug(slug);
  const data = updatePageSchema.parse(body);

  const page = await DynamicPage.findOne({
    slug: validSlug,
    archivedAt: null
  });

  if (!page) {
    throw err(
      404,
      "Active dynamic page not found."
    );
  }

  // Only update draft page details.
  // Do not overwrite published content.
  page.title = data.title;

  try {
    const saved = await page.save();

    return saved.toObject();

  } catch (error) {
    if (error.name === "VersionError") {
      throw err(
        409,
        "This page was changed by another request. Reload and try again."
      );
    }

    throw error;
  }
};
