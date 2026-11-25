
const { wrap } = require("../utils/common");

const blockActions = require(
  "../services/dynamic-page-block-actions.service"
);

// ==========================================
// EDIT EXISTING CONTENT BLOCK
// ==========================================

exports.update = wrap(async (req, res) => {
  const result = await blockActions.update(
    req.params.slug,
    req.params.blockId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Content block updated successfully.",
    pageSlug: result.pageSlug,
    block: result.block
  });
});

// ==========================================
// SHOW OR HIDE CONTENT BLOCK
// ==========================================

exports.visibility = wrap(async (req, res) => {
  const result = await blockActions.visibility(
    req.params.slug,
    req.params.blockId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: result.enabled
      ? "Content block is now visible."
      : "Content block is now hidden.",
    ...result
  });
});

// ==========================================
// REORDER CONTENT BLOCKS
// ==========================================

exports.reorder = wrap(async (req, res) => {
  const result = await blockActions.reorder(
    req.params.slug,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Content blocks reordered successfully.",
    ...result
  });
});
