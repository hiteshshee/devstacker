const mongoose = require('mongoose');
const dns = require('dns');

// Some networks/ISPs can't resolve the SRV records that `mongodb+srv://` needs.
// Point Node's resolver at public DNS so the Atlas lookup works everywhere.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  /* ignore — fall back to system DNS */
}

// Serverless-friendly connection caching. On Vercel each function invocation may
// reuse a warm container, so we cache the connection promise on the global object
// to avoid opening a new pool on every request.
let cached = global.__devstacker_mongoose;
if (!cached) {
  cached = global.__devstacker_mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };
