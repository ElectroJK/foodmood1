"""builds (X, y, feature_names) from finished FoodItem documents for eLCS rule mining"""
from __future__ import annotations
from typing import List, Dict, Any, Tuple
import numpy as np
from datetime import datetime, timezone

from ..preprocessing.normalizer import canonical_ingredient
from ..preprocessing.ingredient_map import default_shelf_life

CATEGORIES = ["Dairy", "Meat", "Veggies", "Fruits", "Bakery",
              "Grains", "Pantry", "Frozen", "Beverages", "Other"]

# bins for time_to_action: 0=fast (<=1d), 1=medium (<=3d), 2=slow (<=7d), 3=very_slow (>7d), 4=never
TIME_BUCKETS = [1, 3, 7]

# bins for days_until_expiry_at_action: -1=expired, 0=critical (<=1), 1=urgent (<=3), 2=ok (<=7), 3=plenty (>7)
EXPIRY_BUCKETS = [1, 3, 7]


def _bucket(value: float, edges: list[int]) -> int:
    for i, e in enumerate(edges):
        if value <= e:
            return i
    return len(edges)


def _to_dt(v: Any) -> datetime | None:
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
    if isinstance(v, str):
        try:
            d = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def build_outcome_samples(food_items: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """outcome label: 1 = wasted (discarded), 0 = saved (consumed or shared)"""
    feature_names = [
        "category_idx",
        "canonical_idx",
        "time_to_action_bucket",
        "expiry_at_action_bucket",
        "price_bucket",
        "qty_bucket",
    ]

    rows: list[list[int]] = []
    labels: list[int] = []
    canonical_index: dict[str, int] = {"__unknown__": 0}

    for item in food_items:
        status = item.get("status")
        if status not in ("consumed", "discarded", "shared"):
            continue

        added = _to_dt(item.get("addedDate") or item.get("createdAt"))
        action = _to_dt(item.get("consumedAt") or item.get("updatedAt"))
        expiry = _to_dt(item.get("expiryDate"))

        time_to_action = (action - added).days if added and action else 7
        expiry_at_action = (
            (expiry - action).days if expiry and action
            else default_shelf_life(canonical_ingredient(item.get("name", "")), item.get("category"))
        )

        category = item.get("category") or "Other"
        cat_idx = CATEGORIES.index(category) if category in CATEGORIES else len(CATEGORIES) - 1

        canon = canonical_ingredient(item.get("name", "")) or "__unknown__"
        if canon not in canonical_index:
            canonical_index[canon] = len(canonical_index)
        canon_idx = canonical_index[canon]

        price = float(item.get("price") or 0)
        qty = float(item.get("quantity") or 0)

        row = [
            cat_idx,
            canon_idx,
            _bucket(max(0, time_to_action), TIME_BUCKETS),
            _bucket(max(-1, expiry_at_action), EXPIRY_BUCKETS),
            _bucket(price, [500, 2000, 5000]),
            _bucket(qty, [1, 5, 20]),
        ]
        rows.append(row)
        labels.append(1 if status == "discarded" else 0)

    if not rows:
        return np.empty((0, len(feature_names)), dtype=int), np.empty((0,), dtype=int), feature_names

    return np.asarray(rows, dtype=int), np.asarray(labels, dtype=int), feature_names
