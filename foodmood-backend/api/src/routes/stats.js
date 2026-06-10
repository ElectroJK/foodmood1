import { Router } from 'express';
import FoodItem from '../models/FoodItem.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/me', (req, res) => {
  res.json({ stats: req.user.stats });
});

// Time-series analytics for the Analytics page charts.
// Returns weekly aggregates over the last N weeks.
router.get('/analytics', async (req, res) => {
  const weeks = Math.min(parseInt(req.query.weeks || '12', 10), 52);
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const docs = await FoodItem.aggregate([
    { $match: { user: req.userId, consumedAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$consumedAt' },
          week: { $isoWeek: '$consumedAt' },
          status: '$status',
        },
        count: { $sum: 1 },
        money: { $sum: '$price' },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  const byWeek = {};
  for (const d of docs) {
    const key = `${d._id.year}-W${String(d._id.week).padStart(2, '0')}`;
    if (!byWeek[key]) {
      byWeek[key] = { week: key, consumed: 0, discarded: 0, shared: 0, moneySaved: 0 };
    }
    byWeek[key][d._id.status] = d.count;
    if (d._id.status === 'consumed') byWeek[key].moneySaved += d.money;
  }

  const categoryBreakdown = await FoodItem.aggregate([
    { $match: { user: req.userId } },
    { $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } },
  ]);

  res.json({
    stats: req.user.stats,
    weekly: Object.values(byWeek),
    categories: categoryBreakdown.map((c) => ({
      category: c._id.category,
      status: c._id.status,
      count: c.count,
    })),
  });
});

export default router;
