const r = require("express").Router();
const { admin, csrf } = require("../middleware/auth");
const upload = require("../middleware/upload");
const news = require("../controllers/news.controller");
const issue = require("../controllers/issue.controller");
const alert = require("../controllers/alert.controller");
const poll = require("../controllers/poll.controller");
const ads = require("../controllers/ad.controller");
const settings = require("../controllers/settings.controller");
const mediaCtrl = require("../controllers/media.controller");
const categories = require("../controllers/news-category.controller");
module.exports = (media) => {
  const i = issue.createController(media),
    m = mediaCtrl.make(media);
  r.use(admin);
  r.use((req, res, next) =>
    req.method === "GET" ? next() : csrf(req, res, next),
  );
  // Dynamic News Categories
r.get("/categories", categories.adminList);
r.put("/categories/:slug", categories.save);
  r.get("/articles", news.adminList);
  r.put("/articles/:id", news.save);
  r.delete("/articles/:id", news.remove);
  r.get("/issues", i.adminList);
  r.patch("/issues/:id", i.moderate);
  r.get("/alerts", alert.adminList);
  r.put("/alerts/:id", alert.save);
  r.delete("/alerts/:id", alert.remove);
  r.get("/polls", poll.adminList);
  r.put("/polls/:id", poll.save);
  r.delete("/polls/:id", poll.remove);
  r.get("/ads", ads.adminList);
  r.put("/ads/:id", ads.save);
  r.delete("/ads/:id", ads.remove);
  r.get("/settings", settings.adminList);
  r.put("/settings", settings.save);
  r.post("/media", upload.single("file"), m.upload);
  r.get("/media/private/:id", m.privateRead);
  r.delete("/media/:id", m.remove);
  return r;
};
