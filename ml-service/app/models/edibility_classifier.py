"""Edibility Classifier to filter non-food items from receipts."""
import logging
from typing import List, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.exceptions import NotFittedError

from ..preprocessing.normalizer import canonical_ingredient

log = logging.getLogger(__name__)

class EdibilityClassifier:
    """Classifies text items into food (True) or non-food (False)."""
    
    def __init__(self):
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4), min_df=1)),
            ('clf', LogisticRegression(class_weight='balanced', random_state=42))
        ])
        self.is_fitted = False

    def fit(self, X: List[str], y: List[bool]):
        """Train the classifier."""
        if not X or not y:
            log.warning("No data provided to fit EdibilityClassifier.")
            return

        # Check if we only have one class
        unique_classes = set(y)
        if len(unique_classes) < 2:
            log.warning("EdibilityClassifier needs at least 2 classes to fit. Using a fallback heuristic for now.")
            self.is_fitted = False
            return

        self.model.fit(X, y)
        self.is_fitted = True
        log.info(f"EdibilityClassifier fitted with {len(X)} samples.")

    def predict(self, names: List[str]) -> List[Tuple[bool, float]]:
        """Predict if items are food, returning (is_food, confidence)."""
        if not names:
            return []

        results = []
        if not self.is_fitted:
            # Fallback to heuristic if model isn't trained yet
            for name in names:
                is_food = bool(canonical_ingredient(name))
                results.append((is_food, 0.8 if is_food else 0.5))
            return results

        try:
            predictions = self.model.predict(names)
            probabilities = self.model.predict_proba(names)
            
            # Find the index of the 'True' class (is_food = True)
            try:
                true_index = list(self.model.classes_).index(True)
            except ValueError:
                true_index = 0

            for i, name in enumerate(names):
                is_food = bool(predictions[i])
                conf = float(probabilities[i][true_index] if is_food else probabilities[i][1 - true_index])
                
                # Heuristic override: if the canonical normalizer knows it for a fact, trust it
                if not is_food and canonical_ingredient(name):
                    is_food = True
                    conf = 0.99
                
                results.append((is_food, conf))
        except NotFittedError:
            # Fallback
            for name in names:
                is_food = bool(canonical_ingredient(name))
                results.append((is_food, 0.8 if is_food else 0.5))

        return results

edibility_classifier = EdibilityClassifier()
