
const NavigationItem = require("../models/navigation-item.model");
const NewsCategory = require("../models/news-category.model");

const { z } = require("zod");
const { err } = require("../utils/common");

// ==========================================
// VALIDATION
// ==========================================

const validKey = (value) =>
  typeof value === "string" &&
  value.length <= 80 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const navigationSchema = z.object({
  name: z.object({
    ta: z.string().trim().min(1).max(120),
    en: z.string().trim().min(1).max(120)
  }),

  type: z.enum([
    "page",
    "category",
    "dropdown"
  ]),

  path: z.string().trim().max(200).default(""),

  categorySlug: z.string()
    .trim()
    .toLowerCase()
    .max(80)
    .default(""),

  parentKey: z.string()
    .trim()
    .toLowerCase()
    .nullable()
    .optional()
    .default(null),

  active: z.boolean().default(true),

  sortOrder: z.number().int().min(0).default(0)
});

// ==========================================
// ADMIN - GET ALL NAVIGATION ITEMS
// ==========================================

exports.adminList = async () => {
  return NavigationItem.find()
    .sort({
      sortOrder: 1,
      key: 1
    })
    .lean();
};

// ==========================================
// PUBLIC - GET ACTIVE NAVIGATION ITEMS
// ==========================================

exports.publicList = async () => {

  const items = await NavigationItem.find({
    active: true
  })
    .select(
      "key name type path categorySlug parentKey sortOrder"
    )
    .sort({
      sortOrder: 1,
      key: 1
    })
    .lean();

  // Verify that category links point to
  // existing, enabled news categories.

  const categorySlugs = items
    .filter(item => item.type === "category")
    .map(item => item.categorySlug);

  const categories = await NewsCategory.find({
    slug: { $in: categorySlugs },
    active: true
  })
    .select("slug")
    .lean();

  const activeCategorySlugs = new Set(
    categories.map(category => category.slug)
  );

  const activeItems = items.filter(item => {

    if (item.type === "category") {
      return activeCategorySlugs.has(item.categorySlug);
    }

    return true;
  });

  // Children are visible only when their
  // parent dropdown is enabled.

  const dropdownKeys = new Set(
    activeItems
      .filter(item => item.type === "dropdown")
      .map(item => item.key)
  );

  return activeItems.filter(item => {
    return (
      !item.parentKey ||
      dropdownKeys.has(item.parentKey)
    );
  });
};

// ==========================================
// ADMIN - CREATE OR UPDATE NAVIGATION ITEM
// ==========================================

exports.save = async (key, body) => {

  if (!validKey(key)) {
    throw err(400, "Invalid navigation key.");
  }

  const data = navigationSchema.parse(body);

  const parentKey = data.parentKey || null;

  // ------------------------------------------
  // VALIDATE WEBSITE PAGE
  // ------------------------------------------

  if (data.type === "page") {

    if (!data.path || data.categorySlug) {
      throw err(
        400,
        "Website pages require a path and cannot have a category slug."
      );
    }

    if (
      !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(data.path)
    ) {
      throw err(
        400,
        "Enter a valid internal website path."
      );
    }
  }

  // ------------------------------------------
  // VALIDATE NEWS CATEGORY
  // ------------------------------------------

  if (data.type === "category") {

    if (!validKey(data.categorySlug) || data.path) {
      throw err(
        400,
        "News category items require a valid category slug and no page path."
      );
    }

    const category = await NewsCategory.findOne({
      slug: data.categorySlug
    }).lean();

    if (!category) {
      throw err(
        400,
        "This news category does not exist."
      );
    }
  }

  // ------------------------------------------
  // VALIDATE DROPDOWN
  // ------------------------------------------

  if (data.type === "dropdown") {

    if (
      data.path ||
      data.categorySlug ||
      parentKey
    ) {
      throw err(
        400,
        "Dropdowns cannot have a page URL, category or parent dropdown."
      );
    }
  }

  // ------------------------------------------
  // VALIDATE PARENT DROPDOWN
  // ------------------------------------------

  if (parentKey) {

    if (!validKey(parentKey) || parentKey === key) {
      throw err(
        400,
        "Invalid parent dropdown."
      );
    }

    const parent = await NavigationItem.findOne({
      key: parentKey,
      type: "dropdown"
    }).lean();

    if (!parent) {
      throw err(
        400,
        "Selected parent dropdown does not exist."
      );
    }
  }

  // Prevent changing a dropdown into another
  // item type while it still has children.

  const existing = await NavigationItem.findOne({
    key
  });

  if (
    existing?.type === "dropdown" &&
    data.type !== "dropdown"
  ) {
    const childrenCount =
      await NavigationItem.countDocuments({
        parentKey: key
      });

    if (childrenCount > 0) {
      throw err(
        409,
        "This dropdown contains menu items. Move or delete its child items first."
      );
    }
  }

  // Use document.save() to apply the
  // NavigationItem model's validation rules.

  const document = existing ||
    new NavigationItem({ key });

  document.set({
    name: data.name,
    type: data.type,
    path: data.path,
    categorySlug: data.categorySlug,
    parentKey,
    active: data.active,
    sortOrder: data.sortOrder
  });

  const saved = await document.save();

  return saved.toObject();
};

// ==========================================
// ADMIN - DELETE NAVIGATION ITEM
// ==========================================

exports.remove = async (key) => {

  if (!validKey(key)) {
    throw err(
      400,
      "Invalid navigation key."
    );
  }

  const item = await NavigationItem.findOne({
    key
  }).lean();

  if (!item) {
    throw err(
      404,
      "Navigation item not found."
    );
  }

  // Do not delete dropdowns that
  // still contain child menu items.

  const childrenCount =
    await NavigationItem.countDocuments({
      parentKey: key
    });

  if (childrenCount > 0) {
    throw err(
      409,
      `Cannot delete this menu. It contains ${childrenCount} child item(s). Move or delete those items first.`
    );
  }

  await NavigationItem.deleteOne({
    key
  });

  return {
    deleted: true,
    key
  };
};
