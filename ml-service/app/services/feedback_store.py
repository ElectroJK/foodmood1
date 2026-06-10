from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Literal

from ..config import settings
from ..db import get_db

log = logging.getLogger(__name__)

FeedbackAction = Literal["view", "cook", "dismiss", "like"]

# weight per action — used by the ranker as the supervised label
ACTION_WEIGHT: dict[str, float] = {
    "dismiss": 1.0,
    "view": 0.15,
    "like": 0.9,
    "cook": 1.0,
}


def feedback_collection_name() -> str:
    # added to settings, but kept as a fallback so old configs don't break
    return getattr(settings, "feedback_collection", "recipe_feedback")


async def log_feedback(
    user_id: str,
    recipe_id: str,
    action: FeedbackAction,
    *,
    canonical_target: str | None = None,
    score_shown: float | None = None,
    days_to_expiry: int | None = None,
) -> dict[str, Any]:
    db = get_db()
    doc = {
        "user_id": str(user_id),
        "recipe_id": str(recipe_id),
        "action": action,
        "weight": ACTION_WEIGHT.get(action, 0.0),
        "canonical_target": canonical_target,
        "score_shown": score_shown,
        "days_to_expiry": days_to_expiry,
        "createdAt": datetime.now(timezone.utc),
    }
    await db[feedback_collection_name()].insert_one(doc)
    log.info("feedback logged: user=%s recipe=%s action=%s", user_id, recipe_id, action)
    return doc


async def load_all_feedback() -> list[dict[str, Any]]:
    db = get_db()
    cursor = db[feedback_collection_name()].find({})
    return await cursor.to_list(length=None)


async def user_action_counts(user_id: str) -> dict[str, int]:
    """For online features: how active is this user, what do they tend to do."""
    db = get_db()
    cursor = db[feedback_collection_name()].aggregate(
        [
            {"$match": {"user_id": str(user_id)}},
            {"$group": {"_id": "$action", "n": {"$sum": 1}}},
        ]
    )
    out: dict[str, int] = {"view": 0, "cook": 0, "dismiss": 0, "like": 0, "total": 0}
    async for row in cursor:
        action = row["_id"]
        n = int(row["n"])
        if action in out:
            out[action] = n
        out["total"] += n
    return out


async def recipe_popularity() -> dict[str, float]:
    """Global recipe popularity: sum(weight) / count of interactions."""
    db = get_db()
    cursor = db[feedback_collection_name()].aggregate(
        [
            {
                "$group": {
                    "_id": "$recipe_id",
                    "sum_w": {"$sum": "$weight"},
                    "n": {"$sum": 1},
                }
            }
        ]
    )
    out: dict[str, float] = {}
    async for row in cursor:
        n = max(int(row["n"]), 1)
        out[str(row["_id"])] = float(row["sum_w"]) / n
    return out


async def user_recipe_preferences(user_id: str) -> dict[str, str]:
    """Latest explicit taste per recipe: 'liked' | 'disliked' from feedback history."""
    db = get_db()
    cursor = (
        db[feedback_collection_name()]
        .find({"user_id": str(user_id)})
        .sort("createdAt", 1)
    )
    out: dict[str, str] = {}
    async for doc in cursor:
        recipe_id = str(doc.get("recipe_id", ""))
        action = str(doc.get("action", ""))
        if not recipe_id:
            continue
        if action in ("like", "cook"):
            out[recipe_id] = "liked"
        elif action == "dismiss":
            out[recipe_id] = "disliked"
    return out


async def user_recipe_interactions(user_id: str) -> dict[str, float]:
    """Returns {recipe_id: max_weight_seen} for a user — used as a feature."""
    db = get_db()
    cursor = db[feedback_collection_name()].find({"user_id": str(user_id)})
    out: dict[str, float] = {}
    async for doc in cursor:
        rid = str(doc.get("recipe_id"))
        w = float(doc.get("weight", 0.0))
        if w > out.get(rid, -1.0):
            out[rid] = w
    return out


async def user_recipe_affinity(user_id: str) -> dict[str, float]:
    """Latest signed user affinity per recipe.

    dismiss = negative, view = weak positive, like/cook = strong positive.
    """
    db = get_db()
    cursor = (
        db[feedback_collection_name()]
        .find({"user_id": str(user_id)})
        .sort("createdAt", 1)
    )
    out: dict[str, float] = {}
    async for doc in cursor:
        rid = str(doc.get("recipe_id", ""))
        if not rid:
            continue
        action = str(doc.get("action", ""))
        if action == "dismiss":
            out[rid] = -1.0
        elif action == "view":
            out[rid] = max(out.get(rid, 0.0), 0.15)
        elif action == "like":
            out[rid] = 0.9
        elif action == "cook":
            out[rid] = 1.0
    return out
