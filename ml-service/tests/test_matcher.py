from app.models.pantry_vectorizer import vectorizer
from app.models.recipe_matcher import RecipeMatcher


def test_end_to_end_matching():
    user_pantries = [
        {"user_id": "u1", "canonical_items": ["chicken", "rice", "onion", "garlic"]},
        {"user_id": "u2", "canonical_items": ["tomato", "cucumber", "lettuce", "cheese"]},
    ]
    vectorizer.fit(user_pantries)

    recipes = [
        {"_id": "r1", "name": "Chicken with Rice",
         "canonical_ingredients": ["chicken", "rice", "onion"]},
        {"_id": "r2", "name": "Greek Salad",
         "canonical_ingredients": ["tomato", "cucumber", "cheese", "lettuce"]},
        {"_id": "r3", "name": "Tomato Pasta",
         "canonical_ingredients": ["pasta", "tomato", "garlic"]},
    ]
    matcher = RecipeMatcher()
    matcher.index_recipes(recipes)

    results = matcher.match(
        canonical_items=["chicken", "rice", "onion", "garlic"],
        urgent_items=["chicken"],
        top_k=3,
    )
    assert results[0].recipe["_id"] == "r1"
    assert "chicken" in results[0].urgent_used
