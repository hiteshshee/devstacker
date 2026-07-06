const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'devstacker_session';

function signSession(payload) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

function readSession(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

// Cookie is httpOnly so JS can't read the GitHub token; secure in production.
function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  };
}

// Guard for routes that require a signed-in developer.
function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  req.session = session;
  next();
}

module.exports = {
  COOKIE_NAME,
  signSession,
  readSession,
  sessionCookieOptions,
  requireAuth,
};
