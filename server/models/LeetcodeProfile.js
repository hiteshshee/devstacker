const mongoose = require('mongoose');

// The latest synced snapshot of a user's LeetCode totals. One per owner.
const LeetcodeProfileSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    total: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.LeetcodeProfile ||
  mongoose.model('LeetcodeProfile', LeetcodeProfileSchema);
