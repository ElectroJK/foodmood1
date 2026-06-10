"""turns a pantry snapshot into the RecipeOut[] contract the Node.js backend expects"""
from __future__ import annotations
from typing import List, Dict, Any
from datetime import datetime, timezone

from ..schemas import PantryItem, RecipeOut, RecipeIngredientOut
from ..preprocessing.normalizer import canonical_ingredient
from ..preprocessing.ingredient_map import default_shelf_life
from ..config import settings
from ..models.recipe_matcher import RecipeMatcher, MatchResult


def _days_to_expiry(item: PantryItem) -> int:
    if item.expiryDate:
        exp = item.expiryDate if item.expiryDate.tzinfo else item.expiryDate.replace(tzinfo=timezone.utc)
        return max(0, (exp - datetime.now(timezone.utc)).days)
    canon = canonical_ingredient(item.name)
    return default_shelf_life(canon, item.category)


def canonicalize_pantry(pantry: List[PantryItem]) -> tuple[list[str], list[str], dict[str, int]]:
    """returns (canonical_items, urgent_canonical_items, days_left_by_canonical)"""
    canon_list: list[str] = []
    seen: set[str] = set()
    urgent: list[str] = []
    days_left: dict[str, int] = {}

    for item in pantry:
        c = canonical_ingredient(item.name)
        if not c or c in seen:
            continue
        seen.add(c)
        canon_list.append(c)
        d = _days_to_expiry(item)
        days_left[c] = d
        if d <= settings.urgent_window_days:
            urgent.append(c)

    return canon_list, urgent, days_left


def days_feature_for_ranker(urgent_items: list[str], days_left_by_canonical: dict[str, int]) -> int:
    """Single urgency scalar fed into the personal ranker (mirrors notification flow)."""
    if urgent_items:
        return min(days_left_by_canonical.get(u, 99) for u in urgent_items)
    if days_left_by_canonical:
        return min(int(v) for v in days_left_by_canonical.values())
    return 14


def _format_amount(ing: Dict[str, Any]) -> str:
    amount = ing.get("amount")
    if amount is None:
        return ""
    return str(amount)


def build_recipe_out(
    m: MatchResult,
    pantry_canonical: set[str],
    *,
    personal_rank: float | None = None,
) -> RecipeOut:
    raw_ings = m.recipe.get("ingredients") or []
    ingredients_out: list[RecipeIngredientOut] = []
    for ing in raw_ings:
        raw_name = ing.get("normalizedName") or ing.get("name") or ""
        c = canonical_ingredient(raw_name)
        ingredients_out.append(RecipeIngredientOut(
            name=ing.get("name") or raw_name,
            amount=_format_amount(ing),
            inPantry=bool(c and c in pantry_canonical),
        ))

    match_pct = round(m.coverage * 100)

    # Generate ML Insight
    ml_insight = None
    if m.urgent_used:
        item_names = ", ".join(m.urgent_used[:2])
        if len(m.urgent_used) > 2:
            item_names += f" and {len(m.urgent_used) - 2} more"
        ml_insight = f"🚨 Saves expiring items: {item_names}"
    elif personal_rank is not None and personal_rank > 0.8:
        ml_insight = "✨ Highly recommended for your taste"
    elif match_pct >= 80:
        ml_insight = f"🎯 Excellent pantry match ({match_pct}%)"

    return RecipeOut(
        id=str(m.recipe.get("_id")),
        name=m.recipe.get("name") or "",
        matchPercentage=match_pct,
        cookingTime=m.recipe.get("cookingTime"),
        servings=m.recipe.get("servings"),
        ingredients=ingredients_out,
        instructions=m.recipe.get("instructions") or [],
        image=m.recipe.get("image"),
        urgentIngredientsUsed=m.urgent_used,
        score=round(m.score, 4),
        personalRank=round(personal_rank * 100, 1) if personal_rank is not None else None,
        mlInsight=ml_insight,
    )


def recommend(matcher: RecipeMatcher, pantry: List[PantryItem], limit: int) -> List[RecipeOut]:
    canonical_items, urgent_items, _ = canonicalize_pantry(pantry)
    if not canonical_items:
        return []
    results = matcher.match(canonical_items, urgent_items, top_k=limit)
    pantry_set = set(canonical_items)
    return [build_recipe_out(r, pantry_set) for r in results]
