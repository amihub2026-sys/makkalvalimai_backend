const r = require("express").Router();
const c = require("../controllers/auth.controller");
const { admin, csrf } = require("../middleware/auth");
const rate = require("express-rate-limit");
r.post("/login", rate({ windowMs: 900000, limit: 10 }), c.login);
r.get("/me", admin, c.me);
r.post("/logout", admin, csrf, c.logout);
module.exports = r;
