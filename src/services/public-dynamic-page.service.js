
const DynamicPage = require(
  "../models/dynamic-page.model"
);

const { err } = require("../utils/common");

// ==========================================
// GET PUBLISHED DYNAMIC PAGE
// ==========================================

exports.getPublishedPage = async (slug) => {

  const pageSlug = String(slug || "")
    .trim()
    .toLowerCase();

  // Validate page URL
  if (
    pageSlug.length > 100 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageSlug)
  ) {
    throw err(400, "Invalid page URL.");
  }

  // Find published and non-archived page
  const page = await DynamicPage.findOne({
    slug: pageSlug,
    status: "published",
    archivedAt: null,
    publishedSnapshot: { $ne: null }
  })
    .select("slug publishedSnapshot")
    .lean();

  if (!page || !page.publishedSnapshot) {
    throw err(404, "Published page not found.");
  }

  const snapshot = page.publishedSnapshot;

  // Only visible blocks from the published snapshot
  const visibleBlocks = (snapshot.blocks || [])
    .filter(block => block.enabled !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(block => ({
      id: String(block._id),
      toolKey: block.toolKey,
      rendererType: block.rendererType,
      sortOrder: block.sortOrder,
      content: block.content
    }));

  // Return public-safe page content
  return {
    slug: page.slug,
    title: snapshot.title,
    version: snapshot.version,
    publishedAt: snapshot.publishedAt,
    blocks: visibleBlocks
  };
};
