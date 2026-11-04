const User = require("../models/admin.model");
const { err } = require("../utils/common");
exports.admin = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) throw err(401, "Admin login required");
    const u = await User.findById(req.session.user.id).lean();
    if (!u?.active) throw err(401, "Admin session expired");
    req.admin = u;
    next();
  } catch (e) {
    next(e);
  }
};
exports.csrf = (req, res, next) => {
  if (req.session?.csrf && req.get("X-CSRF-Token") === req.session.csrf)
    return next();
  next(err(403, "Invalid CSRF token"));
};
