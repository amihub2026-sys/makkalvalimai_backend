
const navigation = require("../services/navigation.service");

// ==========================================
// ADMIN - GET ALL NAVIGATION ITEMS
// ==========================================

exports.adminList = async (req, res, next) => {
  try {
    const items = await navigation.adminList();

    return res.status(200).json({
      success: true,
      items
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC - GET ACTIVE NAVIGATION ITEMS
// ==========================================

exports.publicList = async (req, res, next) => {
  try {
    const items = await navigation.publicList();

    return res.status(200).json({
      success: true,
      items
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN - CREATE OR UPDATE NAVIGATION ITEM
// ==========================================

exports.save = async (req, res, next) => {
  try {
    const { key } = req.params;

    const item = await navigation.save(
      key,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Navigation item saved successfully.",
      item
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN - DELETE NAVIGATION ITEM
// ==========================================

exports.remove = async (req, res, next) => {
  try {
    const { key } = req.params;

    const result = await navigation.remove(key);

    return res.status(200).json({
      success: true,
      message: "Navigation item deleted successfully.",
      ...result
    });

  } catch (error) {
    next(error);
  }
};
