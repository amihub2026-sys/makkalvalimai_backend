
const Issue = require("../models/issue.model");
const { z } = require("zod");
const { clean, err, uid } = require("../utils/common");

const issueSchema = z.object({
  title: z.string().trim().min(5).max(180),
  description: z.string().trim().min(15).max(4000),

  category: z.enum([
    "Roads",
    "Water",
    "Drainage",
    "Garbage",
    "Streetlights",
    "Traffic",
    "Other",
  ]),

  area: z.string().trim().min(2).max(160),
  street: z.string().max(160).default(""),
});

const publicDoc = (x) => clean(x);

// PUBLIC: SUBMIT NEW ISSUE
exports.submit = async (body, file, media) => {
  const d = issueSchema.parse(body);

  let image = null;

  if (file) {
    image = await media.upload(file, "private");
  }

  const created = await Issue.create({
    ...d,
    id: uid(),
    status: "pending",
    privateR2Key: image?.id || "",
    audit: [
      {
        action: "submitted",
        at: new Date(),
        by: "citizen",
      },
    ],
  });

  return {
    id: created.id,
    status: "pending",
    message: "Pending admin review",
  };
};

// PUBLIC: SHOW APPROVED AND SOLVED ISSUES ONLY
exports.publicList = async (q = {}) => {
  const statusFilter =
    q.status === "solved"
      ? "solved"
      : q.status === "approved"
        ? "approved"
        : { $in: ["approved", "solved"] };

  const filter = {
    status: statusFilter,
  };

  if (q.area) {
    filter.area = q.area;
  }

  const issues = await Issue.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return issues.map(publicDoc);
};

// ADMIN: GET ALL ISSUES
exports.adminList = async () => {
  const issues = await Issue.find()
    .select("+privateR2Key")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return issues.map((x) => ({
    ...clean(x),
    privateMediaId: x.privateR2Key || "",
  }));
};

// ADMIN: APPROVE, REJECT OR SOLVE ISSUE
exports.moderate = async (id, body, media, by) => {
  const d = z
    .object({
      status: z.enum(["approved", "rejected", "solved"]),
      resolution: z.string().max(4000).optional(),
      afterPhoto: z.string().max(2048).optional(),
    })
    .parse(body);

  const x = await Issue.findOne({ id })
    .select("+privateR2Key");

  if (!x) {
    throw err(404, "Issue not found");
  }

  if (["rejected", "solved"].includes(x.status)) {
    throw err(409, "Closed issue");
  }

  if (x.status === "pending" && d.status === "solved") {
    throw err(409, "Approve before solving");
  }

  if (x.status === "approved" && d.status === "rejected") {
    throw err(409, "Cannot reject already public issue");
  }

  // Approve pending issue
  if (x.status === "pending" && d.status === "approved") {
    if (x.privateR2Key) {
      x.photo = await media.approve(x.privateR2Key);
    }

    x.approvedAt = new Date();
  }

  // Mark approved issue as solved
  if (d.status === "solved") {
    const validAfterPhoto =
      /^\/api\/public\/media\/[a-f0-9-]{36}$/.test(
        d.afterPhoto || ""
      );

    if (
      x.status !== "approved" ||
      !d.resolution ||
      d.resolution.trim().length < 15 ||
      !validAfterPhoto
    ) {
      throw err(
        400,
        "Verified resolution and after-image required"
      );
    }

    x.resolution = d.resolution;
    x.afterPhoto = d.afterPhoto;
    x.verifiedAt = new Date();
    x.verifiedBy = by;
  }

  x.status = d.status;

  x.audit.push({
    action: d.status,
    at: new Date(),
    by,
  });

  await x.save();

  return clean(x);
};
