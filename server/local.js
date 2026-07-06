// Local development server. In production the same Express app is exported
// from api/index.js and run as a Vercel serverless function instead.
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`DevStacker API running on http://localhost:${PORT}`);
});
