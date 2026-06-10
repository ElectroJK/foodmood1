import RecipePreference from '../models/RecipePreference.js';

/** Map frontend / API action names to ML service actions. */
export function toMlFeedbackAction(action) {
  const map = {
    view: 'view',
    cook: 'cook',
    cooked: 'cook',
    dismiss: 'dismiss',
    dismissed: 'dismiss',
    like: 'like',
    liked: 'like',
    unliked: 'dismiss',
    unlike: 'dismiss',
    clear: null,
  };
  return map[action] ?? null;
}

/** Whether this action updates stored liked / disliked state. */
export function preferenceFromAction(action) {
  const a = String(action || '').toLowerCase();
  if (['like', 'liked', 'cook', 'cooked'].includes(a)) return 'liked';
  if (['dismiss', 'dismissed', 'unliked', 'unlike'].includes(a)) return 'disliked';
  return null;
}

export async function setRecipePreference(userId, recipeId, preference) {
  if (!preference) {
    await RecipePreference.deleteOne({ user: userId, recipe: recipeId });
    return null;
  }
  const doc = await RecipePreference.findOneAndUpdate(
    { user: userId, recipe: recipeId },
    { preference },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

export async function clearRecipePreference(userId, recipeId) {
  await RecipePreference.deleteOne({ user: userId, recipe: recipeId });
}

export async function getPreferencesMap(userId) {
  const rows = await RecipePreference.find({ user: userId }).lean();
  const map = {};
  for (const row of rows) {
    map[row.recipe.toString()] = row.preference;
  }
  return map;
}

export function attachPreferencesToRecipes(recipes, preferencesMap) {
  return recipes.map((r) => {
    const id = r.id || r._id?.toString?.();
    const pref = id ? preferencesMap[id] : undefined;
    return pref ? { ...r, userPreference: pref } : r;
  });
}

export function filterDislikedRecipes(recipes, preferencesMap) {
  return recipes.filter((r) => {
    const id = r.id || r._id?.toString?.();
    return !id || preferencesMap[id] !== 'disliked';
  });
}
