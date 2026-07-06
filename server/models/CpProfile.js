const mongoose = require('mongoose');

// Generic competitive-programming profile snapshot (Codeforces, CodeChef).
// LeetCode keeps its own richer model (LeetcodeProfile).
const CpProfileSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    platform: { type: String, required: true }, // 'codeforces' | 'codechef'
    username: { type: String, required: true },
    solved: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    rankLabel: { type: String, default: '' }, // e.g. "specialist" or "4★"
    maxRating: { type: Number, default: 0 },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CpProfileSchema.index({ owner: 1, platform: 1 }, { unique: true });

module.exports =
  mongoose.models.CpProfile || mongoose.model('CpProfile', CpProfileSchema);
