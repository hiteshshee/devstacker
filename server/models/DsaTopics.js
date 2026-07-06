const mongoose = require('mongoose');

// The set of DSA topics a user has ticked as "covered". One doc per owner.
const DsaTopicsSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, unique: true, index: true },
    topics: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DsaTopics || mongoose.model('DsaTopics', DsaTopicsSchema);
