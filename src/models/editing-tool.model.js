
const mongoose = require("mongoose");

const { Schema, model } = mongoose;

// ==========================================
// BILINGUAL LABEL
// ==========================================

const bilingualSchema = new Schema(
  {
    ta: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120
    },

    en: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120
    }
  },
  { _id: false }
);

// ==========================================
// EDITING TOOL MODEL
// ==========================================

const editingToolSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    },

    label: {
      type: bilingualSchema,
      required: true
    },

    // The Angular renderer that this tool uses.
    rendererType: {
      type: String,
      required: true,
      enum: [
        "heading",
        "text",
        "image",
        "video",
        "audio",
        "gallery",
        "cards"
      ]
    },

    icon: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "fa-solid fa-puzzle-piece"
    },
// Uploaded icon image
iconUrl: {
  type: String,
  trim: true,
  maxlength: 2048,
  default: ""
},
    active: {
      type: Boolean,
      default: true
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    // Archive instead of permanently deleting a tool.
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "editing_tools"
  }
);

editingToolSchema.index({
  active: 1,
  sortOrder: 1
});

module.exports = model(
  "EditingTool",
  editingToolSchema
);
