
const { z } = require("zod");

const DynamicPage = require(
  "../models/dynamic-page.model"
);

const { err } = require("../utils/common");

const {
  pageSlugSchema
} = require("./dynamic-page.validation");

const {
  blockInputSchema,
  validateBlockContent
} = require("./dynamic-page-block.validation");

// ==========================================
// VALIDATE CONTENT BLOCK ID
// ==========================================

const objectIdPattern = /^[a-f\d]{24}$/i;

function validateId(value) {
  const id = String(value || "").trim();

  if (!objectIdPattern.test(id)) {
    throw err(400, "Invalid block ID.");
  }

  return id.toLowerCase();
}

// ==========================================
// FIND SELECTED DYNAMIC PAGE
// ==========================================

async function findDraftPage(slug) {
  const checked = pageSlugSchema.safeParse(slug);

  if (!checked.success) {
    throw err(400, "Invalid page URL.");
  }

  const page = await DynamicPage.findOne({
    slug: checked.data,
    archivedAt: null
  });

  if (!page) {
    throw err(404, "Dynamic page not found.");
  }

  return page;
}

// ==========================================
// FIND CONTENT BLOCK BY ID
// ==========================================

function findBlock(page, blockId) {
  const id = validateId(blockId);

  const block = page.blocks.find(
    item => String(item._id) === id
  );

  if (!block) {
    throw err(404, "Content block not found.");
  }

  return block;
}

// ==========================================
// SAVE DRAFT SAFELY
// ==========================================

async function saveDraft(page) {
  try {
    await page.save();

  } catch (error) {
    if (error.name === "VersionError") {
      throw err(
        409,
        "The page changed during editing. Reload and try again."
      );
    }

    throw error;
  }
}

// ==========================================
// EDIT EXISTING CONTENT BLOCK
// ==========================================

exports.update = async (
  slug,
  blockId,
  body
) => {

  const page = await findDraftPage(slug);

  const block = findBlock(page, blockId);

  const input = blockInputSchema.parse(body);

  // Prevent switching the original tool
  // assigned to an existing content block.
  if (input.toolKey !== block.toolKey) {
    throw err(
      400,
      "Cannot change the editing tool of an existing block."
    );
  }

  // Validate against the original renderer.
  block.content = validateBlockContent(
    block.rendererType,
    input.content
  );

  block.enabled = input.enabled;

  block.sortOrder = input.sortOrder;

  // Save only the working draft.
  await saveDraft(page);

  return {
    pageSlug: page.slug,
    block: block.toObject()
  };
};

// ==========================================
// SHOW OR HIDE CONTENT BLOCK
// ==========================================

const visibilitySchema = z.object({
  enabled: z.boolean()
}).strict();

exports.visibility = async (
  slug,
  blockId,
  body
) => {

  const input = visibilitySchema.parse(body);

  const page = await findDraftPage(slug);

  const block = findBlock(page, blockId);

  block.enabled = input.enabled;

  await saveDraft(page);

  return {
    pageSlug: page.slug,
    blockId: String(block._id),
    enabled: block.enabled
  };
};

// ==========================================
// REORDER SAVED CONTENT BLOCKS
// ==========================================

const orderSchema = z.object({
  orderedBlockIds: z.array(
    z.string().regex(objectIdPattern)
  ).max(200)
}).strict();

exports.reorder = async (
  slug,
  body
) => {

  const input = orderSchema.parse(body);

  const page = await findDraftPage(slug);

  // Get existing block IDs.
  const currentIds = page.blocks.map(
    item => String(item._id)
  );

  // Get requested order.
  const newIds = input.orderedBlockIds.map(
    id => id.toLowerCase()
  );

  const uniqueIds = new Set(newIds);

  // Ensure every saved block appears
  // exactly once in the new order.
  if (
    newIds.length !== currentIds.length ||
    uniqueIds.size !== newIds.length ||
    currentIds.some(id => !uniqueIds.has(id))
  ) {
    throw err(
      400,
      "Order must include every saved block exactly once."
    );
  }

  // Update block display positions.
  newIds.forEach((id, index) => {

    const block = page.blocks.find(
      item => String(item._id) === id
    );

    block.sortOrder = index;
  });

  // Save reordered draft content.
  await saveDraft(page);

  return {
    pageSlug: page.slug,
    orderedBlockIds: newIds
  };
};
