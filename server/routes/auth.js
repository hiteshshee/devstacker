const express = require('express');
const {
  COOKIE_NAME,
  signSession,
  readSession,
  sessionCookieOptions,
} = require('../auth');

const router = express.Router();

function appUrl() {
  return process.env.APP_URL || 'http://localhost:5173';
}

function githubConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );
}

// Step 1: send the user to GitHub's consent screen.
router.get('/github', (req, res) => {
  if (!githubConfigured()) {
    return res
      .status(503)
      .json({ error: 'GitHub OAuth is not configured on the server.' });
  }
  const redirectUri = `${appUrl()}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user repo',
    allow_signup: 'true',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects back with a code; exchange it for an access token.
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${appUrl()}/?auth=missing_code`);

  try {
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return res.redirect(`${appUrl()}/?auth=failed`);

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevStacker',
      },
    });
    const user = await userRes.json();

    // Store the GitHub token inside the signed httpOnly cookie.
    const token = signSession({
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      gh: accessToken,
    });
    res.cookie(COOKIE_NAME, token, sessionCookieOptions());
    res.redirect(`${appUrl()}/?auth=ok`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${appUrl()}/?auth=error`);
  }
});

// Who am I? Used by the frontend on load.
router.get('/me', (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    login: session.login,
    name: session.name,
    avatar: session.avatar,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// Lets the frontend show a helpful message when OAuth isn't set up yet.
router.get('/status', (req, res) => {
  res.json({ githubConfigured: githubConfigured() });
});

module.exports = router;
