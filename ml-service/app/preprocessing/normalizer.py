"""FoodItem and Recipe-ingredient name normalization"""
import re
import unicodedata
from datetime import datetime, timezone
from typing import Iterable, Optional

from .ingredient_map import INGREDIENT_SYNONYMS, default_shelf_life


_NOISE_PATTERNS = [
    r"\d+[.,]?\d*\s*(?:г|гр|кг|мл|л|шт|%|kg|g|ml|l|pcs|pack)\b",
    r"\b(?:тм|tm|gold|premium|extra|light|fresh|organic|эконом|new|нов)\b",
    r"\b(?:фудмастер|food\s*master|magnum|small|metro|galmart|арзан)\b",
    r"[#№]?\d+",
]
_NOISE_RE = [re.compile(p, re.IGNORECASE) for p in _NOISE_PATTERNS]
_NON_LETTER_RE = re.compile(r"[^\w\sа-яёқғүұһөәі]", re.UNICODE)
_MULTISPACE_RE = re.compile(r"\s+")


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def normalize_raw(text: str) -> str:
    s = _strip_accents(text.lower())
    for r in _NOISE_RE:
        s = r.sub(" ", s)
    s = _NON_LETTER_RE.sub(" ", s)
    s = _MULTISPACE_RE.sub(" ", s).strip()
    return s


def canonical_ingredient(raw: str) -> Optional[str]:
    cleaned = normalize_raw(raw)
    if not cleaned:
        return None
    for canonical, synonyms in INGREDIENT_SYNONYMS.items():
        for syn in synonyms:
            syn_clean = _strip_accents(syn.lower()).strip()
            if syn_clean and syn_clean in cleaned:
                return canonical
    return None


def normalize_names(items: Iterable[dict], name_key: str = "name") -> tuple[list[str], list[str]]:
    canon: list[str] = []
    seen: set[str] = set()
    unrecognized: list[str] = []
    for it in items:
        name = (it.get(name_key) or "").strip()
        if not name:
            continue
        c = canonical_ingredient(name)
        if c:
            if c not in seen:
                seen.add(c)
                canon.append(c)
        else:
            unrecognized.append(name)
    return canon, unrecognized


def days_to_expiry(item: dict) -> int:
    """works for both FoodItem (expiryDate, addedDate, category) and free dicts"""
    expiry = item.get("expiryDate")
    if isinstance(expiry, str):
        try:
            expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        except ValueError:
            expiry = None
    if isinstance(expiry, datetime):
        now = datetime.now(timezone.utc)
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        return max(0, (expiry - now).days)

    added = item.get("addedDate") or item.get("createdAt")
    if isinstance(added, str):
        try:
            added = datetime.fromisoformat(added.replace("Z", "+00:00"))
        except ValueError:
            added = None
    canon = canonical_ingredient(item.get("name", "") or "")
    fallback = default_shelf_life(canon, item.get("category"))
    if isinstance(added, datetime):
        now = datetime.now(timezone.utc)
        if added.tzinfo is None:
            added = added.replace(tzinfo=timezone.utc)
        elapsed = (now - added).days
        return max(0, fallback - elapsed)
    return fallback
