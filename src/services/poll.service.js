
const Poll = require("../models/poll.model");
const Vote = require("../models/vote.model");

const { z } = require("zod");
const crypto = require("node:crypto");

const { bi, clean, err } = require("../utils/common");

// ==========================================
// POLL VALIDATION
// ==========================================

const sch = z.object({
  question: bi,

  options: z.array(bi).min(2).max(8),

  active: z.boolean().default(false),

  expiresAt: z.coerce.date().optional()
});

// ==========================================
// CALCULATE REAL VOTES FROM MONGODB
// ==========================================

async function totals(p) {

  const votes = await Vote.aggregate([
    {
      $match: {
        pollId: p.id
      }
    },
    {
      $group: {
        _id: "$option",
        count: {
          $sum: 1
        }
      }
    }
  ]);

  return {
    ...clean(p),

    counts: p.options.map(
      (_, index) =>
        votes.find(
          v => v._id === index
        )?.count || 0
    )
  };
}

// ==========================================
// PUBLIC ACTIVE POLLS
// ==========================================

exports.public = async () => {

  const polls = await Poll.find({
    active: true,

    $or: [
      { expiresAt: null },
      {
        expiresAt: {
          $gt: new Date()
        }
      }
    ]
  })
    .limit(40)
    .lean();

  return Promise.all(
    polls.map(totals)
  );
};

// ==========================================
// ADMIN - ALL POLLS
// ==========================================

exports.all = async () => {

  const polls = await Poll.find()
    .limit(150)
    .lean();

  return Promise.all(
    polls.map(totals)
  );
};

// ==========================================
// ADMIN - CREATE / UPDATE POLL
// ==========================================

exports.save = async (id, body) => {

  const data = sch.parse(body);

  const existing = await Poll.findOne({
    id
  });

  // Prevent changing the answer options
  // after residents have started voting.

  if (existing) {

    const hasVotes = await Vote.exists({
      pollId: id
    });

    const previousOptions = JSON.stringify(
      existing.options.map(o => ({
        ta: o.ta,
        en: o.en
      }))
    );

    const newOptions = JSON.stringify(
      data.options
    );

    if (
      hasVotes &&
      previousOptions !== newOptions
    ) {

      throw err(
        409,
        "Cannot edit options after votes"
      );
    }
  }

  const saved = await Poll.findOneAndUpdate(
    { id },

    {
      $set: data,
      $setOnInsert: {
        id
      }
    },

    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  return totals(saved);
};

// ==========================================
// PUBLIC - RECORD VOTE
// ==========================================

exports.vote = async (
  id,
  option,
  visitor,
  secret
) => {

  // Allow votes only on active,
  // non-expired polls.

  const poll = await Poll.findOne({
    id,
    active: true,

    $or: [
      { expiresAt: null },
      {
        expiresAt: {
          $gt: new Date()
        }
      }
    ]
  });

  if (!poll) {

    throw err(
      404,
      "Poll not found"
    );
  }

  // Validate selected answer index.

  if (
    !Number.isInteger(option) ||
    option < 0 ||
    option >= poll.options.length
  ) {

    throw err(
      400,
      "Invalid option"
    );
  }

  // Create a hashed visitor identifier.
  // Do not store the original visitor cookie
  // in the vote record.

  const visitorHash = crypto
    .createHmac("sha256", secret)
    .update(`${id}:${visitor}`)
    .digest("hex");

  try {

    await Vote.create({
      pollId: id,
      visitorHash,
      option
    });

  } catch (error) {

    // Requires a MongoDB unique index
    // on pollId + visitorHash.

    if (error.code === 11000) {

      throw err(
        409,
        "Already voted"
      );
    }

    throw error;
  }

  // Return updated vote counts
  // from MongoDB.

  return totals(poll);
};

// ==========================================
// ADMIN - DELETE POLL
// ==========================================

exports.remove = async (id) => {

  // FIX: Use Poll, not undefined M.

  const deleted = await Poll.findOneAndDelete({
    id
  });

  if (!deleted) {

    throw err(
      404,
      "Poll not found"
    );
  }

  // Remove vote records belonging
  // to the deleted poll.

  await Vote.deleteMany({
    pollId: id
  });

  return {
    deleted: true
  };
};
