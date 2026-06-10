import { Router } from 'express';
import { z } from 'zod';
import Recipe from '../models/Recipe.js';
import FoodItem from '../models/FoodItem.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recommendForUser } from '../services/recommender.js';
import { recommendFromML, isMlConfigured, sendMlFeedback, triggerMlTrain } from '../services/mlClient.js';
import {
  findRecipesByIngredients,
  hydrateRecipeDetails,
  isSpoonacularConfigured,
} from '../services/spoonacularClient.js';
import { computeStatsDelta, applyDelta } from '../services/statsCalculator.js';
import {
  attachPreferencesToRecipes,
  getPreferencesMap,
  preferenceFromAction,
  setRecipePreference,
  clearRecipePreference,
  toMlFeedbackAction,
  filterDislikedRecipes,
} from '../services/recipePreferences.js';

const router = Router();

const feedbackBodySchema = z.object({
  recipeId: z.string().min(1).optional(),
  action: z.enum([
    'view',
    'cook',
    'cooked',
    'dismiss',
    'dismissed',
    'like',
    'liked',
    'unliked',
    'unlike',
    'clear',
  ]),
  scoreShown: z.number().optional(),
  daysToExpiry: z.number().int().optional(),
  canonicalTarget: z.string().optional(),
  personalRank: z.number().optional(),
  matchPercentage: z.number().optional(),
});

async function handleRecipeFeedback(userId, recipeId, body) {
  if (body.action === 'clear') {
    await clearRecipePreference(userId, recipeId);
    return;
  }

  const mlAction = toMlFeedbackAction(body.action);
  if (mlAction) {
    const scoreShown =
      body.scoreShown ??
      (typeof body.personalRank === 'number'
        ? body.personalRank <= 1
          ? body.personalRank
          : body.personalRank / 100
        : typeof body.matchPercentage === 'number'
          ? body.matchPercentage / 100
        : undefined);
    sendMlFeedback({
      userId: userId.toString(),
      recipeId,
      action: mlAction,
      canonicalTarget: body.canonicalTarget,
      scoreShown,
      daysToExpiry: body.daysToExpiry,
    });
  }

  const pref = preferenceFromAction(body.action);
  if (pref === 'liked') {
    await setRecipePreference(userId, recipeId, 'liked');
  } else if (pref === 'disliked') {
    await setRecipePreference(userId, recipeId, 'disliked');
  }
}

// Public: list all recipes (no ranking, no auth).
router.get('/', async (req, res) => {
  const recipes = await Recipe.find({}).limit(100).lean();
  res.json({
    recipes: recipes.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      cookingTime: r.cookingTime,
      servings: r.servings,
      image: r.image,
      ingredients: r.ingredients.map(({ name, amount }) => ({ name, amount, inPantry: false })),
      instructions: r.instructions || [],
      matchPercentage: 0,
    })),
  });
});

router.get('/preferences', authRequired, async (req, res) => {
  const preferences = await getPreferencesMap(req.userId);
  res.json({ preferences });
});

router.post(
  '/feedback',
  authRequired,
  validate({ body: feedbackBodySchema }),
  async (req, res) => {
    const recipeId = req.body.recipeId;
    if (!recipeId) return res.status(400).json({ error: 'recipeId is required' });
    await handleRecipeFeedback(req.userId, recipeId, req.body);
    const preferences = await getPreferencesMap(req.userId);
    res.json({ ok: true, preference: preferences[recipeId] || null });
  }
);

router.get('/:id', async (req, res) => {
  let r = await Recipe.findById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Recipe not found' });
  if (isSpoonacularConfigured() && (r.instructions || []).length === 0) {
    r = await hydrateRecipeDetails(r);
  }
  res.json({
    recipe: {
      id: r._id.toString(),
      name: r.name,
      cookingTime: r.cookingTime,
      servings: r.servings,
      image: r.image,
      ingredients: r.ingredients.map(({ name, amount }) => ({ name, amount, inPantry: false })),
      instructions: r.instructions || [],
    },
  });
});

// Recommendation fallback chain:
//   1. ML microservice — personalized when userId is supplied (returns meta + personalRank)
//   2. Spoonacular external API
//   3. Local rule-based ranker (always available)
function candidateLimitForFirstPage(limit, preferences = {}) {
  const dislikedCount = Object.values(preferences).filter((p) => p === 'disliked').length;
  return Math.min(50, Math.max(limit, limit + dislikedCount + 8));
}

function hideDislikedFirstPage(recipes, limit, preferences = {}) {
  return filterDislikedRecipes(recipes, preferences).slice(0, limit);
}

async function getRecommendations(pantry, limit, userId, preferences = {}) {
  const candidateLimit = candidateLimitForFirstPage(limit, preferences);

  if (isMlConfigured()) {
    const ml = await recommendFromML(pantry, { limit: candidateLimit, userId });
    if (ml && ml.recipes && ml.recipes.length > 0) {
      const recipes = hideDislikedFirstPage(ml.recipes, limit, preferences);
      if (recipes.length > 0) {
        return {
          recipes,
          source: 'ml',
          meta: ml.meta,
          modelVersion: ml.modelVersion,
        };
      }
    }
  }
  if (isSpoonacularConfigured()) {
    const sp = await findRecipesByIngredients(pantry, { limit: Math.min(candidateLimit, 25) });
    if (sp && sp.length > 0) {
      const recipes = hideDislikedFirstPage(sp, limit, preferences);
      if (recipes.length > 0) {
        return {
          recipes,
          source: 'spoonacular',
          meta: null,
        };
      }
    }
  }
  const local = await recommendForUser(pantry, { limit: candidateLimit });
  return { recipes: hideDislikedFirstPage(local, limit, preferences), source: 'rule-based', meta: null };
}

router.get('/recommend/me', authRequired, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '12', 10), 25);
  const pantry = await FoodItem.find({ user: req.userId, status: 'active' }).lean();
  const preferences = await getPreferencesMap(req.userId);
  const result = await getRecommendations(pantry, limit, req.userId, preferences);
  res.json({
    recipes: attachPreferencesToRecipes(result.recipes, preferences),
    source: result.source,
    meta: result.meta || null,
    modelVersion: result.modelVersion || null,
    preferences,
  });
});

router.post(
  '/recommend',
  authRequired,
  validate({
    body: z.object({
      pantry: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.number().optional(),
            unit: z.string().optional(),
            expiryDate: z.string().optional(),
            category: z.string().optional(),
            price: z.number().optional(),
          })
        )
        .optional(),
      limit: z.number().int().positive().max(25).optional(),
    }),
  }),
  async (req, res) => {
    const pantry =
      req.body.pantry?.length
        ? req.body.pantry
        : await FoodItem.find({ user: req.userId, status: 'active' }).lean();
    const limit = req.body.limit || 12;
    const preferences = await getPreferencesMap(req.userId);
    const result = await getRecommendations(pantry, limit, req.userId, preferences);
    res.json({
      recipes: result.recipes,
      source: result.source,
      meta: result.meta || null,
      modelVersion: result.modelVersion || null,
    });
  }
);

// Recipe interaction feedback — ML ranker + liked/disliked persistence.
router.post(
  '/:id/feedback',
  authRequired,
  validate({ body: feedbackBodySchema.omit({ recipeId: true }) }),
  async (req, res) => {
    await handleRecipeFeedback(req.userId, req.params.id, req.body);
    const preferences = await getPreferencesMap(req.userId);
    res.json({ ok: true, preference: preferences[req.params.id] || null });
  }
);

// Admin: trigger a full ML retrain (e.g. after seeding). Best-effort.
router.post('/retrain', authRequired, async (req, res) => {
  const status = await triggerMlTrain();
  res.json({ ok: !!status, status });
});

// Marking a recipe as cooked: consumes matching pantry items + sends 'cook' feedback.
router.post('/:id/use', authRequired, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).lean();
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  const pantry = await FoodItem.find({ user: req.userId, status: 'active' });
  const wantedTokens = new Set();
  for (const ing of recipe.ingredients) {
    const n = (ing.normalizedName || String(ing.name)).toLowerCase().trim();
    if (n) wantedTokens.add(n);
    for (const tok of n.split(' ')) if (tok.length >= 3) wantedTokens.add(tok);
  }

  const consumed = [];
  for (const item of pantry) {
    const itemName = item.name.toLowerCase().trim();
    let matched = false;
    if (wantedTokens.has(itemName)) matched = true;
    if (!matched) {
      for (const tok of itemName.split(' ')) {
        if (tok.length >= 3 && wantedTokens.has(tok)) {
          matched = true;
          break;
        }
      }
    }
    if (matched) {
      const delta = computeStatsDelta(item, 'consumed');
      applyDelta(req.user, delta);
      item.status = 'consumed';
      item.consumedAt = new Date();
      await item.save();
      consumed.push(item.toDTO());
    }
  }
  await req.user.save();

  // Tell the ML ranker the user actually cooked this recipe.
  sendMlFeedback({
    userId: req.userId.toString(),
    recipeId: req.params.id,
    action: 'cook',
  });

  res.json({ ok: true, consumed, stats: req.user.stats });
});

export default router;
