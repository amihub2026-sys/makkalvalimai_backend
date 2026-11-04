const s = require("../services/auth.service");
const { wrap } = require("../utils/common");
exports.login = wrap(async (req, res) =>
  res.json(await s.login(req, req.body)),
);
exports.me = (req, res) =>
  res.json({
    user: { email: req.admin.email, role: req.admin.role },
    csrfToken: req.session.csrf,
  });
exports.logout = wrap(async (req, res) => {
  await new Promise((yes, no) =>
    req.session.destroy((e) => (e ? no(e) : yes())),
  );
  res.clearCookie("mv.sid");
  res.json({ ok: true });
});
