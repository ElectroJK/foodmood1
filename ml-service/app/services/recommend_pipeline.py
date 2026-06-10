"""HTTP /recommend pipeline: TF-IDF matcher + optional personal ranker + response metadata."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import Request

from ..models.pantry_vectorizer import vectorizer
from ..models.personal_ranker import ranker
from ..models.recipe_matcher import RecipeMatcher
from ..schemas import RecommendMeta, RecommendRequest, RecommendResponse, RecipeOut
from .ranker_rerank import personal_rerank_match_results
from .reccomendation import (
    build_recipe_out,
    canonicalize_pantry,
    days_feature_for_ranker,
)


def _combined_model_version(matcher: RecipeMatcher) -> str:
    return (
        f"{vectorizer.MODEL_VERSION}+"
        f"{matcher.MODEL_VERSION}+"
        f"{ranker.MODEL_VERSION}"
    )


async def recommend_for_http(request: Request, payload: RecommendRequest) -> RecommendResponse:
    matcher: RecipeMatcher = request.app.state.matcher
    training_status: dict[str, Any] = getattr(request.app.state, "training_status", {}) or {}
    training_last = str(training_status.get("status", "unknown"))

    rid = str(uuid.uuid4())
    canonical_items, urgent_items, days_map = canonicalize_pantry(list(payload.pantry))

    if not canonical_items:
        return RecommendResponse(
            recipes=[],
            modelVersion=_combined_model_version(matcher),
            meta=RecommendMeta(
                recommendationId=rid,
                pantryCanonicalCount=0,
                urgentCanonicalCount=0,
                candidatePoolSize=0,
                rankerFitted=ranker.fitted,
                personalizationApplied=False,
                trainingLastStatus=training_last,
                vectorizerVersion=vectorizer.MODEL_VERSION,
                matcherVersion=matcher.MODEL_VERSION,
                rankerVersion=ranker.MODEL_VERSION,
            ),
        )

    pool = max(payload.limit * 5, payload.limit) if payload.userId else payload.limit
    raw = matcher.match(canonical_items, urgent_items, top_k=pool)
    days_feat = days_feature_for_ranker(urgent_items, days_map)

    personalization_applied = bool(payload.userId and raw)
    if payload.userId and raw:
        ordered, scores, _diag = await personal_rerank_match_results(
            payload.userId,
            raw,
            days_to_expiry_feature=days_feat,
            take=payload.limit,
        )
    else:
        ordered = raw[: payload.limit]
        scores = None

    pantry_set = set(canonical_items)
    recipes: list[RecipeOut] = []
    for i, m in enumerate(ordered):
        pr = scores[i] if scores is not None and i < len(scores) else None
        recipes.append(build_recipe_out(m, pantry_set, personal_rank=pr))

    return RecommendResponse(
        recipes=recipes,
        modelVersion=_combined_model_version(matcher),
        meta=RecommendMeta(
            recommendationId=rid,
            pantryCanonicalCount=len(canonical_items),
            urgentCanonicalCount=len(urgent_items),
            candidatePoolSize=len(raw),
            rankerFitted=ranker.fitted,
            personalizationApplied=personalization_applied,
            trainingLastStatus=training_last,
            vectorizerVersion=vectorizer.MODEL_VERSION,
            matcherVersion=matcher.MODEL_VERSION,
            rankerVersion=ranker.MODEL_VERSION,
        ),
    )
