import asyncio
import os
import sys

# Add ml-service to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.edibility_classifier import edibility_classifier
from app.services.training import retrain_pipeline
from app.models.recipe_matcher import RecipeMatcher

async def test():
    print("Testing ML Edibility Classifier...")
    # Instantiate matcher
    matcher = RecipeMatcher()
    
    # Try retraining
    print("Triggering retraining pipeline...")
    status = await retrain_pipeline(matcher)
    print("Training status:", status)
    
    # Test items
    test_items = [
        "шампунь head & shoulders",
        "мыло жидкое",
        "туалетная бумага zewa",
        "хлебцы",
        "молоко домик в деревне 3.2%",
        "сыр российский",
        "fairy для посуды",
        "апельсины",
        "pampers",
        "корм whiskas"
    ]
    
    print("\nPredictions:")
    predictions = edibility_classifier.predict(test_items)
    for item, (is_food, conf) in zip(test_items, predictions):
        print(f"Item: {item:30} -> is_food: {str(is_food):5} | Confidence: {conf:.4f}")

if __name__ == "__main__":
    asyncio.run(test())
