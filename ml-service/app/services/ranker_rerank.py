"""Shared personal-ranker re-ordering for /recommend and notifications."""
from __future__ import annotations

from typing import Any

from ..models.personal_ranker import RankInput, ranker
from ..models.recipe_matcher import MatchResult
from .feedback_store import (
    recipe_popularity,
    user_action_counts,
    user_recipe_affinity,
    user_recipe_preferences,
)


async def personal_rerank_match_results(
    user_id: str | None,
    candidates: list[MatchResult],
    *,
    days_to_expiry_feature: int,
    take: int,
) -> tuple[list[MatchResult], list[float] | None, dict[str, Any]]:
    """Re-order matcher candidates using the personal ranker (or its cold-start heuristic).

    Returns (top_slice, rank_scores_aligned, diagnostics).
    """
    if not candidates:
        return [], None, {"reranked": False, "ranker_fitted": ranker.fitted}

    if not user_id:
        top = candidates[:take]
        return top, None, {"reranked": False, "ranker_fitted": ranker.fitted}

    popularity = await recipe_popularity()
    counts = await user_action_counts(user_id)
    history = await user_recipe_affinity(user_id)
    preferences = await user_recipe_preferences(user_id)

    inputs: list[RankInput] = []
    recipe_ids: list[str] = []
    for c in candidates:
        recipe_id = str(c.recipe.get("_id"))
        recipe_ids.append(recipe_id)
        inputs.append(
            RankInput(
                cosine=c.cosine,
                coverage=c.coverage,
                urgent_used=len(c.urgent_used),
                days_to_expiry=days_to_expiry_feature,
                user_total_acts=int(counts.get("total", 0)),
                user_seen_recipe=float(history.get(recipe_id, 0.0)),
                recipe_popularity=float(popularity.get(recipe_id, 0.0)),
            )
        )

    scores = ranker.score(inputs)
    adjusted_scores: list[float] = []
    for recipe_id, score in zip(recipe_ids, scores):
        pref = preferences.get(recipe_id)
        if pref == "disliked":
            adjusted_scores.append(min(float(score) * 0.05, 0.01))
        elif pref == "liked":
            adjusted_scores.append(min(float(score) + 0.15, 1.0))
        else:
            adjusted_scores.append(float(score))

    paired = sorted(zip(adjusted_scores, candidates), key=lambda p: -p[0])
    non_disliked = [
        (s, c)
        for s, c in paired
        if preferences.get(str(c.recipe.get("_id"))) != "disliked"
    ]
    if len(non_disliked) >= take:
        paired = non_disliked
    top = [c for _, c in paired[:take]]
    top_scores = [float(s) for s, _ in paired[:take]]

    return top, top_scores, {
        "reranked": True,
        "ranker_fitted": ranker.fitted,
        "disliked_demoted": len(candidates) - len(non_disliked),
    }
