from datetime import datetime, timedelta, timezone
import asyncio

from app.models.pantry_vectorizer import vectorizer
from app.models.recipe_matcher import RecipeMatcher
from app.schemas import PantryItem
from app.services.notifications import build_recipe_suggestion_notifications


def test_recipe_notifications_focus_on_urgent_item():
    user_pantries = [
        {
            "user_id": "u1",
            "canonical_items": ["milk", "pasta", "egg", "chicken", "rice"],
        },
        {
            "user_id": "u2",
            "canonical_items": ["tomato", "cucumber", "cheese", "lettuce"],
        },
    ]
    vectorizer.fit(user_pantries)

    recipes = [
        {
            "_id": "r1",
            "name": "Creamy Pasta",
            "canonical_ingredients": ["milk", "pasta"],
            "ingredients": [
                {"name": "Milk", "amount": "200 ml"},
                {"name": "Pasta", "amount": "250 g"},
            ],
            "instructions": ["Boil pasta", "Add milk sauce"],
        },
        {
            "_id": "r2",
            "name": "Milk Omelette",
            "canonical_ingredients": ["milk", "egg"],
            "ingredients": [
                {"name": "Milk", "amount": "50 ml"},
                {"name": "Egg", "amount": "2"},
            ],
            "instructions": ["Whisk eggs with milk"],
        },
        {
            "_id": "r3",
            "name": "Chicken Rice Bowl",
            "canonical_ingredients": ["chicken", "rice"],
            "ingredients": [
                {"name": "Chicken", "amount": "200 g"},
                {"name": "Rice", "amount": "150 g"},
            ],
            "instructions": ["Cook chicken", "Serve over rice"],
        },
    ]
    matcher = RecipeMatcher()
    matcher.index_recipes(recipes)

    now = datetime.now(timezone.utc)
    pantry = [
        PantryItem(
            name="Milk 2%",
            quantity=1,
            unit="L",
            category="Dairy",
            expiryDate=now + timedelta(days=2),
        ),
        PantryItem(name="Pasta", quantity=1, unit="pack", category="Grains"),
        PantryItem(name="Eggs", quantity=6, unit="pcs", category="Other"),
        PantryItem(
            name="Chicken breast",
            quantity=1,
            unit="kg",
            category="Meat",
            expiryDate=now + timedelta(days=10),
        ),
        PantryItem(name="Rice", quantity=1, unit="pack", category="Grains"),
    ]

    notifications = asyncio.run(
        build_recipe_suggestion_notifications(
            matcher,
            pantry,
            items_limit=3,
            recipes_per_item=2,
        )
    )

    assert len(notifications) == 1
    assert notifications[0].canonicalName == "milk"
    assert len(notifications[0].recipes) == 2
    assert all("milk" in recipe.urgentIngredientsUsed for recipe in notifications[0].recipes)


def test_recipe_notifications_return_empty_without_urgent_items():
    user_pantries = [
        {"user_id": "u1", "canonical_items": ["milk", "pasta"]},
    ]
    vectorizer.fit(user_pantries)

    matcher = RecipeMatcher()
    matcher.index_recipes(
        [
            {
                "_id": "r1",
                "name": "Creamy Pasta",
                "canonical_ingredients": ["milk", "pasta"],
                "ingredients": [
                    {"name": "Milk", "amount": "200 ml"},
                    {"name": "Pasta", "amount": "250 g"},
                ],
            }
        ]
    )

    now = datetime.now(timezone.utc)
    pantry = [
        PantryItem(
            name="Milk 2%",
            quantity=1,
            unit="L",
            category="Dairy",
            expiryDate=now + timedelta(days=10),
        ),
        PantryItem(name="Pasta", quantity=1, unit="pack", category="Grains"),
    ]

    notifications = asyncio.run(build_recipe_suggestion_notifications(matcher, pantry))

    assert notifications == []
