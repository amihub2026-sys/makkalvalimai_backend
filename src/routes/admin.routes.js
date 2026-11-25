
const r = require("express").Router();

const originalGet = r.get.bind(r);

r.get = (path, ...handlers) => {
  handlers.forEach((handler) => {
    if (typeof handler !== "function") {
      console.error(
        "❌ INVALID GET ROUTE:",
        path,
        "| Handler type:",
        typeof handler
      );
    }
  });

  return originalGet(path, ...handlers);
};

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

// ==========================================
// NEW - DYNAMIC HEADER NAVIGATION
// ==========================================

const navigation = require("../controllers/navigation.controller");
const editingTools = require("../controllers/editing-tool.controller");
module.exports = (media) => {
  const i = issue.createController(media),
    m = mediaCtrl.make(media);

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================

  r.use(admin);

  r.use((req, res, next) =>
    req.method === "GET" ? next() : csrf(req, res, next),
  );

  // ==========================================
  // DYNAMIC NEWS CATEGORY CRUD
  // ==========================================

  r.get("/categories", categories.adminList);
  r.put("/categories/:slug", categories.save);
  r.delete("/categories/:slug", categories.remove);

  // ==========================================
  // NEW - DYNAMIC HEADER NAVIGATION CRUD
  // ==========================================

  // Get all navigation items
  r.get("/navigation", navigation.adminList);

  // Create or update a navigation item
  r.put("/navigation/:key", navigation.save);

  // Delete a navigation item
  r.delete("/navigation/:key", navigation.remove);
  r.get("/editing-tools/renderer-options", editingTools.rendererOptions);
  r.get("/editing-tools", editingTools.adminList);
r.get("/editing-tools/active", editingTools.activeList);
r.get("/editing-tools/:key", editingTools.getOne);
r.put("/editing-tools/:key", editingTools.save);
r.delete("/editing-tools/:key", editingTools.remove);
r.patch("/editing-tools/:key/restore", editingTools.restore);
  // ==========================================
  // DYNAMIC COMMON PAGE BUILDER API
  // ==========================================

  const dynamicPages = require(
    "../controllers/dynamic-page.controller"
  );

const blockActions = require(
  "../controllers/dynamic-page-block-actions.controller"
);

const dynamicPagePublish = require(
  "../controllers/dynamic-page-publish.controller"
);

  // Get all dynamic pages
  r.get("/dynamic-pages", dynamicPages.adminList);

  // Get one dynamic page
  r.get("/dynamic-pages/:slug", dynamicPages.getOne);

  // Create a dynamic page
  r.post("/dynamic-pages", dynamicPages.create);

  // Update dynamic page details
  r.put("/dynamic-pages/:slug", dynamicPages.update);

  // ==========================================
  // PUBLISH DYNAMIC WEBSITE PAGE
  // ==========================================

  r.post(
    "/dynamic-pages/:slug/publish",
    dynamicPagePublish.publishPage
  );

    // ==========================================
  // ADD CONTENT BLOCK TO DYNAMIC PAGE
  // ==========================================

  r.post(
    "/dynamic-pages/:slug/blocks",
    dynamicPages.addBlock
  );

// ==========================================
// DELETE CONTENT BLOCK FROM DYNAMIC PAGE
// ==========================================

r.delete(
  "/dynamic-pages/:slug/blocks/:blockId",
  dynamicPages.deleteBlock
);


  // ==========================================
  // REORDER SAVED CONTENT BLOCKS
  // Must come before the generic :blockId route
  // ==========================================

  r.put(
    "/dynamic-pages/:slug/blocks/reorder",
    blockActions.reorder
  );

  // ==========================================
  // EDIT EXISTING CONTENT BLOCK
  // ==========================================

  r.put(
    "/dynamic-pages/:slug/blocks/:blockId",
    blockActions.update
  );

  // ==========================================
  // SHOW OR HIDE CONTENT BLOCK
  // ==========================================

  r.patch(
    "/dynamic-pages/:slug/blocks/:blockId/visibility",
    blockActions.visibility
  );


  // ==========================================
  // NEWS ARTICLES
  // ==========================================

  r.get("/articles", news.adminList);
  r.put("/articles/:id", news.save);
  r.delete("/articles/:id", news.remove);

  // ==========================================
  // PUBLIC ISSUE REPORTS
  // ==========================================

  r.get("/issues", i.adminList);
  r.patch("/issues/:id", i.moderate);

  // ==========================================
  // PUBLIC ALERTS
  // ==========================================

  r.get("/alerts", alert.adminList);
  r.put("/alerts/:id", alert.save);
  r.delete("/alerts/:id", alert.remove);

  // ==========================================
  // POLLS
  // ==========================================

  r.get("/polls", poll.adminList);
  r.put("/polls/:id", poll.save);
  r.delete("/polls/:id", poll.remove);

  // ==========================================
  // ADVERTISEMENTS
  // ==========================================

  r.get("/ads", ads.adminList);
  r.put("/ads/:id", ads.save);
  r.delete("/ads/:id", ads.remove);

  // ==========================================
  // WEBSITE SETTINGS
  // ==========================================

  r.get("/settings", settings.adminList);
  r.put("/settings", settings.save);

  // ==========================================
  // MEDIA MANAGEMENT
  // ==========================================

  r.post("/media", upload.single("file"), m.upload);
  r.get("/media/private/:id", m.privateRead);
  r.delete("/media/:id", m.remove);

  return r;
};
