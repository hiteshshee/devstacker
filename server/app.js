// Load env vars for local development (Vercel injects them in production).
try {
  require('dotenv').config();
} catch {
  /* dotenv is optional in production */
}

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const projectRoutes = require('./routes/projects');
const dsaRoutes = require('./routes/dsa');
const resumeRoutes = require('./routes/resumes');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Same-origin in production (served from one Vercel project). CORS is only
// relevant if the API is ever called from a different origin during local dev.
app.use(
  cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Routes are defined with the full /api prefix so the same app works both
// behind the Vercel rewrite (which passes the original URL) and in local dev.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'devstacker', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/resumes', resumeRoutes);

module.exports = app;
