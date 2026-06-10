// Client for the ML microservice (team-mate's FastAPI service).
//
// Contracts (verified against ml-service/app/schemas.py + routes/*):
//
//   POST /recommend                          (public, service-to-service)
//     req:  { pantry: [{name,quantity,unit,expiryDate,category?,price?}], limit, userId? }
//     res:  { recipes: [RecipeOut], modelVersion, meta: RecommendMeta }
//           RecipeOut additionally carries: urgentIngredientsUsed[], score, personalRank
//
//   POST /feedback                           (protected: X-Internal-Key)
//     req:  { userId, recipeId, action: 'view'|'cook'|'dismiss'|'like',
//             canonicalTarget?, scoreShown?, daysToExpiry? }
//
//   POST /train                              (protected: X-Internal-Key)
//   GET  /notifications/recipe-suggestions   (protected: X-Internal-Key)
//     query: userId, itemsLimit, recipesPerItem
//     res:  { notifications: [RecipeSuggestionNotification], modelVersion }
//
//   POST /receipts/confirm                   (public, service-to-service)
//     req:  { userId, rawText, meanConfidence, parsedItems[], confirmedItems[] }
//
// Every function fails soft: on timeout / non-2xx / network error it logs a
// warning and returns null (or silently no-ops for fire-and-forget calls), so
// the main API keeps working via the Spoonacular / rule-based fallback chain.

import { env } from '../config/env.js';

export function isMlConfigured() {
  return !!env.ML_SERVICE_URL;
}

function mlUrl(path) {
  return `${env.ML_SERVICE_URL.replace(/\/$/, '')}${path}`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('ML timeout')), ms)),
  ]);
}

function internalHeaders(extra = {}) {
  return { 'X-Internal-Key': env.ML_INTERNAL_API_KEY, ...extra };
}

/** ML sends personalRank as 0–100; tolerate legacy 0–1 responses. */
function normalizePersonalRank(v) {
  if (v == null || typeof v !== 'number' || Number.isNaN(v)) return null;
  const pct = v <= 1 ? v * 100 : v;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

// Normalize a single ML recipe into the frontend DTO, preserving the
// ML-specific explainability fields (urgentIngredientsUsed, score, personalRank).
function parseRecipe(r) {
  return {
    id: r.id || r._id || r.recipeId,
    name: r.name || r.title,
    matchPercentage: r.matchPercentage ?? Math.round((r.score || 0) * 100),
    cookingTime: r.cookingTime ?? 30,
    servings: r.servings ?? 2,
    ingredients: (r.ingredients || []).map((i) => ({
      name: i.name,
      amount: i.amount || i.quantity || '',
      inPantry: !!i.inPantry,
    })),
    instructions: r.instructions || r.steps || [],
    image: r.image || r.image_url || '',
    urgentIngredientsUsed: r.urgentIngredientsUsed || [],
    score: typeof r.score === 'number' ? r.score : undefined,
    personalRank: normalizePersonalRank(r.personalRank),
    mlInsight: r.mlInsight || null,
  };
}

// POST /recommend — returns { recipes, meta, modelVersion } or null on failure.
export async function recommendFromML(pantryItems, opts = {}) {
  if (!isMlConfigured()) return null;
  const payload = {
    pantry: pantryItems.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      expiryDate:
        it.expiryDate instanceof Date ? it.expiryDate.toISOString() : it.expiryDate,
      category: it.category,
      price: it.price,
    })),
    limit: opts.limit || 12,
  };
  // Passing userId unlocks personalized ranking + personalRank in the response.
  if (opts.userId) payload.userId = String(opts.userId);

  try {
    const res = await withTimeout(
      fetch(mlUrl('/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      env.ML_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`ML /recommend returned ${res.status}`);
    const data = await res.json();
    const recipes = (data.recipes || []).map(parseRecipe);
    return {
      recipes,
      meta: data.meta || null,
      modelVersion: data.modelVersion || null,
    };
  } catch (err) {
    console.warn('[ml] /recommend fallback:', err.message);
    return null;
  }
}

// POST /feedback — fire-and-forget. Never throws; the caller should not await
// it on the critical path.
export async function sendMlFeedback(event) {
  if (!isMlConfigured()) return;
  try {
    const res = await withTimeout(
      fetch(mlUrl('/feedback'), {
        method: 'POST',
        headers: internalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(event),
      }),
      env.ML_TIMEOUT_MS
    );
    if (!res.ok) {
      console.warn('[ml] /feedback returned', res.status);
    }
  } catch (err) {
    console.warn('[ml] /feedback failed:', err.message);
  }
}

// POST /train — manual full retrain. Returns the training status JSON or null.
export async function triggerMlTrain() {
  if (!isMlConfigured()) return null;
  try {
    const res = await withTimeout(
      fetch(mlUrl('/train'), { method: 'POST', headers: internalHeaders() }),
      env.ML_TIMEOUT_MS * 6 // training can be slow
    );
    if (!res.ok) throw new Error(`ML /train returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[ml] /train failed:', err.message);
    return null;
  }
}

// GET /notifications/recipe-suggestions — returns notifications[] or null.
export async function getMlRecipeSuggestions(userId, opts = {}) {
  if (!isMlConfigured() || !userId) return null;
  const url = new URL(mlUrl('/notifications/recipe-suggestions'));
  url.searchParams.set('userId', String(userId));
  url.searchParams.set('itemsLimit', String(opts.itemsLimit || 3));
  url.searchParams.set('recipesPerItem', String(opts.recipesPerItem || 3));
  try {
    const res = await withTimeout(
      fetch(url.toString(), { headers: internalHeaders() }),
      env.ML_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`ML recipe-suggestions returned ${res.status}`);
    const data = await res.json();
    return data.notifications || [];
  } catch (err) {
    console.warn('[ml] recipe-suggestions failed:', err.message);
    return null;
  }
}

// POST /receipts/confirm — service-to-service. Returns the result JSON or null.
export async function confirmReceiptWithML(payload) {
  if (!isMlConfigured()) return null;
  try {
    const res = await withTimeout(
      fetch(mlUrl('/receipts/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      env.ML_TIMEOUT_MS * 2
    );
    if (!res.ok) throw new Error(`ML /receipts/confirm returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[ml] /receipts/confirm failed:', err.message);
    return null;
  }
}

// POST /receipts/filter — filter out non-food items using ML classifier. Returns filtered items JSON or null.
export async function filterReceiptItemsWithML(parsedItems) {
  if (!isMlConfigured() || !parsedItems || parsedItems.length === 0) return null;
  try {
    const res = await withTimeout(
      fetch(mlUrl('/receipts/filter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedItems }),
      }),
      env.ML_TIMEOUT_MS * 2
    );
    if (!res.ok) throw new Error(`ML /receipts/filter returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[ml] /receipts/filter failed:', err.message);
    return null;
  }
}
