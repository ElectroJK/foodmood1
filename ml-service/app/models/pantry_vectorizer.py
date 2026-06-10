"""TF-IDF vectorizer fitted on the corpus of all FoodItem documents (the diploma's "transparent, statistically grounded" engine)"""
from __future__ import annotations
import threading
import logging
from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

log = logging.getLogger(__name__)


class PantryVectorizer:
    MODEL_VERSION = "pantry-tfidf-1.0"

    def __init__(self, max_features: int = 3000, ngram_max: int = 2) -> None:
        self._vec = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, ngram_max),
            lowercase=False,
            token_pattern=r"[^\s,]+",
        )
        self._matrix = None
        self._user_ids: List[str] = []
        self._lock = threading.RLock()
        self._fitted = False

    @property
    def fitted(self) -> bool:
        return self._fitted

    @property
    def vocabulary(self) -> dict:
        return self._vec.vocabulary_ if self._fitted else {}

    def fit(self, user_pantries: List[Dict[str, Any]]) -> None:
        """user_pantries: [{ user_id, canonical_items: [str] }, ...] — one document per user, aggregating their FoodItem history"""
        if not user_pantries:
            raise ValueError("Cannot fit on empty pantry corpus")
        with self._lock:
            docs = [" ".join(p["canonical_items"]) for p in user_pantries]
            self._matrix = self._vec.fit_transform(docs)
            self._user_ids = [str(p.get("user_id", "")) for p in user_pantries]
            self._fitted = True
            log.info(
                "PantryVectorizer fitted: %d user-docs, vocab=%d",
                len(user_pantries), len(self._vec.vocabulary_),
            )

    def transform_items(self, canonical_items: List[str]):
        if not self._fitted:
            raise RuntimeError("PantryVectorizer not fitted")
        return self._vec.transform([" ".join(canonical_items)])

    def underlying(self) -> TfidfVectorizer:
        return self._vec

    def user_profile(self, user_id: str):
        if not self._fitted:
            return None
        mask = np.array([u == user_id for u in self._user_ids])
        if not mask.any():
            return None
        return self._matrix[mask].mean(axis=0)


vectorizer = PantryVectorizer()
