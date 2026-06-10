"""training pipeline: loads FoodItems + Recipes from MongoDB, fits TF-IDF, indexes recipes, mines eLCS rules"""
from __future__ import annotations
import logging
import csv
import os
from collections import defaultdict
from typing import List, Dict, Any

from ..db import get_db
from ..config import settings
from ..preprocessing.normalizer import canonical_ingredient
from ..models.pantry_vectorizer import vectorizer
from ..models.recipe_matcher import RecipeMatcher
from ..models.elcs_classifier import waste_classifier
from ..models.edibility_classifier import edibility_classifier
from .feature_builder import build_outcome_samples
from .receipt_feedback import load_receipt_fooditems, load_receipt_rejections

log = logging.getLogger(__name__)


async def _load_fooditems() -> List[Dict[str, Any]]:
    db = get_db()
    cursor = db[settings.fooditems_collection].find({})
    return await cursor.to_list(length=None)


async def _load_recipes() -> List[Dict[str, Any]]:
    db = get_db()
    cursor = db[settings.recipes_collection].find({})
    return await cursor.to_list(length=None)


def _canonicalize_recipe(recipe: Dict[str, Any]) -> List[str]:
    """recipe.ingredients[].normalizedName wins; otherwise fall back to .name"""
    out: list[str] = []
    seen: set[str] = set()
    for ing in recipe.get("ingredients") or []:
        candidate = (ing.get("normalizedName") or ing.get("name") or "").strip()
        if not candidate:
            continue
        c = canonical_ingredient(candidate) or candidate.lower()
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _aggregate_user_pantries(food_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """one document per user = concatenation of all their canonical FoodItem names"""
    by_user: dict[str, list[str]] = defaultdict(list)
    for item in food_items:
        user_id = str(item.get("user", ""))
        canon = canonical_ingredient(item.get("name", "") or "")
        if user_id and canon:
            by_user[user_id].append(canon)
    return [
        {"user_id": uid, "canonical_items": items}
        for uid, items in by_user.items() if items
    ]


async def retrain_pipeline(matcher: RecipeMatcher) -> dict:
    mongo_food_items = await _load_fooditems()
    receipt_food_items = load_receipt_fooditems()
    food_items = [*mongo_food_items, *receipt_food_items]
    recipes_raw = await _load_recipes()
    log.info(
        "Loaded %d Mongo FoodItems, %d receipt feedback items, and %d recipes",
        len(mongo_food_items),
        len(receipt_food_items),
        len(recipes_raw),
    )

    # Train EdibilityClassifier
    food_names = [item.get("name", "") for item in food_items if item.get("name")]
    rejected_names = load_receipt_rejections()
    
    # Load custom dataset
    csv_names = []
    csv_labels = []
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "edibility_dataset.csv")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                csv_names.append(row["name"])
                csv_labels.append(bool(int(row["is_food"])))
    
    # Generate some hardcoded synthetic negative samples in case receipt feedback is empty
    synthetic_negatives = [
        "battery", "soap", "shampoo", "paper towel", "toilet paper", "receipt", "bag",
        "detergent", "toothpaste", "bleach", "sponge", "cleaner", "napkins", "trash bags",
        "plastic wrap", "foil", "light bulb", "pet food", "dog food", "cat food", "lotion",
        "deodorant", "razor", "shaving cream", "diapers", "wipes", "magazine", "gift card",
        "шампунь", "мыло", "гель для душа", "порошок", "кондиционер", "салфетки", "губка",
        "пакет", "мешки для мусора", "туалетная бумага", "зубная паста", "пена для бритья",
        "памперсы", "прокладки", "fairy", "domestos", "tide", "ariel", "корм для собак",
        "корм для кошек", "лампочка", "батарейки", "освежитель воздуха", "дезодорант",
        "крем", "лосьон", "пленка", "фольга", "пергамент", "щетка"
    ]
    negative_names = list(set(rejected_names + synthetic_negatives))

    X_clf = food_names + negative_names + csv_names
    y_clf = [True] * len(food_names) + [False] * len(negative_names) + csv_labels
    edibility_classifier.fit(X_clf, y_clf)

    user_pantries = _aggregate_user_pantries(food_items)
    if not user_pantries:
        log.warning("No usable FoodItems — vectorizer trained on recipe corpus as fallback")
        if not recipes_raw:
            return {"status": "no_data", "fooditems": 0, "recipes": 0}
        fallback = [
            {"user_id": "__fallback__", "canonical_items": _canonicalize_recipe(r)}
            for r in recipes_raw
        ]
        vectorizer.fit([f for f in fallback if f["canonical_items"]])
    else:
        vectorizer.fit(user_pantries)

    enriched_recipes: list[dict] = []
    for r in recipes_raw:
        canon = _canonicalize_recipe(r)
        if canon:
            enriched_recipes.append({**r, "canonical_ingredients": canon})
    matcher.index_recipes(enriched_recipes)

    X, y, feature_names = build_outcome_samples(food_items)
    if X.shape[0] >= 5:
        waste_classifier.fit(X, y, feature_names)
    else:
        log.info("Only %d outcome samples — skipping eLCS fit", X.shape[0])

    return {
        "status": "ok",
        "fooditems": len(food_items),
        "mongo_fooditems": len(mongo_food_items),
        "receipt_feedback_items": len(receipt_food_items),
        "recipes_indexed": matcher.size,
        "users": len(user_pantries),
        "elcs_samples": int(X.shape[0]),
    }
