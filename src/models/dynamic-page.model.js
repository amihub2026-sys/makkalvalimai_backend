
const mongoose = require("mongoose");

const { Schema, model } = mongoose;

// ==========================================
// SUPPORTED CONTENT RENDERERS
// ==========================================

// These are application rendering capabilities.
// Admin-created tools are stored separately
// in the editing_tools collection.

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
// BILINGUAL PAGE TITLE
// ==========================================

const bilingualSchema = new Schema(
  {
    ta: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    en: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    }
  },
  {
    _id: false
  }
);

// ==========================================
// DYNAMIC PAGE CONTENT BLOCK
// ==========================================

const pageBlockSchema = new Schema(
  {
    // References a tool stored in editing_tools.
    toolKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    },

    // The renderer used for this block.
    rendererType: {
      type: String,
      required: true,
      enum: rendererTypes
    },

    // Admin controls display order.
    sortOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    // Admin can hide individual blocks.
    enabled: {
      type: Boolean,
      default: true
    },

    // Renderer-specific content.
    // The upcoming service layer will validate
    // each content structure before saving.
    content: {
      type: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// PUBLISHED PAGE SNAPSHOT
// ==========================================

// Keep published content separate from the
// working draft so editing an existing page
// does not immediately change the live page.

const publishedSnapshotSchema = new Schema(
  {
    title: {
      type: bilingualSchema,
      required: true
    },

    blocks: {
      type: [pageBlockSchema],
      default: []
    },

    version: {
      type: Number,
      required: true,
      min: 1
    },

    publishedAt: {
      type: Date,
      required: true
    }
  },
  {
    _id: false
  }
);

// ==========================================
// DYNAMIC PAGE MODEL
// ==========================================

const dynamicPageSchema = new Schema(
  {
    // Unique page identifier.
    slug: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    },

    // Current editable draft title.
    title: {
      type: bilingualSchema,
      required: true
    },

    // Current editable draft blocks.
    blocks: {
      type: [pageBlockSchema],
      default: []
    },

    // Publishing status.
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    // Last published version.
    publishedSnapshot: {
      type: publishedSnapshotSchema,
      default: null
    },

    // Soft archive instead of deletion.
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "dynamic_pages",
    optimisticConcurrency: true
  }
);

// ==========================================
// DATABASE INDEXES
// ==========================================

dynamicPageSchema.index({
  status: 1,
  archivedAt: 1,
  updatedAt: -1
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = model(
  "DynamicPage",
  dynamicPageSchema
);
