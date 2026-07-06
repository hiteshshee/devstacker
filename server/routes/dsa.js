const express = require('express');
const { requireAuth } = require('../auth');
const { connectDB } = require('../db');
const Problem = require('../models/Problem');
const LeetcodeProfile = require('../models/LeetcodeProfile');
const CpProfile = require('../models/CpProfile');
const DsaTopics = require('../models/DsaTopics');
const leetcode = require('../leetcode');
const codeforces = require('../codeforces');
const codechef = require('../codechef');

const router = express.Router();

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

// List the current developer's recent solved problems (newest first, capped at
// 20) plus their latest synced LeetCode totals (source of truth for the stats).
router.get('/', requireAuth, async (req, res) => {
  const [problems, leetcodeProfile, cpProfiles, topicsDoc] = await Promise.all([
    Problem.find({ owner: req.session.login }).sort({ solvedAt: -1 }).limit(20),
    LeetcodeProfile.findOne({ owner: req.session.login }),
    CpProfile.find({ owner: req.session.login }),
    DsaTopics.findOne({ owner: req.session.login }),
  ]);
  const cp = {};
  for (const p of cpProfiles) cp[p.platform] = p;
  res.json({
    problems,
    leetcode: leetcodeProfile,
    cp, // { codeforces?, codechef? }
    topics: topicsDoc ? topicsDoc.topics : [],
  });
});

// Sync a Codeforces or CodeChef profile. Codeforces also imports recent solves.
async function syncCpPlatform(req, res, platform, client, importRecent) {
  const username = (req.body && req.body.username || '').trim();
  if (!username) {
    return res.status(400).json({ error: `${platform} username is required` });
  }
  try {
    const profile = await client.fetchProfile(username);

    await CpProfile.findOneAndUpdate(
      { owner: req.session.login, platform },
      {
        username: profile.username,
        solved: profile.solved,
        rating: profile.rating,
        rankLabel: profile.rankLabel,
        maxRating: profile.maxRating,
        syncedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    let imported = 0;
    if (importRecent && profile.recent && profile.recent.length) {
      const slugs = profile.recent.map((r) => r.slug);
      const existing = await Problem.find({
        owner: req.session.login,
        slug: { $in: slugs },
      }).select('slug');
      const have = new Set(existing.map((e) => e.slug));
      const fresh = profile.recent.filter((r) => !have.has(r.slug));
      if (fresh.length) {
        await Problem.insertMany(
          fresh.map((r) => ({
            owner: req.session.login,
            title: r.title,
            slug: r.slug,
            difficulty: r.difficulty,
            platform: 'Codeforces',
            source: 'codeforces',
            url: r.url || '',
            solvedAt: r.solvedAt,
          }))
        );
        imported = fresh.length;
      }
    }

    res.json({ platform, profile, imported });
  } catch (err) {
    console.error(`${platform} sync error:`, err.message);
    res.status(502).json({ error: err.message || `${platform} sync failed` });
  }
}

router.post('/sync-codeforces', requireAuth, (req, res) =>
  syncCpPlatform(req, res, 'codeforces', codeforces, true)
);
router.post('/sync-codechef', requireAuth, (req, res) =>
  syncCpPlatform(req, res, 'codechef', codechef, false)
);

// Save the user's ticked topics (replaces the whole set).
router.put('/topics', requireAuth, async (req, res) => {
  const topics = Array.isArray(req.body && req.body.topics)
    ? req.body.topics.filter((t) => typeof t === 'string')
    : [];
  const doc = await DsaTopics.findOneAndUpdate(
    { owner: req.session.login },
    { topics },
    { upsert: true, new: true }
  );
  res.json({ topics: doc.topics });
});

// Log a solved problem.
router.post('/', requireAuth, async (req, res) => {
  const { title, difficulty, topic, platform, url, solvedAt } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Problem title is required' });
  }
  const problem = await Problem.create({
    owner: req.session.login,
    title: title.trim(),
    difficulty: difficulty || 'medium',
    topic: (topic || '').trim(),
    platform: platform || 'LeetCode',
    url: url || '',
    solvedAt: solvedAt ? new Date(solvedAt) : Date.now(),
  });
  res.status(201).json({ problem });
});

// Sync from a public LeetCode profile: pull aggregate counts and import any
// recent accepted submissions that aren't already logged.
router.post('/sync-leetcode', requireAuth, async (req, res) => {
  const username = (req.body && req.body.username || '').trim();
  if (!username) return res.status(400).json({ error: 'LeetCode username is required' });

  try {
    const stats = await leetcode.fetchStats(username); // throws if user unknown

    // Persist the totals so the dashboard stats survive reloads.
    await LeetcodeProfile.findOneAndUpdate(
      { owner: req.session.login },
      { username, ...stats, syncedAt: new Date() },
      { upsert: true, new: true }
    );

    let imported = 0;
    let recent = [];
    try {
      recent = await leetcode.fetchRecentAC(username, 20);
    } catch {
      recent = []; // recent list can be private — counts still succeed
    }

    if (recent.length) {
      const slugs = recent.map((r) => r.slug);
      const existing = await Problem.find({
        owner: req.session.login,
        slug: { $in: slugs },
      }).select('slug');
      const have = new Set(existing.map((e) => e.slug));
      const fresh = recent.filter((r) => !have.has(r.slug));

      // Look up difficulty for each new problem (parallel).
      const withDiff = await Promise.all(
        fresh.map(async (r) => ({
          ...r,
          difficulty: await leetcode.fetchDifficulty(r.slug),
        }))
      );

      if (withDiff.length) {
        await Problem.insertMany(
          withDiff.map((r) => ({
            owner: req.session.login,
            title: r.title,
            slug: r.slug,
            difficulty: r.difficulty,
            platform: 'LeetCode',
            source: 'leetcode',
            url: `https://leetcode.com/problems/${r.slug}/`,
            solvedAt: r.solvedAt,
          }))
        );
        imported = withDiff.length;
      }
    }

    res.json({ username, stats, imported, recentVisible: recent.length > 0 });
  } catch (err) {
    console.error('LeetCode sync error:', err.message);
    res.status(502).json({ error: err.message || 'LeetCode sync failed' });
  }
});

// Delete a solved problem the user owns.
router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Problem.deleteOne({
    _id: req.params.id,
    owner: req.session.login,
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Problem not found' });
  }
  res.json({ ok: true });
});

module.exports = router;
