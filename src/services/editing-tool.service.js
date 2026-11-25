
const EditingTool = require("../models/editing-tool.model");

const { z } = require("zod");
const { err, safeUrl } = require("../utils/common");

// ==========================================
// EDITING TOOL KEY VALIDATION
// ==========================================

const validKey = (value) =>
  typeof value === "string" &&
  value.length <= 80 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

function checkKey(key) {
  if (!validKey(key)) {
    throw err(400, "Invalid editing tool key.");
  }
}

// ==========================================
// SUPPORTED ANGULAR RENDERER TYPES
// ==========================================

const rendererTypes = [
  "heading",
  "text",
  "image",
  "video",
  "audio",
  "gallery",
  "cards"
];

// ==========================================
// NEW - AVAILABLE RENDERER OPTIONS
// ==========================================

// Provides supported renderer choices to
// the Admin interface through the backend.
//
// Admin-created editing tools themselves
// are stored dynamically in MongoDB.

exports.rendererOptions = () =>
  rendererTypes.map(value => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1)
  }));

// ==========================================
// ZOD VALIDATION
// ==========================================

const editingToolSchema = z.object({
  label: z.object({
    ta: z.string().trim().min(1).max(120),
    en: z.string().trim().min(1).max(120)
  }),

  rendererType: z.enum(rendererTypes),

  icon: z.string()
    .trim()
    .max(100)
    .default("fa-solid fa-puzzle-piece"),
// Uploaded icon image URL
iconUrl: safeUrl.optional(),
  active: z.boolean().default(true),

  sortOrder: z.number()
    .int()
    .min(0)
    .max(10000)
    .default(0)
}).strict();

// ==========================================
// ADMIN - GET ALL EDITING TOOLS
// ==========================================

exports.adminList = async () => {
  return EditingTool.find()
    .sort({
      sortOrder: 1,
      key: 1
    })
    .lean();
};

// ==========================================
// ACTIVE EDITING TOOLS FOR PAGE BUILDER
// ==========================================

exports.activeList = async () => {
  return EditingTool.find({
    active: true,
    archivedAt: null
  })
   .select(
  "key label rendererType icon iconUrl sortOrder"
)
    .sort({
      sortOrder: 1,
      key: 1
    })
    .lean();
};

// ==========================================
// GET ONE EDITING TOOL
// ==========================================

exports.getOne = async (key) => {
  checkKey(key);

  const tool = await EditingTool.findOne({
    key
  }).lean();

  if (!tool) {
    throw err(404, "Editing tool not found.");
  }

  return tool;
};

// ==========================================
// CREATE OR UPDATE EDITING TOOL
// ==========================================

exports.save = async (key, body) => {
  checkKey(key);

  const data = editingToolSchema.parse(body);

  let document = await EditingTool.findOne({
    key
  });

  if (document && document.archivedAt) {
    throw err(
      409,
      "This tool is archived. Restore it before editing."
    );
  }

  // Do not change the renderer of an existing
  // tool. Existing page blocks may depend on it.

  if (
    document &&
    document.rendererType !== data.rendererType
  ) {
    throw err(
      409,
      "Cannot change an existing tool's renderer type. Create another tool instead."
    );
  }

  if (!document) {
    document = new EditingTool({
      key
    });
  }

document.set({
  label: data.label,
  rendererType: data.rendererType,
  icon: data.icon,

  // Save uploaded icon URL when provided.
  // Preserve existing icon URL when omitted.
  ...(data.iconUrl !== undefined
    ? { iconUrl: data.iconUrl }
    : {}),

  active: data.active,
  sortOrder: data.sortOrder
});

  try {
    const saved = await document.save();

    return saved.toObject();
  } catch (error) {
    if (error.code === 11000) {
      throw err(
        409,
        "An editing tool with this key already exists."
      );
    }

    throw error;
  }
};

// ==========================================
// ARCHIVE EDITING TOOL
// ==========================================

exports.remove = async (key) => {
  checkKey(key);

  const document = await EditingTool.findOne({
    key
  });

  if (!document) {
    throw err(404, "Editing tool not found.");
  }

  // Do not permanently delete tool records.
  // Existing pages may still reference them.

  document.active = false;

  if (!document.archivedAt) {
    document.archivedAt = new Date();
  }

  await document.save();

  return {
    archived: true,
    key
  };
};

// ==========================================
// RESTORE ARCHIVED EDITING TOOL
// ==========================================

exports.restore = async (key) => {
  checkKey(key);

  const document = await EditingTool.findOne({
    key
  });

  if (!document) {
    throw err(404, "Editing tool not found.");
  }

  document.archivedAt = null;

  // Keep disabled until Admin enables it.
  document.active = false;

  await document.save();

  return document.toObject();
};
