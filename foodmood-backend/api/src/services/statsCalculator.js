// Heuristics for translating an item's disposition into stats deltas.
// These constants are reasonable averages used widely in sustainability reporting.

// Mean food weight per item assumed (kg) when explicit weight is not available.
const DEFAULT_WEIGHT_KG = 0.5;

// Approx kg CO2e per kg of food avoided (mixed-basket average from FAO/WRI reporting).
const CO2_PER_KG_FOOD = 2.5;

function estimateWeightKg(item) {
  if (item.unit === 'kg') return item.quantity;
  if (item.unit === 'g') return item.quantity / 1000;
  if (item.unit === 'L') return item.quantity; // assume density ~1
  if (item.unit === 'ml') return item.quantity / 1000;
  return DEFAULT_WEIGHT_KG; // pcs / pack
}

export function computeStatsDelta(item, action) {
  const weight = estimateWeightKg(item);
  switch (action) {
    case 'consumed':
      return {
        foodSavedKg: weight,
        co2Offset: weight * CO2_PER_KG_FOOD,
        moneySaved: item.price || 0,
        wasteWarriorLevel: 0,
      };
    case 'shared':
      return {
        foodSavedKg: weight,
        co2Offset: weight * CO2_PER_KG_FOOD,
        moneySaved: 0, // no personal money saved when given away
        wasteWarriorLevel: 0,
      };
    case 'discarded':
      return { foodSavedKg: 0, co2Offset: 0, moneySaved: 0, wasteWarriorLevel: 0 };
    default:
      return { foodSavedKg: 0, co2Offset: 0, moneySaved: 0, wasteWarriorLevel: 0 };
  }
}

// Recompute the user's wasteWarriorLevel based on cumulative foodSavedKg.
// Level thresholds (kg saved): 0, 5, 20, 50, 100, 200, 500.
const LEVEL_THRESHOLDS = [0, 5, 20, 50, 100, 200, 500];
export function computeLevel(foodSavedKg) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (foodSavedKg >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function applyDelta(user, delta) {
  user.stats.foodSavedKg = +(user.stats.foodSavedKg + delta.foodSavedKg).toFixed(2);
  user.stats.co2Offset = +(user.stats.co2Offset + delta.co2Offset).toFixed(2);
  user.stats.moneySaved = +(user.stats.moneySaved + delta.moneySaved).toFixed(2);
  user.stats.wasteWarriorLevel = computeLevel(user.stats.foodSavedKg);
}
