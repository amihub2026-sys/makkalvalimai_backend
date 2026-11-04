const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const User = require("../models/admin.model");
const { err } = require("../utils/common");
exports.login = async (req, { email, password }) => {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length > 256
  )
    throw err(400, "Invalid credentials");
  const u = await User.findOne({
    email: email.toLowerCase().trim(),
    active: true,
  });
  const valid = await bcrypt.compare(
    password,
    u?.passwordHash ||
      "$2a$12$OI7gWj0hE/eBhIHcOBe3PevrMRm8xVRLxpFUPw0s2uq4DlVrTsjdu",
  );
  if (!u || !valid) throw err(401, "Invalid credentials");
  await new Promise((yes, no) =>
    req.session.regenerate((e) => (e ? no(e) : yes())),
  );
  req.session.user = { id: u._id.toString(), role: u.role };
  req.session.csrf = crypto.randomBytes(32).toString("hex");
  await new Promise((yes, no) => req.session.save((e) => (e ? no(e) : yes())));
  return {
    user: { email: u.email, role: u.role },
    csrfToken: req.session.csrf,
  };
};
