
const { wrap } = require("../utils/common");

const publicDynamicPageService = require(
  "../services/public-dynamic-page.service"
);

// ==========================================
// PUBLIC - GET PUBLISHED DYNAMIC PAGE
// ==========================================

exports.getPublishedPage = wrap(async (req, res) => {

  const page = await publicDynamicPageService.getPublishedPage(
    req.params.slug
  );

  res.status(200).json({
    success: true,
    item: page
  });

});
