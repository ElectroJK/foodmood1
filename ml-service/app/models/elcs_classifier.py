"""scikit-eLCS classifier mining interpretable rules from FoodItem outcomes (consumed/discarded/shared)"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
import logging
import numpy as np

try:
    from skeLCS import eLCS
    HAS_ELCS = True
except Exception:
    HAS_ELCS = False
    eLCS = None  # type: ignore

log = logging.getLogger(__name__)


class WasteRiskClassifier:
    MODEL_VERSION = "elcs-waste-0.1"

    def __init__(self, learning_iterations: int = 5000) -> None:
        self._model: Optional[Any] = None
        self._feature_names: List[str] = []
        self._fitted = False
        self._samples_seen = 0
        if HAS_ELCS:
            self._model = eLCS(learning_iterations=learning_iterations)
        else:
            log.warning("scikit-eLCS not available; rule mining disabled")

    @property
    def fitted(self) -> bool:
        return self._fitted

    @property
    def samples_seen(self) -> int:
        return self._samples_seen

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]) -> None:
        if self._model is None or len(X) < 5:
            log.info("eLCS skipped: too few samples or library missing")
            return
        if len(np.unique(y)) < 2:
            log.info("eLCS skipped: needs at least 2 classes in y")
            return
        self._model.fit(X, y)
        self._feature_names = feature_names
        self._samples_seen = int(X.shape[0])
        self._fitted = True
        log.info("eLCS fitted on %d samples, %d features", X.shape[0], X.shape[1])

    def extract_rules(self, top_n: int = 20) -> List[Dict[str, Any]]:
        if not self._fitted or self._model is None:
            return []
        rules: List[Dict[str, Any]] = []
        try:
            popset = self._model.population.popSet
        except AttributeError:
            return []
        for cl in popset:
            try:
                specified = list(cl.specifiedAttList)
                condition = list(cl.condition)
                conds = [
                    f"{self._feature_names[i]}={v}"
                    for i, v in zip(specified, condition)
                ]
                rules.append({
                    "if": " AND ".join(conds) if conds else "TRUE",
                    "then": f"outcome={cl.phenotype}",
                    "fitness": float(getattr(cl, "fitness", 0.0)),
                    "accuracy": float(getattr(cl, "accuracy", 0.0)),
                })
            except Exception as e:
                log.debug("Skipping rule due to introspection error: %s", e)
        rules.sort(key=lambda r: (-r["fitness"], -r["accuracy"]))
        return rules[:top_n]


waste_classifier = WasteRiskClassifier()
