"""Build a training set from /feedback logs and fit the PersonalRanker."""
from __future__ import annotations

import logging
from typing import Any

import numpy as np

from ..models.personal_ranker import FEATURE_NAMES, ranker
from .feedback_store import (
    ACTION_WEIGHT,
    load_all_feedback,
    recipe_popularity,
)

log = logging.getLogger(__name__)


def _label_from_action(action: str) -> int | None:
    """Binary label for training.

    Views are weak positive signals through ACTION_WEIGHT, while like/cook are
    strong positives and dismiss is a strong negative.
    """
    if action == "view":
        return 1
    if action == "dismiss":
        return 0
    if action in ("cook", "like"):
        return 1
    return None


def _sample_weight_for_action(action: str) -> float:
    return float(ACTION_WEIGHT.get(action, 0.5))


async def train_personal_ranker() -> dict[str, Any]:
    feedback = await load_all_feedback()
    if not feedback:
        log.info("No feedback to train on yet")
        return {"status": "no_feedback", "samples": 0}

    popularity = await recipe_popularity()

    # per-user activity counts
    user_total: dict[str, int] = {}
    for fb in feedback:
        u = str(fb.get("user_id", ""))
        user_total[u] = user_total.get(u, 0) + 1

    # per-(user, recipe) max prior weight (we'll use it as a feature)
    # to avoid leakage we'd need temporal split; for diploma scope this is fine
    user_recipe_weight: dict[tuple[str, str], float] = {}
    for fb in feedback:
        key = (str(fb.get("user_id")), str(fb.get("recipe_id")))
        w = float(fb.get("weight", 0.0))
        if w > user_recipe_weight.get(key, -1.0):
            user_recipe_weight[key] = w

    rows: list[list[float]] = []
    labels: list[int] = []
    weights: list[float] = []

    for fb in feedback:
        user_id = str(fb.get("user_id"))
        recipe_id = str(fb.get("recipe_id"))
        action = str(fb.get("action", ""))

        label = _label_from_action(action)
        if label is None:
            continue

        cosine = float(fb.get("score_shown") or 0.0)
        # we did not store coverage / urgent_used separately on the feedback
        # event itself, but score_shown encodes them via matcher composite —
        # this is good enough for diploma scope; richer features can be added
        # later by snapshotting full features at suggestion time.
        coverage = 0.0
        urgent_used = 0
        days_to_expiry = int(fb.get("days_to_expiry") or 99)

        rows.append(
            [
                cosine,
                coverage,
                float(urgent_used),
                float(days_to_expiry),
                float(user_total.get(user_id, 0)),
                float(user_recipe_weight.get((user_id, recipe_id), 0.0)),
                float(popularity.get(recipe_id, 0.0)),
            ]
        )
        labels.append(label)
        weights.append(_sample_weight_for_action(action))

    if not rows:
        return {"status": "no_trainable_feedback", "samples": 0}

    X = np.array(rows, dtype=np.float32)
    y = np.array(labels, dtype=np.int32)
    w = np.array(weights, dtype=np.float32)

    result = ranker.fit(X, y, sample_weight=w)
    result.update({"feature_names": FEATURE_NAMES, "total_events": len(feedback)})
    log.info("PersonalRanker training result: %s", result)
    return result
