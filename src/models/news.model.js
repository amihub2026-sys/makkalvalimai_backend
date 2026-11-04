
const { Schema, model } = require("mongoose");

const bi = {
  ta: { type: String, default: "" },
  en: { type: String, default: "" },
};

const s = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    // Dynamic category slug from MongoDB
    kind: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      index: true,
    },

    title: bi,
    body: bi,

    area: {
      type: String,
      default: "Madurai district",
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    video: {
      type: String,
      default: "",
    },

    audio: bi,

    published: {
      type: Boolean,
      default: false,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    source: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

s.set("id", false);

module.exports = model("News", s);
