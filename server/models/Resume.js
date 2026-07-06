const mongoose = require('mongoose');

// A record of sending a specific resume version to a company.
const SentEntrySchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: true }
);

const ResumeSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true }, // e.g. "Backend v2"
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    // The file bytes, stored inline. Resumes are small (well under Mongo's
    // 16MB document limit), so no separate object store is needed.
    data: { type: Buffer, required: true },
    sentLog: { type: [SentEntrySchema], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
