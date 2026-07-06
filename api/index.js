// Vercel serverless entrypoint. The Vercel rewrite in vercel.json sends every
// /api/* request here; Express then routes it by the original URL.
module.exports = require('../server/app');
