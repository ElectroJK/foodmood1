// Google OAuth — server-side ID-token verification.
//
// The frontend uses Google Identity Services (the "Sign in with Google"
// button) to obtain an ID token from Google. That token is then POSTed to
// /api/auth/google, where this module verifies it against Google's public
// keys and returns the trusted user profile. We never see the user's Google
// password — Google does the authentication for us.
//
// The OAuth 2.0 flow used here is the implicit OpenID-Connect flow that
// Google Identity Services performs in-browser; the back-end only handles
// step 5 of the spec ("verify the ID token at the resource server").

import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

let cachedClient = null;

export function isGoogleConfigured() {
  return !!env.GOOGLE_CLIENT_ID;
}

function getClient() {
  if (!cachedClient) {
    cachedClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return cachedClient;
}

// Verifies a Google-issued ID token and returns the trusted payload
// (sub = stable Google user id, email, name, picture, …).
// Throws when the token is missing, expired, or signed for a different audience.
export async function verifyGoogleIdToken(idToken) {
  if (!isGoogleConfigured()) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Google ID token');
  }
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Google ID token missing required claims');
  }
  return {
    googleId: payload.sub,
    email: String(payload.email).toLowerCase(),
    emailVerified: !!payload.email_verified,
    name: payload.name || payload.given_name || '',
    picture: payload.picture || '',
  };
}
