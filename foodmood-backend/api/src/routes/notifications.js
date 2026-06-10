import { Router } from 'express';
import Notification from '../models/Notification.js';
import FoodItem from '../models/FoodItem.js';
import { authRequired } from '../middleware/auth.js';
import { getMlRecipeSuggestions } from '../services/mlClient.js';

const router = Router();
router.use(authRequired);

// Generate "live" expiry alerts on demand. We don't pre-persist them because
// the source of truth is the inventory itself — this keeps things simple and
// avoids stale notifications when items get consumed.
function expiryNotifications(items) {
  const out = [];
  const now = new Date();
  for (const it of items) {
    const days = Math.ceil((new Date(it.expiryDate).getTime() - now.getTime()) / 86400000);
    if (days <= 0) {
      out.push({
        id: `expiry-${it._id}`,
        type: 'expiry_critical',
        title: 'Expired item',
        body: `${it.name} expired ${Math.abs(days)} day(s) ago`,
        payload: { itemId: it._id.toString() },
        read: false,
        createdAt: now,
      });
    } else if (days <= 2) {
      out.push({
        id: `expiry-${it._id}`,
        type: 'expiry_critical',
        title: 'Expires soon',
        body: `${it.name} expires in ${days} day(s)`,
        payload: { itemId: it._id.toString() },
        read: false,
        createdAt: now,
      });
    } else if (days <= 5) {
      out.push({
        id: `expiry-${it._id}`,
        type: 'expiry_warning',
        title: 'Use it up',
        body: `${it.name} expires in ${days} days`,
        payload: { itemId: it._id.toString() },
        read: false,
        createdAt: now,
      });
    }
  }
  return out;
}

// Map an ML recipe-suggestion notification into our notification DTO.
// The ML payload shape (RecipeSuggestionNotification):
//   { id, type:'recipe_suggestion', title, body, itemName, canonicalName,
//     daysToExpiry, recipes: [RecipeOut] }
function mlSuggestionToDTO(n) {
  return {
    id: n.id || `ml-recipe-${n.canonicalName || n.itemName}`,
    type: 'recipe_suggestion',
    title: n.title,
    body: n.body,
    payload: {
      itemName: n.itemName,
      canonicalName: n.canonicalName,
      daysToExpiry: n.daysToExpiry,
      recipes: n.recipes || [],
    },
    read: false,
    createdAt: new Date(),
  };
}

router.get('/', async (req, res) => {
  const items = await FoodItem.find({ user: req.userId, status: 'active' });
  const live = expiryNotifications(items);
  const stored = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);

  // Best-effort ML recipe suggestions — if ML is down/slow, this returns null
  // and we just show the expiry + stored notifications. The screen never breaks.
  let mlSuggestions = [];
  const ml = await getMlRecipeSuggestions(req.userId.toString(), {
    itemsLimit: 3,
    recipesPerItem: 3,
  });
  if (Array.isArray(ml)) {
    mlSuggestions = ml.map(mlSuggestionToDTO);
  }

  res.json({
    // ML suggestions first (most actionable), then live expiry alerts, then history.
    notifications: [...mlSuggestions, ...live, ...stored.map((n) => n.toDTO())],
  });
});

router.post('/:id/read', async (req, res) => {
  const updated = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { read: true },
    { new: true }
  );
  if (!updated) return res.json({ ok: true, ephemeral: true });
  res.json({ notification: updated.toDTO() });
});

export default router;
