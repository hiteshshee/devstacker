const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../auth');
const { connectDB } = require('../db');
const Resume = require('../models/Resume');

const router = express.Router();

// Keep uploads in memory (serverless has no persistent disk); cap at 4MB to
// stay within Vercel's request body limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// Ensure a DB connection before any handler runs.
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

// List the user's resumes (metadata only — never ship the binary here).
router.get('/', requireAuth, async (req, res) => {
  const resumes = await Resume.find({ owner: req.session.login })
    .select('-data')
    .sort({ updatedAt: -1 });
  res.json({ resumes });
});

// Upload a new resume version (multipart: file + label).
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required' });
  const label = (req.body.label || '').trim();
  if (!label) return res.status(400).json({ error: 'A label is required' });

  const resume = await Resume.create({
    owner: req.session.login,
    label,
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    size: req.file.size,
    data: req.file.buffer,
  });

  const obj = resume.toObject();
  delete obj.data;
  res.status(201).json({ resume: obj });
});

// Download / preview a resume's file.
router.get('/:id/download', requireAuth, async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    owner: req.session.login,
  });
  if (!resume) return res.status(404).json({ error: 'Resume not found' });

  res.set('Content-Type', resume.contentType);
  res.set(
    'Content-Disposition',
    `inline; filename="${resume.filename.replace(/"/g, '')}"`
  );
  res.send(resume.data);
});

// Record that this resume version was sent to a company.
router.post('/:id/sent', requireAuth, async (req, res) => {
  const { company, date, note } = req.body || {};
  if (!company || !company.trim()) {
    return res.status(400).json({ error: 'Company is required' });
  }
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, owner: req.session.login },
    {
      $push: {
        sentLog: {
          company: company.trim(),
          date: date ? new Date(date) : Date.now(),
          note: note || '',
        },
      },
    },
    { new: true, projection: { data: 0 } }
  );
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json({ resume });
});

// Remove a single "sent to company" entry from a resume.
router.delete('/:id/sent/:entryId', requireAuth, async (req, res) => {
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, owner: req.session.login },
    { $pull: { sentLog: { _id: req.params.entryId } } },
    { new: true, projection: { data: 0 } }
  );
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json({ resume });
});

// Delete a resume the user owns.
router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Resume.deleteOne({
    _id: req.params.id,
    owner: req.session.login,
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  res.json({ ok: true });
});

module.exports = router;
