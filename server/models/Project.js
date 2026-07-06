const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    // GitHub login of the owner — ties a project to the signed-in developer.
    owner: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'paused', 'done'],
      default: 'active',
    },
    repo: { type: String, default: '' }, // optional linked repo full_name
  },
  { timestamps: true }
);

// Avoid OverwriteModelError when the module is re-imported in a warm container.
module.exports =
  mongoose.models.Project || mongoose.model('Project', ProjectSchema);
