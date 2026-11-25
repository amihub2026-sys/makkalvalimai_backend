
const { wrap } = require("../utils/common");

const publishService = require(
  "../services/dynamic-page-publish.service"
);

// ==========================================
// ADMIN - PUBLISH DYNAMIC PAGE
// ==========================================

exports.publishPage = wrap(async (req, res) => {

  const result = await publishService.publishPage(
    req.params.slug
  );

  res.status(200).json({
    success: true,
    message: "Page published successfully.",
    item: {
      slug: result.slug,
      status: result.status,
      version: result.version,
      publishedAt: result.publishedAt,
      publishedBlocks: result.publishedBlocks
    }
  });

});
