const express = require('express');
const { requireAuth } = require('../auth');
const { connectDB } = require('../db');
const Project = require('../models/Project');

const router = express.Router();

// Ensure a DB connection before any project handler runs.
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connect error:', err);
    res
      .status(503)
      .json({ error: 'Database is not configured or unreachable.' });
  }
});

// List the current developer's projects.
router.get('/', requireAuth, async (req, res) => {
  const projects = await Project.find({ owner: req.session.login }).sort({
    updatedAt: -1,
  });
  res.json({ projects });
});

// Create a project.
router.post('/', requireAuth, async (req, res) => {
  const { name, description, repo, status } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  const project = await Project.create({
    owner: req.session.login,
    name: name.trim(),
    description: description || '',
    repo: repo || '',
    status: status || 'active',
  });
  res.status(201).json({ project });
});

// Update status (or other fields) of a project the user owns.
router.patch('/:id', requireAuth, async (req, res) => {
  const updates = {};
  ['name', 'description', 'status', 'repo'].forEach((k) => {
    if (req.body && req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, owner: req.session.login },
    updates,
    { new: true }
  );
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

// Delete a project the user owns.
router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Project.deleteOne({
    _id: req.params.id,
    owner: req.session.login,
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ ok: true });
});

module.exports = router;
