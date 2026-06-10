import sys
import os

sys.path.append(os.path.join(os.getcwd(), "ml-service"))

try:
    from app.services.training import retrain_pipeline
    from app.models.recipe_matcher import RecipeMatcher
    from app.models.edibility_classifier import edibility_classifier
    
    print("Imports successful!")
    
    matcher = RecipeMatcher()
    print("RecipeMatcher initialized successfully!")
    print(f"Loaded {len(matcher._ingredient_priorities)} priorities.")
    print("Priority for 'молоко':", matcher.get_priority("молоко"))
    
except Exception as e:
    import traceback
    traceback.print_exc()

