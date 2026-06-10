// Rule-based recipe recommender with expiry-aware urgency ranking.
// Used as a fallback when ML_SERVICE_URL is not configured or unreachable.
//
// Matching strategy (improved):
//   1. Exact normalized name match
//   2. Token-level match (any meaningful token shared between pantry and ingredient)
//   3. Substring fallback (one name contained in the other)
// This handles cases like pantry "Chicken Breast" vs recipe ingredient "Chicken",
// or pantry "Tomatoes" vs recipe "Cherry Tomato".

import Recipe from '../models/Recipe.js';

function normalize(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/s$/, '') // rough singularization
    .replace(/\s+/g, ' ')
    .trim();
}

// "stop" tokens that shouldn't drive matches on their own.
const STOPWORDS = new Set([
  'fresh', 'organic', 'large', 'small', 'whole', 'raw', 'cooked',
  'sliced', 'diced', 'chopped', 'red', 'green', 'yellow', 'white',
  'and', 'or', 'with', 'the',
]);

function meaningfulTokens(name) {
  return normalize(name)
    .split(' ')
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function isMatch(pantryName, ingredientName) {
  const p = normalize(pantryName);
  const i = normalize(ingredientName);
  if (!p || !i) return false;
  if (p === i) return true;
  if (p.includes(i) || i.includes(p)) return true;
  const pTokens = meaningfulTokens(pantryName);
  const iTokens = meaningfulTokens(ingredientName);
  for (const t of pTokens) {
    if (iTokens.includes(t)) return true;
  }
  return false;
}

function daysUntil(date) {
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function urgencyScore(daysLeft) {
  if (daysLeft <= 0) return 1.0;
  if (daysLeft >= 7) return 0;
  return 1 - daysLeft / 7;
}

export function rankRecipes(recipes, pantryItems, opts = {}) {
  const { limit = 12, dropZeroMatches = true } = opts;

  // Precompute urgency per pantry item.
  const pantry = pantryItems.map((it) => ({
    item: it,
    urgency: urgencyScore(daysUntil(it.expiryDate)),
  }));

  const scored = recipes.map((r) => {
    const total = r.ingredients.length;
    let have = 0;
    let urgencyBoost = 0;

    const annotatedIngredients = r.ingredients.map((ing) => {
      // Find the best pantry match (prefer most-urgent).
      let bestMatch = null;
      for (const p of pantry) {
        if (isMatch(p.item.name, ing.name)) {
          if (!bestMatch || p.urgency > bestMatch.urgency) bestMatch = p;
        }
      }
      const inPantry = !!bestMatch;
      if (inPantry) {
        have += 1;
        urgencyBoost += bestMatch.urgency;
      }
      return { name: ing.name, amount: ing.amount, inPantry };
    });

    const matchRatio = total > 0 ? have / total : 0;
    const quickWin = r.cookingTime <= 20 ? 0.05 : 0;
    const score = matchRatio + urgencyBoost / Math.max(total, 1) + quickWin;
    const matchPercentage = Math.round(matchRatio * 100);

    return {
      id: r._id?.toString?.() ?? r.id,
      name: r.name,
      matchPercentage,
      cookingTime: r.cookingTime,
      servings: r.servings,
      ingredients: annotatedIngredients,
      instructions: r.instructions,
      image: r.image,
      _score: score,
      _have: have,
    };
  });

  let ranked = scored.sort((a, b) => b._score - a._score);

  // If at least one recipe has a real match, drop 0% recipes so we don't pad
  // with unrelated options. When nothing matches (empty pantry), show top-N anyway.
  if (dropZeroMatches && ranked.some((r) => r._have > 0)) {
    ranked = ranked.filter((r) => r._have > 0);
  }

  return ranked.slice(0, limit).map(({ _score, _have, ...rest }) => rest);
}

export async function recommendForUser(pantryItems, opts) {
  const recipes = await Recipe.find({}).lean();
  return rankRecipes(recipes, pantryItems, opts);
}
