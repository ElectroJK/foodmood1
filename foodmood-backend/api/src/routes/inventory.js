import { Router } from 'express';
import { z } from 'zod';
import FoodItem from '../models/FoodItem.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { computeStatsDelta, applyDelta } from '../services/statsCalculator.js';
import { confirmReceiptWithML } from '../services/mlClient.js';

const router = Router();
router.use(authRequired);

const CATEGORIES = [
  'Dairy', 'Meat', 'Veggies', 'Fruits', 'Bakery', 'Grains',
  'Pantry', 'Frozen', 'Beverages', 'Other',
];
const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'pack'];

const dateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');

const createSchema = {
  body: z.object({
    name: z.string().min(1).max(120),
    category: z.enum(CATEGORIES).default('Other'),
    quantity: z.number().nonnegative(),
    unit: z.enum(UNITS).default('pcs'),
    price: z.number().nonnegative().default(0),
    expiryDate: dateString,
    addedDate: dateString.optional(),
    image: z.string().url().optional(),
  }),
};

const updateSchema = {
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    category: z.enum(CATEGORIES).optional(),
    quantity: z.number().nonnegative().optional(),
    unit: z.enum(UNITS).optional(),
    price: z.number().nonnegative().optional(),
    expiryDate: dateString.optional(),
    image: z.string().url().optional(),
  }),
};

router.get('/', async (req, res) => {
  const { status = 'active', sortBy = 'expiryDate' } = req.query;
  const items = await FoodItem.find({ user: req.userId, status })
    .sort({ [sortBy]: 1 });
  res.json({ items: items.map((i) => i.toDTO()) });
});

router.post('/', validate(createSchema), async (req, res) => {
  const item = await FoodItem.create({
    ...req.body,
    expiryDate: new Date(req.body.expiryDate),
    addedDate: req.body.addedDate ? new Date(req.body.addedDate) : new Date(),
    user: req.userId,
  });
  res.status(201).json({ item: item.toDTO() });
});

router.post(
  '/batch',
  validate({ body: z.object({ items: z.array(createSchema.body).min(1).max(100) }) }),
  async (req, res) => {
    const docs = req.body.items.map((it) => ({
      ...it,
      expiryDate: new Date(it.expiryDate),
      addedDate: it.addedDate ? new Date(it.addedDate) : new Date(),
      user: req.userId,
    }));
    const created = await FoodItem.insertMany(docs);
    confirmReceiptWithML({
      userId: req.userId.toString(),
      parsedItems: req.body.items,
      confirmedItems: req.body.items,
    });
    // Track activity for the admin dashboard.
    req.user.scansCount = (req.user.scansCount || 0) + 1;
    req.user.lastActiveAt = new Date();
    req.user.save().catch(() => {});
    res.status(201).json({ items: created.map((i) => i.toDTO()) });
  }
);

router.patch('/:id', validate(updateSchema), async (req, res) => {
  const update = { ...req.body };
  if (update.expiryDate) update.expiryDate = new Date(update.expiryDate);
  const item = await FoodItem.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    update,
    { new: true }
  );
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item: item.toDTO() });
});

router.delete('/:id', async (req, res) => {
  const item = await FoodItem.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});

async function disposeAction(req, res, action) {
  const item = await FoodItem.findOne({ _id: req.params.id, user: req.userId, status: 'active' });
  if (!item) return res.status(404).json({ error: 'Active item not found' });

  const delta = computeStatsDelta(item, action);
  applyDelta(req.user, delta);
  await req.user.save();

  item.status = action;
  item.consumedAt = new Date();
  await item.save();

  res.json({ ok: true, item: item.toDTO(), stats: req.user.stats, delta });
}

router.post('/:id/consume', (req, res) => disposeAction(req, res, 'consumed'));
router.post('/:id/discard', (req, res) => disposeAction(req, res, 'discarded'));
router.post('/:id/share', (req, res) => disposeAction(req, res, 'shared'));

export default router;
