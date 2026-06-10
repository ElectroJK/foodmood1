from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..config import settings
from ..preprocessing.ingredient_map import CATEGORY_DEFAULT_SHELF_LIFE
from ..preprocessing.normalizer import canonical_ingredient
from ..schemas import ReceiptConfirmationRequest, ReceiptItem


FOOD_CATEGORIES = set(CATEGORY_DEFAULT_SHELF_LIFE.keys()) - {"Other"}


def is_food_item(item: ReceiptItem) -> bool:
    if canonical_ingredient(item.name):
        return True
    return bool(item.category and item.category in FOOD_CATEGORIES)


def _dump_item(item: ReceiptItem) -> dict[str, Any]:
    data = item.model_dump(mode="json")
    data["canonicalName"] = canonical_ingredient(item.name)
    return data


def save_receipt_confirmation(payload: ReceiptConfirmationRequest) -> dict[str, Any]:
    accepted = [item for item in payload.confirmedItems if is_food_item(item)]
    rejected = [item for item in payload.confirmedItems if not is_food_item(item)]

    record = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "userId": payload.userId or "anonymous",
        "rawText": payload.rawText,
        "meanConfidence": payload.meanConfidence,
        "parsedItems": [_dump_item(item) for item in payload.parsedItems],
        "acceptedFoodItems": [_dump_item(item) for item in accepted],
        "rejectedNonFoodItems": [_dump_item(item) for item in rejected],
    }

    if accepted or rejected:
        path = Path(settings.receipt_feedback_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    return {
        "record": record,
        "accepted": accepted,
        "rejected": rejected,
    }


def load_receipt_fooditems() -> list[dict[str, Any]]:
    path = Path(settings.receipt_feedback_path)
    if not path.exists():
        return []

    out: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            user_id = record.get("userId") or "anonymous"
            added_date = record.get("createdAt")
            for item in record.get("acceptedFoodItems") or []:
                out.append({
                    "user": f"receipt:{user_id}",
                    "name": item.get("name", ""),
                    "category": item.get("category") or "Other",
                    "quantity": item.get("quantity") or 1,
                    "unit": item.get("unit") or "pcs",
                    "price": item.get("price") or 0,
                    "expiryDate": item.get("expiryDate"),
                    "addedDate": added_date,
                    "status": "active",
                    "source": "receipt_feedback",
                })
    return out


def load_receipt_rejections() -> list[str]:
    path = Path(settings.receipt_feedback_path)
    if not path.exists():
        return []

    out: list[str] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            for item in record.get("rejectedNonFoodItems") or []:
                name = item.get("name", "").strip()
                if name:
                    out.append(name)
    return out
