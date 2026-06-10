import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[api] listening on :${env.PORT}  (env: ${env.NODE_ENV})`);
  });

  async function shutdown(signal) {
    console.log(`[api] received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] fatal:', err);
  process.exit(1);
});
