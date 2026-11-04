
const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const bilingualSchema = new Schema(
  {
    ta: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    en: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    }
  },
  { _id: false }
);

const newsCategorySchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    },

    name: {
      type: bilingualSchema,
      required: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    showInMenu: {
      type: Boolean,
      default: false
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    requiresVerifiedSource: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

newsCategorySchema.index({
  active: 1,
  sortOrder: 1
});

module.exports = model(
  "NewsCategory",
  newsCategorySchema
);
