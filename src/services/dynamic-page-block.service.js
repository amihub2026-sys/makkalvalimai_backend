
const DynamicPage = require("../models/dynamic-page.model");
const EditingTool = require("../models/editing-tool.model");

const { pageSlugSchema } = require(
  "./dynamic-page.validation"
);

const {
  blockInputSchema,
  validateBlockContent
} = require("./dynamic-page-block.validation");

const { err } = require("../utils/common");

// ==========================================
// ADD CONTENT BLOCK TO DYNAMIC PAGE
// ==========================================

exports.addBlock = async (slug, body) => {

  // Validate page identifier.
  const slugResult = pageSlugSchema.safeParse(slug);

  if (!slugResult.success) {
    throw err(400, "Invalid page URL.");
  }

  // Validate incoming block information.
  const data = blockInputSchema.parse(body);

  // Verify selected tool exists and is enabled.
  const tool = await EditingTool.findOne({
    key: data.toolKey,
    active: true,
    archivedAt: null
  }).lean();

  if (!tool) {
    throw err(
      404,
      "Selected editing tool is unavailable."
    );
  }

  // Validate content according to the
  // renderer assigned to the selected tool.
  const validatedContent = validateBlockContent(
    tool.rendererType,
    data.content
  );

  // Load the selected dynamic page.
  const page = await DynamicPage.findOne({
    slug: slugResult.data,
    archivedAt: null
  });

  if (!page) {
    throw err(404, "Dynamic page not found.");
  }

  // Prevent excessively large pages.
  if (page.blocks.length >= 200) {
    throw err(
      400,
      "Maximum content blocks reached."
    );
  }

  // Add block to the working draft.
  // Existing published content is untouched.
  page.blocks.push({
    toolKey: tool.key,
    rendererType: tool.rendererType,
    sortOrder: data.sortOrder,
    enabled: data.enabled,
    content: validatedContent
  });

  try {
    const saved = await page.save();

    const addedBlock =
      saved.blocks[saved.blocks.length - 1];

    return {
      pageSlug: saved.slug,
      block: addedBlock.toObject()
    };

  } catch (error) {
    if (error.name === "VersionError") {
      throw err(
        409,
        "The page changed during editing. Reload and try again."
      );
    }


    throw error;
  }
};

// ==========================================
// DELETE CONTENT BLOCK FROM PAGE DRAFT
// ==========================================

exports.deleteBlock = async (slug, blockId) => {


  // Validate page slug.
  const slugResult = pageSlugSchema.safeParse(slug);

  if (!slugResult.success) {
    throw err(400, "Invalid page URL.");
  }

  // Validate MongoDB block ID.
  const id = String(blockId || "").trim().toLowerCase();

  if (!/^[a-f0-9]{24}$/.test(id)) {
    throw err(400, "Invalid content block ID.");
  }

  // Find the selected dynamic page.
  const page = await DynamicPage.findOne({
    slug: slugResult.data,
    archivedAt: null
  });

  if (!page) {
    throw err(404, "Dynamic page not found.");
  }

  // Find the exact block to delete.
  const blockIndex = page.blocks.findIndex(
    block => String(block._id) === id
  );

  if (blockIndex === -1) {
    throw err(404, "Content block not found.");
  }

  // Delete from draft only.
  // Published snapshot remains unchanged.
  page.blocks.splice(blockIndex, 1);

  try {
    await page.save();

    return {
      pageSlug: page.slug,
      blockId: id,
      deleted: true
    };

  } catch (error) {
    if (error.name === "VersionError") {
      throw err(
        409,
        "The page changed during editing. Reload and try again."
      );
    }

    throw error;
  }
};


