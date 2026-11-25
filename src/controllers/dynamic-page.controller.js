
const { wrap } = require("../utils/common");

// ==========================================
// DYNAMIC PAGE SERVICE
// ==========================================

const dynamicPageService = require(
  "../services/dynamic-page.service"
);

// ==========================================
// DYNAMIC PAGE BLOCK SERVICE
// ==========================================

const dynamicPageBlockService = require(
  "../services/dynamic-page-block.service"
);

// ==========================================
// ADMIN - GET ALL DYNAMIC PAGES
// ==========================================

exports.adminList = wrap(async (req, res) => {

  const pages = await dynamicPageService.adminList();

  res.status(200).json({
    success: true,
    items: pages
  });

});

// ==========================================
// ADMIN - GET ONE DYNAMIC PAGE
// ==========================================

exports.getOne = wrap(async (req, res) => {

  const page = await dynamicPageService.getOne(
    req.params.slug
  );

  res.status(200).json({
    success: true,
    item: page
  });

});

// ==========================================
// ADMIN - CREATE DYNAMIC PAGE
// ==========================================

exports.create = wrap(async (req, res) => {

  const page = await dynamicPageService.create(
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Dynamic page created successfully.",
    item: page
  });

});

// ==========================================
// ADMIN - UPDATE DYNAMIC PAGE DETAILS
// ==========================================

exports.update = wrap(async (req, res) => {

  const page = await dynamicPageService.update(
    req.params.slug,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Dynamic page updated successfully.",
    item: page
  });

});

// ==========================================
// ADMIN - ADD CONTENT BLOCK
// ==========================================

exports.addBlock = wrap(async (req, res) => {

  const result = await dynamicPageBlockService.addBlock(
    req.params.slug,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Content block added successfully.",
    pageSlug: result.pageSlug,
    block: result.block
  });

});

// ==========================================
// ADMIN - DELETE CONTENT BLOCK
// ==========================================

exports.deleteBlock = wrap(async (req, res) => {

  const result = await dynamicPageBlockService.deleteBlock(
    req.params.slug,
    req.params.blockId
  );

  res.status(200).json({
    success: true,
    message: "Content block deleted successfully.",
    pageSlug: result.pageSlug,
    blockId: result.blockId,
    deleted: result.deleted
  });

});
