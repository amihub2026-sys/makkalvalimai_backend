const { Schema, model } = require("mongoose");
const s = new Schema(
  { pollId: String, visitorHash: String, option: Number },
  { timestamps: true },
);
s.index({ pollId: 1, visitorHash: 1 }, { unique: true });
module.exports = model("PollVote", s);
