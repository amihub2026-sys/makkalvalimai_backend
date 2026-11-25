
const router = require("express").Router();
const rate = require("express-rate-limit");
const upload = require("../middleware/upload");

const { bootstrap } = require("../controllers/bootstrap.controller");

const news = require("../controllers/news.controller");
const issue = require("../controllers/issue.controller");
const alert = require("../controllers/alert.controller");
const poll = require("../controllers/poll.controller");
const ads = require("../controllers/ad.controller");
const settings = require("../controllers/settings.controller");
const mediaController = require("../controllers/media.controller");
const vote = require("../controllers/poll-vote.controller");
const categories = require("../controllers/news-category.controller");

// ==========================================
// DYNAMIC HEADER NAVIGATION
// ==========================================

const navigation = require("../controllers/navigation.controller");

const publicDynamicPages = require(
  "../controllers/public-dynamic-page.controller"
);

module.exports = (media, secret) => {

  const issues = issue.createController(media),
    m = mediaController.make(media);

  router.get("/bootstrap", bootstrap);

  // ==========================================
  // PUBLIC NEWS CATEGORIES
  // ==========================================

  router.get("/categories", categories.publicList);

  // ==========================================
  // PUBLIC DYNAMIC HEADER NAVIGATION
  // ==========================================

  router.get("/navigation", navigation.publicList);

  // ==========================================
  // PUBLIC DYNAMIC WEBSITE PAGES
  // ==========================================

  router.get(
    "/pages/:slug",
    publicDynamicPages.getPublishedPage
  );

  // ==========================================
  // PUBLIC NEWS
  // ==========================================

  router.get("/articles", news.list);
  router.get("/articles/:slug", news.single);

  // ==========================================
  // PUBLIC ISSUES
  // ==========================================

  router.get("/issues", issues.publicList);

  router.post(
    "/issues",
    rate({ windowMs: 3600000, limit: 8 }),
    upload.single("file"),
    issues.submit,
  );

  // ==========================================
  // PUBLIC ALERTS
  // ==========================================

  router.get("/alerts", alert.public);

  // ==========================================
  // PUBLIC POLLS
  // ==========================================

  router.get("/polls", poll.public);

  router.post(
    "/polls/:id/votes",
    rate({ windowMs: 900000, limit: 15 }),
    vote.make(secret),
  );

  // ==========================================
  // PUBLIC ADS AND SETTINGS
  // ==========================================

  router.get("/ads", ads.public);
  router.get("/settings", settings.public);

  // ==========================================
  // PUBLIC MEDIA
  // ==========================================

  router.get("/media/:id", m.publicRead);

  return router;
};
