import 'dotenv/config';

const required = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
};

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  MONGODB_URI: required('MONGODB_URI', 'mongodb://localhost:27017/foodmood'),
  JWT_SECRET: required('JWT_SECRET', 'dev-only-secret-change-me'),
  // Short-lived access token (held in memory by the frontend); refresh token
  // is set as an httpOnly cookie and rotates the access token silently.
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Legacy variable — kept for any old code paths still expecting a single TTL.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  // Frontend URL used in outbound email links (verification, password reset).
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'http://localhost:4100',

  // SMTP — optional. When unset, emails are logged to stdout instead of sent
  // (dev mode), which is sufficient for the diploma defence environment.
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'FoodMood <noreply@foodmood.local>',

  // Google OAuth — optional. The frontend obtains an ID token via the Google
  // Identity Services library and POSTs it to /api/auth/google.
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  // ML microservice (team-mate's recipe recommender). Optional.
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || '',
  ML_TIMEOUT_MS: parseInt(process.env.ML_TIMEOUT_MS || '5000', 10),
  // Shared secret for ML's protected endpoints (/feedback, /train,
  // /notifications/recipe-suggestions). Must match ML's INTERNAL_API_KEY.
  ML_INTERNAL_API_KEY:
    process.env.ML_INTERNAL_API_KEY || process.env.ML_INTERNAL_KEY || 'change-me',

  // Spoonacular external recipe API (free tier, optional).
  SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY || '',
  SPOONACULAR_TIMEOUT_MS: parseInt(process.env.SPOONACULAR_TIMEOUT_MS || '8000', 10),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
};
