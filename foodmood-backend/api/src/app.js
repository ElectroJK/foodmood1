import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import recipesRoutes from './routes/recipes.js';
import scanRoutes from './routes/scan.js';
import communityRoutes from './routes/community.js';
import statsRoutes from './routes/stats.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.CORS_ORIGIN.includes(origin) || env.CORS_ORIGIN.includes('*')) {
          return cb(null, true);
        }
        return cb(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', (req, res) => res.json({ ok: true, service: 'api', env: env.NODE_ENV }));

  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/recipes', recipesRoutes);
  app.use('/api/scan', scanRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
