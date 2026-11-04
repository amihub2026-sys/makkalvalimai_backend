
const CategoryService = require("../services/news-category.service");
const { wrap } = require("../utils/common");

// PUBLIC: Get all active news categories
exports.publicList = wrap(async (req, res) => {
  const categories = await CategoryService.publicList();

  res.json(categories);
});

// ADMIN: Get all categories, including disabled ones
exports.adminList = wrap(async (req, res) => {
  const categories = await CategoryService.adminList();

  res.json(categories);
});

// ADMIN: Create or update a news category
exports.save = wrap(async (req, res) => {
  const { slug } = req.params;

  const category = await CategoryService.save(
    slug,
    req.body
  );

  res.json({
    success: true,
    message: "News category saved successfully",
    category
  });
});
