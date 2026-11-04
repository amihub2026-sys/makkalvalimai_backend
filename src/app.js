
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookie = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Cloudflare R2 storage for future production use
const r2Client = require("./config/cloudflare");
const createR2Media = require("./services/cloudflare.service");

// Local storage for development
const createLocalMedia = require("./services/local-media.service");

const errors = require("./middleware/errors");

module.exports = (cfg) => {
  const app = express();

  if (cfg.prod) {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({
      origin: cfg.origin,
      credentials: true
    })
  );

  // Protect against unauthorized cross-origin writes
  app.use((req, res, next) => {
    const origin = req.get("origin");

    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      origin &&
      origin !== cfg.origin
    ) {
      return res.status(403).json({
        error: "Origin not allowed"
      });
    }

    next();
  });

  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookie());

  // MongoDB admin sessions
  app.use(
    session({
      name: "mv.sid",
      secret: cfg.secret,
      resave: false,
      saveUninitialized: false,

      store: MongoStore.create({
        mongoUrl: cfg.db,
        collectionName: "sessions"
      }),

      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: cfg.prod,
        maxAge: 24 * 3600000
      }
    })
  );

  // ==================================
  // MEDIA STORAGE
  // ==================================

  // Development: save media to local disk.
  // Production: use Cloudflare R2.
  const media = cfg.prod
    ? createR2Media(r2Client(cfg.r2), cfg.r2)
    : createLocalMedia();

  console.log(
    `Media storage: ${
      cfg.prod ? "Cloudflare R2" : "Local Development"
    }`
  );

  // ==================================
  // HEALTH CHECK
  // ==================================

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      service: "makkal-valimai"
    });
  });

  // ==================================
  // ADMIN AUTHENTICATION
  // ==================================

  app.use(
    "/api/admin/auth",
    require("./routes/auth.routes")
  );

  // ==================================
  // ADMIN ROUTES
  // ==================================

  app.use(
    "/api/admin",
    require("./routes/admin.routes")(media)
  );

  // ==================================
  // PUBLIC ROUTES
  // ==================================

  app.use(
    "/api/public",
    require("./routes/public.routes")(media, cfg.secret)
  );

  // ==================================
  // NOT FOUND
  // ==================================

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found"
    });
  });

  // Central error handler
  app.use(errors);

  return app;
};
