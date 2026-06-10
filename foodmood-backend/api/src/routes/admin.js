// Admin Dashboard backend.
//
// All routes here are protected by authRequired + requireAdmin, so a regular
// user that somehow finds /api/admin/* gets a clean 403 instead of any data
// leak. The dashboard frontend (src/app/pages/AdminDashboard.tsx) consumes
// these endpoints to render the KPIs row, the users table, and the per-user
// status / role controls.

import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import FoodItem from '../models/FoodItem.js';
import CommunityListing from '../models/CommunityListing.js';
import { authRequired, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired, requireAdmin);

// ──────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats — KPI row on top of the dashboard
// ──────────────────────────────────────────────────────────────────────────
//
// Returns platform-wide aggregates: total registered users, users active in
// the last 24 hours (proxy for "online"), receipts scanned today, and the
// cumulative CO2 offset across all users in kilograms. Computed in parallel
// so the dashboard loads in a single round-trip.
router.get('/stats', async (req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalUsers, activeUsers, bannedUsers, scansToday, co2Agg] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastActiveAt: { $gte: dayAgo } }),
    User.countDocuments({ status: 'banned' }),
    FoodItem.countDocuments({ addedDate: { $gte: startOfDay } }),
    User.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.co2Offset' } } },
    ]),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    bannedUsers,
    scansToday,
    co2SavedKg: Math.round((co2Agg[0]?.total || 0) * 10) / 10,
  });
});

// ──────────────────────────────────────────────────────────────────────────
// GET /api/admin/users — paginated user list with search
// ──────────────────────────────────────────────────────────────────────────
//
// Query params:
//   q       optional case-insensitive substring matched against name + email
//   status  optional filter: 'active' | 'inactive' | 'banned'
//   role    optional filter: 'user' | 'admin'
//   page    1-indexed page (default 1)
//   limit   page size (default 20, max 100)
router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users: users.map((u) => u.toAdminRow()),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
});

// ──────────────────────────────────────────────────────────────────────────
// GET /api/admin/users/:id — full user details (including stats)
// ──────────────────────────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const [pantryCount, sharedCount] = await Promise.all([
    FoodItem.countDocuments({ user: user._id, status: 'active' }),
    CommunityListing.countDocuments({ user: user._id }),
  ]);
  res.json({
    user: {
      ...user.toPublicJSON(),
      scansCount: user.scansCount || 0,
      lastActiveAt: user.lastActiveAt,
      pantryCount,
      sharedCount,
    },
  });
});

// ──────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id — change status / role / name
// ──────────────────────────────────────────────────────────────────────────
//
// Admins cannot demote themselves to a non-admin role — guards against the
// last-admin-locked-out problem during testing.
router.patch(
  '/users/:id',
  validate({
    body: z.object({
      status: z.enum(['active', 'inactive', 'banned']).optional(),
      role: z.enum(['user', 'admin']).optional(),
      name: z.string().min(1).max(80).optional(),
    }),
  }),
  async (req, res) => {
    if (req.params.id === req.userId.toString() && req.body.role === 'user') {
      return res.status(400).json({ error: 'You cannot demote yourself.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof req.body.status === 'string') user.status = req.body.status;
    if (typeof req.body.role === 'string') user.role = req.body.role;
    if (typeof req.body.name === 'string') user.name = req.body.name;

    await user.save();
    res.json({ user: user.toAdminRow() });
  }
);

// ──────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/:id/ban   and   /unban
// ──────────────────────────────────────────────────────────────────────────
//
// Convenience routes — equivalent to PATCH with { status }. The admin UI uses
// these for the row-action context menu.
router.post('/users/:id/ban', async (req, res) => {
  if (req.params.id === req.userId.toString()) {
    return res.status(400).json({ error: 'You cannot ban yourself.' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'banned' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: user.toAdminRow() });
});

router.post('/users/:id/unban', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'active' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: user.toAdminRow() });
});

// ──────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id — hard delete
// ──────────────────────────────────────────────────────────────────────────
//
// Soft-deletion (status: 'banned') is preferred and exposed through the
// /ban endpoint above. This endpoint is kept for GDPR "right to be forgotten"
// requests handled by admins on the user's behalf.
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.userId.toString()) {
    return res.status(400).json({ error: 'You cannot delete yourself.' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Best-effort cleanup of the user's data — not transactional, but the user
  // document is already gone so orphans are at worst harmless.
  await Promise.all([
    FoodItem.deleteMany({ user: req.params.id }),
    CommunityListing.deleteMany({ user: req.params.id }),
  ]);
  res.json({ ok: true });
});

export default router;
