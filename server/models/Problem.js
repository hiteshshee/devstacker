const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema(
  {
    // GitHub login of the owner — ties a solved problem to the signed-in developer.
    owner: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: { type: String, default: '', trim: true },
    platform: {
      type: String,
      enum: ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksforGeeks', 'Other'],
      default: 'LeetCode',
    },
    url: { type: String, default: '' },
    solvedAt: { type: Date, default: Date.now },
    // Used to dedupe LeetCode-synced problems; empty for manual entries.
    slug: { type: String, default: '' },
    source: {
      type: String,
      enum: ['manual', 'leetcode', 'codeforces', 'codechef'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);
