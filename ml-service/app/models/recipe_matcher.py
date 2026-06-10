"""recipe matcher: cosine similarity + coverage + urgency-aware boost + ingredient priority"""
from __future__ import annotations
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import logging
import numpy as np
import csv
import os
from sklearn.metrics.pairwise import cosine_similarity

from .pantry_vectorizer import vectorizer

log = logging.getLogger(__name__)


@dataclass
class MatchResult:
    recipe: Dict[str, Any]
    score: float
    cosine: float
    coverage: float
    matched: List[str]
    urgent_used: List[str]


class RecipeMatcher:
    MODEL_VERSION = "recipe-match-1.2"

    W_COSINE = 1.0
    W_COVERAGE = 0.6
    W_URGENT = 0.4
    W_PRIORITY = 0.1

    def __init__(self) -> None:
        self._recipe_matrix = None
        self._recipes: List[Dict[str, Any]] = []
        self._ingredient_priorities: Dict[str, float] = {}
        self._load_priorities()

    def _load_priorities(self) -> None:
        dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "ingredient_priority.csv")
        if os.path.exists(dataset_path):
            with open(dataset_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self._ingredient_priorities[row["ingredient"].lower()] = float(row["priority_weight"])
            log.info("Loaded %d ingredient priorities", len(self._ingredient_priorities))
        else:
            log.warning("Ingredient priority dataset not found at %s", dataset_path)

    @property
    def size(self) -> int:
        return len(self._recipes)

    def index_recipes(self, recipes: List[Dict[str, Any]]) -> None:
        """recipes: [{ _id, name, canonical_ingredients: [str], ... }, ...]"""
        if not vectorizer.fitted:
            raise RuntimeError("Fit PantryVectorizer before indexing recipes")
        if not recipes:
            self._recipe_matrix = None
            self._recipes = []
            return
        docs = [" ".join(r["canonical_ingredients"]) for r in recipes]
        self._recipe_matrix = vectorizer.underlying().transform(docs)
        self._recipes = recipes
        log.info("RecipeMatcher indexed %d recipes", len(recipes))

    def get_priority(self, ingredient: str) -> float:
        return self._ingredient_priorities.get(ingredient.lower(), 0.0)

    def match(
        self,
        canonical_items: List[str],
        urgent_items: List[str],
        top_k: int = 12,
        min_score: float = 0.0,
    ) -> List[MatchResult]:
        if self._recipe_matrix is None or not self._recipes:
            raise RuntimeError("No recipes indexed")

        q = vectorizer.transform_items(canonical_items)
        cos = cosine_similarity(q, self._recipe_matrix).flatten()

        pantry_set = set(canonical_items)
        urgent_set = set(urgent_items)

        results: List[MatchResult] = []
        for idx, recipe in enumerate(self._recipes):
            recipe_set = set(recipe["canonical_ingredients"])
            if not recipe_set:
                continue
            
            # Matched ingredients sorted by priority first (descending), then alphabetically
            matched = sorted(list(recipe_set & pantry_set), key=lambda x: (-self.get_priority(x), x))
            urgent_used = sorted(list(recipe_set & urgent_set), key=lambda x: (-self.get_priority(x), x))
            coverage = len(matched) / len(recipe_set)

            score = self.W_COSINE * float(cos[idx]) + self.W_COVERAGE * coverage
            if urgent_used:
                score += self.W_URGENT * min(len(urgent_used) / 3.0, 1.0)
                
            # Boost score based on priorities of matched ingredients
            priority_boost = sum(self.get_priority(item) for item in matched)
            # Normalize boost assuming max priority per item is ~10 and max items ~10, dividing by 100
            score += self.W_PRIORITY * (priority_boost / 100.0)

            if score < min_score:
                continue
            results.append(MatchResult(
                recipe=recipe,
                score=score,
                cosine=float(cos[idx]),
                coverage=coverage,
                matched=matched,
                urgent_used=urgent_used,
            ))

        results.sort(key=lambda r: -r.score)
        return results[:top_k]
