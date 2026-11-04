const mongoose = require("mongoose");
const cfg = require("./config/env");
const { connect } = require("./config/db");
connect(cfg.db)
  .then(() =>
    require("./app")(cfg).listen(cfg.port, () =>
      console.log(`Makkal Valimai API :${cfg.port}`),
    ),
  )
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
