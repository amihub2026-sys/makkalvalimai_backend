const s = require("../services/issue.service");
const { wrap } = require("../utils/common");
exports.createController = (media) => ({
  submit: wrap(async (req, res) =>
    res.status(201).json(await s.submit(req.body, req.file, media)),
  ),
  publicList: wrap(async (req, res) => res.json(await s.publicList(req.query))),
  adminList: wrap(async (req, res) => res.json(await s.adminList())),
  moderate: wrap(async (req, res) =>
    res.json(
      await s.moderate(req.params.id, req.body, media, String(req.admin._id)),
    ),
  ),
});
