"""Smoke + behavior tests for the personalized ranker.

Run with:
    cd ml-service && pytest tests/test_personal_ranker.py -v
"""
from __future__ import annotations

import numpy as np

from app.models.personal_ranker import (
    FEATURE_NAMES,
    MIN_TRAIN_SAMPLES,
    PersonalRanker,
    RankInput,
)


def _make_input(cosine: float = 0.5, coverage: float = 0.5,
                urgent_used: int = 0, days_to_expiry: int = 3,
                user_total_acts: int = 0, user_seen_recipe: float = 0.0,
                recipe_popularity: float = 0.0) -> RankInput:
    return RankInput(
        cosine=cosine,
        coverage=coverage,
        urgent_used=urgent_used,
        days_to_expiry=days_to_expiry,
        user_total_acts=user_total_acts,
        user_seen_recipe=user_seen_recipe,
        recipe_popularity=recipe_popularity,
    )


def test_cold_start_falls_back_to_matcher_score():
    r = PersonalRanker()
    assert not r.fitted
    scores = r.score([_make_input(cosine=0.9, coverage=0.1),
                      _make_input(cosine=0.1, coverage=0.9)])
    # Fallback formula = 0.7*cosine + 0.3*coverage, so first wins
    assert scores[0] > scores[1]


def test_fit_skipped_with_too_few_samples():
    r = PersonalRanker()
    X = np.random.rand(MIN_TRAIN_SAMPLES - 1, len(FEATURE_NAMES)).astype(np.float32)
    y = np.array([0, 1] * ((MIN_TRAIN_SAMPLES - 1) // 2) + [0], dtype=np.int32)[:X.shape[0]]
    result = r.fit(X, y)
    assert result["status"] == "too_few_samples"
    assert not r.fitted


def test_fit_learns_user_preference():
    """Synthetic: users like recipes with high popularity. Ranker must learn that."""
    rng = np.random.default_rng(42)
    n = 80
    popularity = rng.uniform(0, 1, size=n)
    # Other features are noise
    X = np.column_stack([
        rng.uniform(0, 1, size=n),    # cosine (noise)
        rng.uniform(0, 1, size=n),    # coverage (noise)
        rng.integers(0, 3, size=n),   # urgent_used (noise)
        rng.integers(0, 7, size=n),   # days_to_expiry (noise)
        rng.integers(0, 50, size=n),  # user_total_acts (noise)
        rng.uniform(0, 1, size=n),    # user_seen_recipe (noise)
        popularity,                   # recipe_popularity -- the signal
    ]).astype(np.float32)
    # Label: 1 if popularity > 0.5 else 0 (with a bit of noise)
    y = (popularity + rng.normal(0, 0.1, size=n) > 0.5).astype(np.int32)

    r = PersonalRanker()
    result = r.fit(X, y)
    assert result["status"] == "ok"
    assert r.fitted

    # popularity coefficient should be the largest in absolute value
    coeffs = result["coefficients"]
    pop_coef = abs(coeffs["recipe_popularity"])
    other_coefs = [abs(v) for k, v in coeffs.items() if k != "recipe_popularity"]
    assert pop_coef > max(other_coefs), f"popularity should dominate, got {coeffs}"


def test_fit_handles_single_class():
    r = PersonalRanker()
    X = np.random.rand(20, len(FEATURE_NAMES)).astype(np.float32)
    y = np.ones(20, dtype=np.int32)
    result = r.fit(X, y)
    assert result["status"] == "single_class"
    assert not r.fitted
