
require("dotenv").config();

const mongoose = require("mongoose");

const NewsCategory = require(
  "../src/models/news-category.model"
);

// Initial categories only.
// Future categories will be managed from the admin panel.
const categories = [
  {
    slug: "madurai",
    name: {
      ta: "மதுரை செய்திகள்",
      en: "Madurai News"
    },
    sortOrder: 1,
    showInMenu: true
  },
  {
    slug: "crime",
    name: {
      ta: "குற்றச் செய்திகள்",
      en: "Crime News"
    },
    sortOrder: 2,
    showInMenu: true,
    requiresVerifiedSource: true
  },
  {
    slug: "health",
    name: {
      ta: "ஆரோக்கியம் மற்றும் விழிப்புணர்வு",
      en: "Health & Awareness"
    },
    sortOrder: 3
  },
  {
    slug: "story",
    name: {
      ta: "உரையாடல் கதைகள்",
      en: "Dialogue Stories"
    },
    sortOrder: 4
  },
  {
    slug: "kids",
    name: {
      ta: "சிறுவர் பகுதி",
      en: "Kids' Corner"
    },
    sortOrder: 5
  },
  {
    slug: "gallery",
    name: {
      ta: "புகைப்படங்கள் / வீடியோக்கள்",
      en: "Photo & Video Gallery"
    },
    sortOrder: 6
  },
  {
    slug: "achievement",
    name: {
      ta: "மதுரை சாதனையாளர்கள்",
      en: "Achievements"
    },
    sortOrder: 7
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    if (mongoose.connection.name !== "makkal_valimai") {
      throw new Error("Incorrect database. Setup stopped.");
    }

    await NewsCategory.init();

    for (const category of categories) {
      await NewsCategory.updateOne(
        { slug: category.slug },
        { $setOnInsert: category },
        { upsert: true }
      );
    }

    console.log("News categories initialized successfully");

    const count = await NewsCategory.countDocuments();

    console.log("Total categories:", count);

  } catch (error) {
    console.error("Category setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedCategories();
