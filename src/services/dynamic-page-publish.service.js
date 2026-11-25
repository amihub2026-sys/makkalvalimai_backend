
const DynamicPage = require(
  "../models/dynamic-page.model"
);

const { err } = require("../utils/common");

// ==========================================
// PUBLISH DYNAMIC WEBSITE PAGE
// ==========================================

exports.publishPage = async (slug) => {

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

  // Find the existing page
  const page = await DynamicPage.findOne({
    slug: pageSlug,
    archivedAt: null
  });

  if (!page) {
    throw err(404, "Dynamic page not found.");
  }

  // Check that the page contains content
  if (
    !page.blocks ||
    page.blocks.length === 0
  ) {
    throw err(
      400,
      "Add content blocks before publishing."
    );
  }

  // At least one block must be visible
  const enabledBlocks = page.blocks.filter(
    block => block.enabled === true
  );

  if (enabledBlocks.length === 0) {
    throw err(
      400,
      "At least one content block must be visible."
    );
  }

  // Determine the next published version
  const nextVersion =
    (page.publishedSnapshot?.version || 0) + 1;

  // Copy draft content into a new published snapshot
  const publishedBlocks = page.blocks
    .map(block => block.toObject())
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const publishedAt = new Date();

  page.publishedSnapshot = {
    title: page.title.toObject(),
    blocks: publishedBlocks,
    version: nextVersion,
    publishedAt
  };

  page.status = "published";

  // Save with optimistic concurrency protection
  try {
    await page.save();
  } catch (error) {
    if (error.name === "VersionError") {
      throw err(
        409,
        "This page was changed by another editor. Reload and try again."
      );
    }

    throw error;
  }

  return {
    slug: page.slug,
    status: page.status,
    version: nextVersion,
    publishedAt,
    publishedBlocks: enabledBlocks.length
  };
};
