// Spoonacular external recipe API client.
//
// Strategy:
//   1. Call `findByIngredients` with the user's pantry → list of recipes ranked
//      by minimum missing ingredients.
//   2. Upsert each result into MongoDB (composite key: source + externalId) so
//      that subsequent calls like /recipes/:id/use and /recipes/:id (detail)
//      work with stable IDs.
//   3. Lazy-fetch /information when full instructions are requested.
//
// Caching: in-memory Map keyed by sorted pantry names + limit, TTL 1 hour.
// This keeps us well under the 150-requests/day free-tier quota.

import { env } from '../config/env.js';
import Recipe from '../models/Recipe.js';

const BASE = 'https://api.spoonacular.com';
const CACHE = new Map(); // key → { data, expiresAt }
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function isSpoonacularConfigured() {
  return !!env.SPOONACULAR_API_KEY;
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function cacheKey(pantryItems, limit) {
  const names = [...new Set(pantryItems.map((i) => normalize(i.name)))].sort();
  return `byIng::${limit}::${names.join('|')}`;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
  ]);
}

function formatAmount(amount, unit) {
  if (amount === undefined || amount === null) return '';
  const a = Number(amount);
  const rounded = Number.isFinite(a) ? Math.round(a * 100) / 100 : amount;
  return `${rounded} ${unit || ''}`.trim();
}

export async function findRecipesByIngredients(pantryItems, opts = {}) {
  if (!isSpoonacularConfigured()) return null;
  const limit = Math.min(opts.limit || 12, 25);

  const ingredients = [...new Set(pantryItems.map((i) => normalize(i.name)))].filter(Boolean);
  if (ingredients.length === 0) return null;

  const key = cacheKey(pantryItems, limit);
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const url = new URL(`${BASE}/recipes/findByIngredients`);
  url.searchParams.set('apiKey', env.SPOONACULAR_API_KEY);
  url.searchParams.set('ingredients', ingredients.join(','));
  url.searchParams.set('number', String(limit));
  url.searchParams.set('ranking', '2'); // minimize missing ingredients
  url.searchParams.set('ignorePantry', 'true');

  let res;
  try {
    res = await withTimeout(fetch(url.toString()), env.SPOONACULAR_TIMEOUT_MS, 'spoonacular');
  } catch (err) {
    console.warn('[spoonacular] error:', err.message);
    return null;
  }
  if (!res.ok) {
    console.warn('[spoonacular] HTTP', res.status, await res.text().catch(() => ''));
    return null;
  }
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return null;

  const recipes = [];
  for (const it of items) {
    const used = it.usedIngredients || [];
    const missed = it.missedIngredients || [];
    const total = used.length + missed.length;
    const matchPercentage = total > 0 ? Math.round((used.length / total) * 100) : 0;

    const ingredientsRaw = [
      ...used.map((i) => ({ ...i, _inPantry: true })),
      ...missed.map((i) => ({ ...i, _inPantry: false })),
    ];

    const ingredientsForDB = ingredientsRaw.map((i) => ({
      name: i.name,
      amount: formatAmount(i.amount, i.unit),
      normalizedName: normalize(i.name),
    }));

    let doc;
    try {
      doc = await Recipe.findOneAndUpdate(
        { source: 'spoonacular', externalId: String(it.id) },
        {
          name: it.title,
          image: it.image,
          ingredients: ingredientsForDB,
          source: 'spoonacular',
          externalId: String(it.id),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      console.warn('[spoonacular] upsert failed:', err.message);
      continue;
    }

    recipes.push({
      id: doc._id.toString(),
      name: doc.name,
      matchPercentage,
      cookingTime: doc.cookingTime,
      servings: doc.servings,
      ingredients: ingredientsRaw.map((i) => ({
        name: i.name,
        amount: formatAmount(i.amount, i.unit),
        inPantry: i._inPantry,
      })),
      instructions: doc.instructions || [],
      image: doc.image,
    });
  }

  CACHE.set(key, { data: recipes, expiresAt: Date.now() + TTL_MS });
  return recipes;
}

// Negative cache: externalIds Spoonacular has no instructions for.
// Prevents burning the daily quota by re-fetching /information on every
// detail open for recipes that simply have no steps upstream.
const NO_INSTRUCTIONS_CACHE = new Map(); // externalId → expiresAt
const NO_INSTRUCTIONS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Extract step list from a Spoonacular /information response.
// 1. Prefer analyzedInstructions (all sections flattened, not just the first).
// 2. Fall back to the raw `instructions` field (often HTML) — strip tags and
//    split into readable steps.
function extractInstructionSteps(data) {
  const analyzed = (data.analyzedInstructions || [])
    .flatMap((section) => (section.steps || []).map((s) => String(s.step || '').trim()))
    .filter(Boolean);
  if (analyzed.length > 0) return analyzed;

  if (!data.instructions) return [];
  const text = String(data.instructions)
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(li|p|ol|ul|div)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');
  const lines = text
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  // Single blob of text → split into sentences so the UI can number them.
  return (lines[0] || '')
    .split(/(?<=\.)\s+(?=[A-ZА-ЯЁ])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Lazy-load instructions + cookingTime + servings for a Spoonacular recipe.
// Called from GET /api/recipes/:id when the recipe lacks instructions.
export async function hydrateRecipeDetails(recipe) {
  if (!isSpoonacularConfigured()) return recipe;
  if (recipe.source !== 'spoonacular' || !recipe.externalId) return recipe;
  if (recipe.instructions && recipe.instructions.length > 0) return recipe;

  const noInstrUntil = NO_INSTRUCTIONS_CACHE.get(recipe.externalId);
  if (noInstrUntil && noInstrUntil > Date.now()) return recipe;

  const url = new URL(`${BASE}/recipes/${recipe.externalId}/information`);
  url.searchParams.set('apiKey', env.SPOONACULAR_API_KEY);
  url.searchParams.set('includeNutrition', 'false');

  let res;
  try {
    res = await withTimeout(fetch(url.toString()), env.SPOONACULAR_TIMEOUT_MS, 'spoonacular-info');
  } catch (err) {
    console.warn('[spoonacular] details error:', err.message);
    return recipe;
  }
  if (!res.ok) return recipe;
  const data = await res.json();

  const steps = extractInstructionSteps(data);

  recipe.cookingTime = data.readyInMinutes || recipe.cookingTime;
  recipe.servings = data.servings || recipe.servings;
  if (steps.length > 0) {
    recipe.instructions = steps;
  } else {
    NO_INSTRUCTIONS_CACHE.set(recipe.externalId, Date.now() + NO_INSTRUCTIONS_TTL_MS);
  }
  try {
    await recipe.save();
  } catch {
    /* ignore */
  }
  return recipe;
}
