const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();

// List the signed-in user's repositories, most-recently-pushed first.
router.get('/repos', requireAuth, async (req, res) => {
  const token = req.session.gh;
  if (!token) return res.status(401).json({ error: 'No GitHub token' });

  try {
    const ghRes = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevStacker',
        },
      }
    );

    if (!ghRes.ok) {
      const body = await ghRes.text();
      console.error('GitHub repos error:', ghRes.status, body);
      return res
        .status(502)
        .json({ error: 'Failed to fetch repositories from GitHub' });
    }

    const repos = await ghRes.json();
    const now = Date.now();
    const STALE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    const simplified = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      openIssues: r.open_issues_count,
      private: r.private,
      url: r.html_url,
      pushedAt: r.pushed_at,
      stale: now - new Date(r.pushed_at).getTime() > STALE_MS,
    }));

    res.json({ repos: simplified });
  } catch (err) {
    console.error('GitHub repos exception:', err);
    res.status(500).json({ error: 'Server error fetching repositories' });
  }
});

module.exports = router;
