from __future__ import annotations

from typing import Any

from ..config import settings
from ..db import get_db
from ..models.pantry_vectorizer import vectorizer
from ..models.recipe_matcher import RecipeMatcher
from ..preprocessing.normalizer import canonical_ingredient, days_to_expiry
from ..schemas import PantryItem, RecipeSuggestionNotification
from .feedback_store import recipe_popularity, user_action_counts, user_recipe_interactions
from .ranker_rerank import personal_rerank_match_results
from .reccomendation import build_recipe_out, canonicalize_pantry

try:
    from bson.objectid import ObjectId
except Exception:  # pragma: no cover - fallback for incomplete local runtimes
    ObjectId = None


def _humanize_canonical(name: str) -> str:
    return name.replace("_", " ").title()


def _notification_body(label: str, days_left: int, recipe_count: int) -> str:
    if days_left <= 0:
        freshness = f"{label} is already at risk of going to waste."
    elif days_left == 1:
        freshness = f"{label} expires in 1 day."
    else:
        freshness = f"{label} expires in {days_left} days."
    return f"{freshness} We found {recipe_count} recipe{'s' if recipe_count != 1 else ''} that can use it."


def _user_candidates(user_id: str) -> list[Any]:
    candidates: list[Any] = [user_id]
    if ObjectId is not None:
        try:
            candidates.insert(0, ObjectId(user_id))
        except Exception:
            pass
    return candidates


async def load_active_pantry(user_id: str) -> list[PantryItem]:
    db = get_db()
    cursor = db[settings.fooditems_collection].find(
        {
            "user": {"$in": _user_candidates(user_id)},
            "status": "active",
        }
    )
    docs = await cursor.to_list(length=None)
    return [
        PantryItem.model_validate(
            {
                "name": doc.get("name"),
                "quantity": doc.get("quantity"),
                "unit": doc.get("unit"),
                "expiryDate": doc.get("expiryDate"),
                "category": doc.get("category"),
                "price": doc.get("price"),
            }
        )
        for doc in docs
    ]


def _urgent_targets(pantry: list[PantryItem], items_limit: int) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}

    for item in pantry:
        canonical = canonical_ingredient(item.name)
        if not canonical:
            continue

        days_left = days_to_expiry(item.model_dump(mode="python"))
        if days_left > settings.urgent_window_days:
            continue

        existing = grouped.get(canonical)
        label = _humanize_canonical(canonical)
        if existing is None:
            grouped[canonical] = {
                "canonical": canonical,
                "label": label,
                "days_left": days_left,
            }
            continue

        if days_left < existing["days_left"]:
            existing["days_left"] = days_left

    ordered = sorted(grouped.values(), key=lambda item: (item["days_left"], item["label"]))
    return ordered[:items_limit]


async def build_recipe_suggestion_notifications(
    matcher: RecipeMatcher,
    pantry: list[PantryItem],
    *,
    user_id: str | None = None,
    items_limit: int = 3,
    recipes_per_item: int = 3,
) -> list[RecipeSuggestionNotification]:
    targets = _urgent_targets(pantry, items_limit)
    if not targets:
        return []
    if not vectorizer.fitted or matcher.size == 0:
        raise RuntimeError("ML models not ready - POST /train first or seed recipes/fooditems.")

    canonical_items, _, _ = canonicalize_pantry(pantry)
    pantry_set = set(canonical_items)
    notifications: list[RecipeSuggestionNotification] = []

    for target in targets:
        target_canonical = target["canonical"]
        raw_results = matcher.match(
            canonical_items=canonical_items,
            urgent_items=[target_canonical],
            top_k=max(recipes_per_item * 5, recipes_per_item),
        )

        focused = [
            result
            for result in raw_results
            if target_canonical in result.matched or target_canonical in result.urgent_used
        ]

        # Wider candidate pool for the ranker to choose from
        candidate_pool = focused if focused else raw_results
        if len(candidate_pool) < recipes_per_item:
            seen_ids = {str(r.recipe.get("_id")) for r in candidate_pool}
            for result in raw_results:
                rid = str(result.recipe.get("_id"))
                if rid in seen_ids:
                    continue
                candidate_pool.append(result)
                seen_ids.add(rid)

        selected, _, _ = await personal_rerank_match_results(
            user_id,
            candidate_pool,
            days_to_expiry_feature=target["days_left"],
            take=recipes_per_item,
        )

        if not selected:
            continue

        label = target["label"]
        recipes = [build_recipe_out(result, pantry_set) for result in selected]
        notifications.append(
            RecipeSuggestionNotification(
                id=f"ml-recipe-{target_canonical}",
                title=f"Use your {label} soon",
                body=_notification_body(label, target["days_left"], len(recipes)),
                itemName=label,
                canonicalName=target_canonical,
                daysToExpiry=target["days_left"],
                recipes=recipes,
            )
        )

    return notifications