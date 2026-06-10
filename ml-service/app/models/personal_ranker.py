from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.linear_model import LogisticRegression

log = logging.getLogger(__name__)


FEATURE_NAMES = [
    "cosine",            # raw text similarity from matcher
    "coverage",          # how many of recipe's ingredients you have
    "urgent_used",       # how many soon-to-expire items the recipe uses
    "days_to_expiry",    # urgency of the target ingredient
    "user_total_acts",   # how active the user is overall
    "user_seen_recipe",  # max weight this user gave this recipe before
    "recipe_popularity", # global popularity score of the recipe
]
MIN_TRAIN_SAMPLES = 10  # below this we fall back to matcher score


@dataclass
class RankInput:
    cosine: float
    coverage: float
    urgent_used: int
    days_to_expiry: int
    user_total_acts: int
    user_seen_recipe: float
    recipe_popularity: float

    def to_vector(self) -> list[float]:
        return [
            self.cosine,
            self.coverage,
            float(self.urgent_used),
            float(self.days_to_expiry),
            float(self.user_total_acts),
            self.user_seen_recipe,
            self.recipe_popularity,
        ]


class PersonalRanker:
    MODEL_VERSION = "personal-ranker-1.0"

    def __init__(self) -> None:
        self._model: LogisticRegression | None = None
        self._fitted: bool = False
        self._samples_seen: int = 0
        self._lock = threading.RLock()

    @property
    def fitted(self) -> bool:
        return self._fitted

    @property
    def samples_seen(self) -> int:
        return self._samples_seen

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        sample_weight: np.ndarray | None = None,
    ) -> dict[str, Any]:
        """y: 1 = positive (cook/like), 0 = negative (dismiss).

        sample_weight: stronger actions (cook, dismiss) count more than weak ones.
        Passive 'view' events should be excluded upstream, not passed here.
        """
        with self._lock:
            if X.shape[0] < MIN_TRAIN_SAMPLES:
                log.info(
                    "PersonalRanker.fit skipped: only %d samples (<%d)",
                    X.shape[0],
                    MIN_TRAIN_SAMPLES,
                )
                self._samples_seen = int(X.shape[0])
                return {"status": "too_few_samples", "samples": int(X.shape[0])}

            # need at least one of each class
            if len(np.unique(y)) < 2:
                log.info("PersonalRanker.fit skipped: only one class in labels")
                self._samples_seen = int(X.shape[0])
                return {"status": "single_class", "samples": int(X.shape[0])}

            model = LogisticRegression(
                max_iter=500,
                class_weight="balanced",
                solver="lbfgs",
            )
            if sample_weight is not None and len(sample_weight) == len(y):
                model.fit(X, y, sample_weight=sample_weight)
            else:
                model.fit(X, y)
            self._model = model
            self._fitted = True
            self._samples_seen = int(X.shape[0])
            coeffs = dict(zip(FEATURE_NAMES, [float(c) for c in model.coef_[0]]))
            log.info(
                "PersonalRanker fitted on %d samples; coeffs=%s",
                X.shape[0],
                coeffs,
            )
            return {
                "status": "ok",
                "samples": int(X.shape[0]),
                "coefficients": coeffs,
                "intercept": float(model.intercept_[0]),
            }

    def score(self, inputs: list[RankInput]) -> list[float]:
        """Return P(positive) for each candidate, or matcher-style fallback."""
        if not inputs:
            return []
        if not self._fitted or self._model is None:
            # graceful fallback: combine cosine and coverage like the matcher
            return [0.7 * x.cosine + 0.3 * x.coverage for x in inputs]
        X = np.array([x.to_vector() for x in inputs], dtype=np.float32)
        # predict_proba returns columns in sorted class order — we want P(class=1)
        return [float(p) for p in self._model.predict_proba(X)[:, 1]]


ranker = PersonalRanker()
