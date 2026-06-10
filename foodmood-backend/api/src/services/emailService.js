// Outbound email service.
//
// Configuration is fully optional — when SMTP_HOST is not set the service
// falls back to a "dev transport" that logs the message body (including the
// verification link) to stdout instead of sending. This keeps registration
// working in the diploma defence environment without requiring a real SMTP
// account, while still exercising the full code path the production setup
// would take.
//
// To enable real sending, set the following env vars on the API:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let cachedTransport = null;

function buildTransport() {
  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // STARTTLS for 587, TLS for 465
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  // Dev fallback — logs to console, never actually sends.
  return {
    sendMail: async (opts) => {
      console.log('[email:dev] →', opts.to);
      console.log('[email:dev] subject:', opts.subject);
      console.log('[email:dev] body:');
      console.log(opts.text || opts.html);
      return { messageId: `dev-${Date.now()}` };
    },
  };
}

function getTransport() {
  if (!cachedTransport) cachedTransport = buildTransport();
  return cachedTransport;
}

export function isEmailConfigured() {
  return !!env.SMTP_HOST;
}

export async function sendVerificationEmail(to, token, displayName = '') {
  const link = `${env.FRONTEND_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#4A5568">
      <h2 style="color:#2D3748">Welcome to FoodMood</h2>
      <p>${greeting}</p>
      <p>Please confirm your email address by clicking the button below:</p>
      <p>
        <a href="${link}" style="display:inline-block;background:#B2D2A4;color:#2D3748;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a>
      </p>
      <p>Or paste this link into your browser:</p>
      <p style="word-break:break-all;color:#7FB069">${link}</p>
      <p style="color:#A0AEC0;font-size:12px">The link expires in 24 hours. If you did not create a FoodMood account, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Welcome to FoodMood\n\n${greeting}\n\nConfirm your email: ${link}\n\nThis link expires in 24 hours.`;
  return getTransport().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Confirm your FoodMood email',
    html,
    text,
  });
}

export async function sendPasswordResetEmail(to, token, displayName = '') {
  const link = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#4A5568">
      <h2 style="color:#2D3748">Reset your FoodMood password</h2>
      <p>${greeting}</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p>
        <a href="${link}" style="display:inline-block;background:#B2D2A4;color:#2D3748;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
      </p>
      <p style="color:#A0AEC0;font-size:12px">If you did not request a reset, ignore this email — your password will not change.</p>
    </div>
  `;
  return getTransport().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Reset your FoodMood password',
    html,
    text: `Reset your password: ${link}`,
  });
}
