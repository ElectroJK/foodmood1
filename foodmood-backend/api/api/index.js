import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const app = createApp();
let dbReady;

function ensureDB() {
  if (!dbReady) dbReady = connectDB();
  return dbReady;
}

export default async function handler(req, res) {
  await ensureDB();
  return app(req, res);
}
