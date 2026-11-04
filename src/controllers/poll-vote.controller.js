const crypto = require("node:crypto");
const poll = require("../services/poll.service");
const { wrap } = require("../utils/common");
exports.make = (secret) =>
  wrap(async (req, res) => {
    let visitor = req.cookies.mv_visitor;
    if (!/^[a-f0-9-]{36}$/.test(visitor || "")) visitor = crypto.randomUUID();
    const result = await poll.vote(
      req.params.id,
      req.body.option,
      visitor,
      secret,
    );
    res.cookie("mv_visitor", visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 86400000,
    });
    res.json(result);
  });
