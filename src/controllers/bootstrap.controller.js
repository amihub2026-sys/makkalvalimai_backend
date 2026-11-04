const { wrap } = require("../utils/common");
const News = require("../services/news.service");
const Issue = require("../services/issue.service");
const Alert = require("../services/alert.service");
const Poll = require("../services/poll.service");
const Ads = require("../services/ad.service");
const Settings = require("../services/settings.service");
exports.bootstrap = wrap(async (req, res) => {
  const [articles, issues, alerts, polls, ads, settings] = await Promise.all([
    News.list({ limit: 100 }),
    Issue.publicList(),
    Alert.public(),
    Poll.public(),
    Ads.public(),
    Settings.get(),
  ]);
  res.json({ articles, issues, alerts, polls, ads, settings });
});
