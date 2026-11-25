
const CategoryService = require("../services/news-category.service");
const { wrap } = require("../utils/common");

// ==========================================
// PUBLIC: GET ACTIVE NEWS CATEGORIES
// ==========================================

exports.publicList = wrap(async (req, res) => {
  const categories = await CategoryService.publicList();

  res.json(categories);
});

// ==========================================
// ADMIN: GET ALL NEWS CATEGORIES
// ==========================================

exports.adminList = wrap(async (req, res) => {
  const categories = await CategoryService.adminList();

  res.json(categories);
});

// ==========================================
// ADMIN: CREATE OR UPDATE CATEGORY
// ==========================================

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

// ==========================================
// ADMIN: DELETE NEWS CATEGORY
// ==========================================

exports.remove = wrap(async (req, res) => {
  const { slug } = req.params;

  const result = await CategoryService.remove(slug);

  res.json({
    success: true,
    message: "News category deleted successfully",
    ...result
  });
});
