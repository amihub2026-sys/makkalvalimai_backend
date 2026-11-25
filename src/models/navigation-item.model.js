
const mongoose = require("mongoose");

const { Schema, model } = mongoose;

// ==========================================
// BILINGUAL MENU NAME
// ==========================================

const bilingualSchema = new Schema(
  {
    ta: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    en: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    }
  },
  {
    _id: false
  }
);

// ==========================================
// NAVIGATION ITEM SCHEMA
// ==========================================

const navigationItemSchema = new Schema(
  {
    // Unique identifier, e.g. home, more,
    // local-news, about-us.

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

    // Tamil and English menu names.

    name: {
      type: bilingualSchema,
      required: true
    },

    // page: Opens an existing website page.
    // category: Opens a news category.
    // dropdown: Contains other menu items.

    type: {
      type: String,
      enum: ["page", "category", "dropdown"],
      required: true
    },

    // Used for website page links.
    // Example: /public-issues

    path: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          return (
            !value ||
            /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(value)
          );
        },
        message: "Enter a valid internal website path."
      }
    },

    // Used for news category links.
    // Example: local-news

    categorySlug: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          return (
            !value ||
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          );
        },
        message: "Invalid news category slug."
      }
    },

    // null means main header.
    // "more" means inside the More dropdown.
    // "about-us" means inside About Us.

    parentKey: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },

    // Admin Enable / Disable.

    active: {
      type: Boolean,
      default: true
    },

    // Display order in the menu.

    sortOrder: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// VALIDATE MENU ITEM TYPE
// ==========================================

navigationItemSchema.pre("validate", function () {

  if (this.type === "dropdown") {
    if (this.path || this.categorySlug || this.parentKey) {
      this.invalidate(
        "type",
        "Dropdowns cannot have a URL, category, or parent dropdown."
      );
    }
  }

  if (this.type === "page") {
    if (!this.path || this.categorySlug) {
      this.invalidate(
        "path",
        "Website pages require a path and cannot have a category slug."
      );
    }
  }

  if (this.type === "category") {
    if (!this.categorySlug || this.path) {
      this.invalidate(
        "categorySlug",
        "News category links require a category slug and cannot have a page path."
      );
    }
  }

});

// ==========================================
// INDEXES
// ==========================================

navigationItemSchema.index({
  active: 1,
  parentKey: 1,
  sortOrder: 1
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = model(
  "NavigationItem",
  navigationItemSchema
);
