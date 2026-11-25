
const service = require("../services/editing-tool.service");
const { wrap } = require("../utils/common");

// ==========================================
// NEW - AVAILABLE RENDERER OPTIONS
// ==========================================

exports.rendererOptions = wrap(async (req, res) => {
  const items = service.rendererOptions();

  res.json({
    success: true,
    items
  });
});

// ==========================================
// ADMIN - LIST ALL EDITING TOOLS
// ==========================================

exports.adminList = wrap(async (req, res) => {
  const items = await service.adminList();

  res.json({
    success: true,
    items
  });
});

// ==========================================
// ADMIN - LIST ACTIVE EDITING TOOLS
// ==========================================

exports.activeList = wrap(async (req, res) => {
  const items = await service.activeList();

  res.json({
    success: true,
    items
  });
});

// ==========================================
// ADMIN - GET SINGLE EDITING TOOL
// ==========================================

exports.getOne = wrap(async (req, res) => {
  const item = await service.getOne(req.params.key);

  res.json({
    success: true,
    item
  });
});

// ==========================================
// ADMIN - CREATE OR UPDATE EDITING TOOL
// ==========================================

exports.save = wrap(async (req, res) => {
  const item = await service.save(
    req.params.key,
    req.body
  );

  res.json({
    success: true,
    message: "Editing tool saved successfully.",
    item
  });
});

// ==========================================
// ADMIN - ARCHIVE EDITING TOOL
// ==========================================

exports.remove = wrap(async (req, res) => {
  const result = await service.remove(req.params.key);

  res.json({
    success: true,
    message: "Editing tool archived successfully.",
    ...result
  });
});

// ==========================================
// ADMIN - RESTORE EDITING TOOL
// ==========================================

exports.restore = wrap(async (req, res) => {
  const item = await service.restore(req.params.key);

  res.json({
    success: true,
    message: "Editing tool restored successfully.",
    item
  });
});
