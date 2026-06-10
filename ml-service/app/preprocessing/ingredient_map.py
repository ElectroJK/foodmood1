from __future__ import annotations

"""ingredient synonyms + default shelf-life fallback"""

INGREDIENT_SYNONYMS: dict[str, list[str]] = {
    # Dairy
    "milk":           ["milk", "молок", "сут", "сүт"],
    "butter":         ["butter", "сливочное масло", "сары май"],
    "cheese":         ["cheese", "сыр", "ірімшік", "брынза", "моцарел", "пармез"],
    "yogurt":         ["yogurt", "йогурт", "айран"],
    "sour_cream":     ["sour cream", "сметан"],
    "cottage_cheese": ["cottage cheese", "творог", "сүзбе"],
    "cream":          ["cream", "сливк"],

    # Meat
    "chicken":        ["chicken", "курин", "куриц", "филе кур", "тауық"],
    "beef":           ["beef", "говяд", "сиыр"],
    "pork":           ["pork", "свинин"],
    "fish":           ["fish", "рыб", "лосось", "форель", "семг", "сёмг", "минтай"],
    "egg":            ["egg", "яйц", "яйк", "жұмыртқа"],

    # Veggies
    "potato":         ["potato", "картоф", "картош", "картоп"],
    "onion":          ["onion", "лук", "пияз"],
    "garlic":         ["garlic", "чеснок", "сарымсақ"],
    "carrot":         ["carrot", "морков", "сәбіз"],
    "tomato":         ["tomato", "томат", "помидор", "қызанақ"],
    "cucumber":       ["cucumber", "огур", "қияр"],
    "pepper":         ["pepper", "перец", "болгар", "бұрыш"],
    "cabbage":        ["cabbage", "капуст"],
    "lettuce":        ["lettuce", "салат", "руккол", "айсберг"],
    "broccoli":       ["broccoli", "брокколи"],
    "mushroom":       ["mushroom", "гриб", "шампин"],

    # Fruits
    "apple":          ["apple", "яблок", "алма"],
    "banana":         ["banana", "банан"],
    "lemon":          ["lemon", "лимон"],
    "orange":         ["orange", "апельсин"],
    "berries":        ["berries", "ягод", "клубник", "малин", "черник"],

    # Bakery / Grains / Pantry
    "bread":          ["bread", "хлеб", "батон", "буханк", "нан", "лаваш"],
    "rice":           ["rice", "рис", "күріш"],
    "pasta":          ["pasta", "макарон", "спагет", "лапш", "феттучин", "пенне"],
    "flour":          ["flour", "мук", "ұн"],
    "sugar":          ["sugar", "сахар", "қант"],
    "salt":           ["salt", "соль", "тұз"],
    "oil":            ["oil", "масло раст", "подсолн", "оливк"],
    "beans":          ["beans", "фасол"],
    "lentils":        ["lentils", "чечевиц"],
    "tuna":           ["tuna", "тунец"],
    "honey":          ["honey", "мед", "мёд", "бал"],
}


# fallback shelf life when expiryDate is missing on FoodItem
SHELF_LIFE_DAYS: dict[str, int] = {
    "milk": 5, "yogurt": 7, "sour_cream": 7, "cottage_cheese": 5,
    "cheese": 14, "butter": 30, "cream": 7,
    "chicken": 2, "beef": 3, "pork": 3, "fish": 2, "egg": 21,
    "lettuce": 4, "cucumber": 7, "tomato": 7, "pepper": 10,
    "cabbage": 21, "potato": 45, "onion": 45, "garlic": 60,
    "carrot": 21, "broccoli": 5, "mushroom": 4,
    "apple": 21, "banana": 5, "lemon": 21, "orange": 14, "berries": 4,
    "bread": 5, "rice": 365, "pasta": 365, "flour": 180,
    "sugar": 730, "salt": 730, "oil": 180,
    "beans": 365, "lentils": 365, "tuna": 365, "honey": 730,
}


CATEGORY_DEFAULT_SHELF_LIFE: dict[str, int] = {
    "Dairy": 7,
    "Meat": 3,
    "Veggies": 7,
    "Fruits": 7,
    "Bakery": 5,
    "Grains": 180,
    "Pantry": 180,
    "Frozen": 90,
    "Beverages": 30,
    "Other": 14,
}


def default_shelf_life(canonical: str | None, category: str | None) -> int:
    if canonical and canonical in SHELF_LIFE_DAYS:
        return SHELF_LIFE_DAYS[canonical]
    if category and category in CATEGORY_DEFAULT_SHELF_LIFE:
        return CATEGORY_DEFAULT_SHELF_LIFE[category]
    return 14
