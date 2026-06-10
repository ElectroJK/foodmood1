from app.preprocessing.normalizer import canonical_ingredient, normalize_names


def test_canonical_milk_brand():
    assert canonical_ingredient("МОЛОКО ФУДМАСТЕР 2.5% 1Л") == "milk"


def test_canonical_chicken():
    assert canonical_ingredient("Куриное филе охлаждённое 1кг") == "chicken"


def test_canonical_unknown():
    assert canonical_ingredient("Зубная паста Colgate") is None


def test_normalize_names_dedupes():
    items = [{"name": "Молоко 1л"}, {"name": "Milk 2%"}, {"name": "хлеб"}]
    canon, unknown = normalize_names(items)
    assert canon == ["milk", "bread"]
    assert unknown == []
