import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Two-token authentication scheme (aligned with the diploma report).
//
//   • Access token  — short-lived (15 min by default), carried by the frontend
//     in memory and attached to every API request as a Bearer token.
//   • Refresh token — long-lived (7 d), issued at login / register and stored
//     in an httpOnly cookie. The frontend hits POST /api/auth/refresh whenever
//     the access token expires and silently receives a new one.
//
// The refresh token carries `type: 'refresh'` in its payload so an attacker
// who somehow obtains it cannot use it as an access token, and vice versa.

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

// Verifies a JWT and returns its decoded payload. Throws on invalid / expired.
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

// Backward-compatible wrapper kept so older imports continue to work.
// New code should call signAccessToken explicitly.
export function signToken(payload) {
  return signAccessToken(payload);
}

// Cookie options for the refresh token. `httpOnly` blocks JavaScript access
// (mitigating XSS), `sameSite: lax` blocks cross-site abuse while still
// allowing top-level GET navigations.
export const REFRESH_COOKIE_NAME = 'foodmood_refresh';
export function refreshCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
