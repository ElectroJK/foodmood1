// Domain-specific parser for grocery receipts.
// Input: raw OCR text + per-word confidence (Tesseract result).
// Output: ScannedItem[] aligned with frontend Scanner.tsx shape:
//   { name: string, price: string, expiryDate: string, confidence: number, currency: 'KZT', ... }
//
// All prices are converted to KZT (tenge) automatically. The source currency
// is detected from the receipt text (symbols + ISO codes + words). If the
// receipt is already in tenge, no conversion happens.

import { detectCurrency, convertItemsToKzt } from './currencyConverter.js';

const NOISE = [
  // Totals & taxes
  /total/i,
  /subtotal/i,
  /tax\b/i,
  /vat\b/i,
  /change/i,
  /balance/i,
  /tender/i,

  // Payment methods & card processing
  /\bvisa\b/i,
  /master\s*card/i,
  /\bmc\b/i,
  /amex/i,
  /american\s*express/i,
  /\bdebit\b/i,
  /\bcredit\b/i,
  /\bdiscover\b/i,
  /\bcash\b/i,
  /\bcard\b/i,
  /\bauth\b/i,
  /approved/i,
  /\bapp\s*r\b/i,
  /ref\s*#/i,
  /\bref\b\s*\d/i,
  /payment/i,
  /\btip\b/i,
  /\bcustomer\s*copy\b/i,
  /\bmerchant\s*copy\b/i,
  /\bsignature\b/i,
  /\bterminal\b/i,
  /\bbatch\b/i,
  /\bsequence\b/i,

  // Store / header
  /receipt/i,
  /thank you/i,
  /thanks for/i,
  /tel\b/i,
  /tel:/i,
  /www\./i,
  /\.com\b/i,
  /\bstore\s*#/i,
  /cashier/i,

  // Dates & barcodes
  /^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/,
  /\b\d{4,}\b\s*$/,

  // Number lines (counts, item counts at the end)
  /^items?\s+sold/i,
  /^\s*\d+\s+items?\b/i,
  /\bpaper\s*towel/i,
  /\btoilet\s*paper/i,
  /\bnapkin/i,
  /\bbatter(?:y|ies)\b/i,
  /\bsoap\b/i,
  /\bshampoo\b/i,
  /\bdetergent\b/i,
  /\btoothpaste\b/i,
  /\bbleach\b/i,
  /\bsponge\b/i,
  /\bcleaner\b/i,
  /\btrash\s*bag/i,
  /\bplastic\s*wrap/i,
  /\bfoil\b/i,
  /\blight\s*bulb/i,
  /\bdog\s*food\b/i,
  /\bcat\s*food\b/i,
  /\bpet\s*food\b/i,
  /\blotion\b/i,
  /\bdeodorant\b/i,
  /\brazor\b/i,
  /\bshaving\s*cream/i,
  /\bdiaper\b/i,
  /\bwip(?:e|es)\b/i,
  /\bmagazine\b/i,
  /\bgift\s*card\b/i,
  /бумажн(?:ое|ые)\s+полотенц(?:е|а)/i,
  /туалетн(?:ая|ые)\s+бумаг(?:а|и)/i,
  /салфетк/i,
  /порошок/i,
  /кондиционер/i,
  /губк/i,
  /пакет/i,
  /мешки\s+для\s+мусора/i,
  /зубн(?:ая|ые)\s+паст(?:а|ы)/i,
  /пена\s+для\s+бритья/i,
  /памперс/i,
  /прокладки/i,
  /лампочк/i,
  /освежитель\s+воздуха/i,
  /пергамент/i,
  /щетк/i,
  /моющ(?:ее|ие)\s+средств(?:о|а)/i,
  /полотенце/i,
  /fairy/i,
  /domestos/i,
  /tide/i,
  /ariel/i,

  // Russian receipt service lines (totals, payment, fiscal data).
  // NOTE: JS \b does not work with Cyrillic, so plain substrings are used.
  /итог/i,
  /сумма/i,
  /сдач/i,
  /ндс/i,
  /налог/i,
  /кассир/i,
  /касс(?:а|ов|е)/i,
  /скидк/i,
  /спасибо/i,
  /наличн/i,
  /карт(?:а|ой|ы|у)/i, // payment card; does NOT match "картофель"
  /терминал/i,
  /квитанц/i,
  /фискальн/i,
  /продавец/i,
  /смена/i,
  /оплат/i,
  /магазин/i,
  /(?:^|\s)(?:инн|ккм|ккт|офд|чек)(?:\s|$)/i,
];

const DEFAULT_SHELF_LIFE = {
  Dairy: 7,
  Meat: 3,
  Veggies: 5,
  Fruits: 5,
  Bakery: 4,
  Grains: 180,
  Pantry: 365,
  Frozen: 90,
  Beverages: 30,
  Other: 7,
};

const CATEGORY_KEYWORDS = {
  Dairy: ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'kefir'],
  Meat: ['chicken', 'beef', 'pork', 'turkey', 'sausage', 'ham', 'bacon', 'mince', 'lamb'],
  Veggies: ['tomato', 'cucumber', 'spinach', 'lettuce', 'carrot', 'onion', 'potato', 'pepper', 'broccoli', 'cabbage'],
  Fruits: ['apple', 'banana', 'orange', 'grape', 'berry', 'lemon', 'pear', 'peach', 'strawberry', 'blueberry'],
  Bakery: ['bread', 'bun', 'roll', 'baguette', 'pastry', 'croissant', 'bagel'],
  Grains: ['rice', 'pasta', 'noodle', 'oat', 'flour', 'quinoa', 'cereal'],
  Pantry: ['oil', 'vinegar', 'sugar', 'salt', 'sauce', 'spice', 'beans', 'canned'],
  Frozen: ['frozen', 'ice cream'],
  Beverages: ['juice', 'cola', 'water', 'tea', 'coffee', 'soda'],
};

// ============================================================================
// RU → EN product translation.
// Russian receipt items are translated to English so downstream ML filtering
// and recipe recommendations (which match English keywords) keep working.
// Keys are STEMS (word prefixes) so any grammatical form matches:
// "молоко"/"молока"/"молоком" → stem "молок" → "milk".
// Lookup is longest-prefix-first over a Map → O(word length), effectively O(1).
// ============================================================================
const RU_EN_PRODUCTS = new Map(Object.entries({
  // Dairy
  молок: 'milk', сыр: 'cheese', творог: 'cottage cheese', йогурт: 'yogurt',
  кефир: 'kefir', сметан: 'sour cream', сливк: 'cream', ряженк: 'ryazhenka',
  маргарин: 'margarine', масл: 'butter', яйц: 'eggs', яиц: 'eggs',
  // Meat & fish
  куриц: 'chicken', курин: 'chicken', цыпл: 'chicken', говядин: 'beef',
  свинин: 'pork', фарш: 'mince', колбас: 'sausage', сосиск: 'sausages',
  ветчин: 'ham', бекон: 'bacon', индейк: 'turkey', баранин: 'lamb',
  рыб: 'fish', лосос: 'salmon', семг: 'salmon', тунец: 'tuna', тунц: 'tuna',
  креветк: 'shrimp', сельд: 'herring', селедк: 'herring', скумбри: 'mackerel',
  печень: 'liver', печенье: 'cookies',
  // Veggies
  помидор: 'tomato', томат: 'tomato', огурц: 'cucumber', огурец: 'cucumber',
  картоф: 'potato', картошк: 'potato', морков: 'carrot', лук: 'onion',
  чеснок: 'garlic', капуст: 'cabbage', перец: 'pepper', перц: 'pepper',
  свекл: 'beet', кабач: 'zucchini', баклажан: 'eggplant', шпинат: 'spinach',
  салат: 'lettuce', укроп: 'dill', петрушк: 'parsley', гриб: 'mushrooms',
  зелен: 'greens', тыкв: 'pumpkin', редис: 'radish', брокколи: 'broccoli',
  // Fruits
  яблок: 'apple', банан: 'banana', апельсин: 'orange', мандарин: 'tangerine',
  лимон: 'lemon', груш: 'pear', персик: 'peach', абрикос: 'apricot',
  виноград: 'grapes', клубник: 'strawberry', черник: 'blueberry',
  малин: 'raspberry', вишн: 'cherry', арбуз: 'watermelon', дын: 'melon',
  киви: 'kiwi', гранат: 'pomegranate', ягод: 'berries', слив: 'plum',
  // Bakery & grains
  хлеб: 'bread', батон: 'baguette', булк: 'bun', булочк: 'bun', лаваш: 'lavash',
  рис: 'rice', греч: 'buckwheat', макарон: 'pasta', спагетти: 'spaghetti',
  лапш: 'noodles', овсян: 'oats', мук: 'flour', круп: 'grains', хлопь: 'cereal',
  // Pantry
  сахар: 'sugar', сол: 'salt', соус: 'sauce', уксус: 'vinegar', мед: 'honey',
  варень: 'jam', фасол: 'beans', горох: 'peas', горош: 'peas',
  кукуруз: 'corn', орех: 'nuts', шоколад: 'chocolate', конфет: 'candy',
  торт: 'cake', морожен: 'ice cream', пельмен: 'dumplings',
  заморож: 'frozen', кетчуп: 'ketchup', майонез: 'mayonnaise',
  специ: 'spices', дрожж: 'yeast', мюсли: 'muesli', чипс: 'chips',
  // Beverages
  сок: 'juice', вод: 'water', водк: 'vodka', чай: 'tea', кофе: 'coffee',
  газировк: 'soda', лимонад: 'lemonade', минералк: 'mineral water',
}));

// Two-word phrases checked BEFORE single stems ("сливочное масло" → "butter",
// not "cream butter"). Keys: "<stemA> <stemB>".
const RU_EN_PHRASES = new Map(Object.entries({
  'сливочн масл': 'butter',
  'оливков масл': 'olive oil',
  'подсолнечн масл': 'sunflower oil',
  'растительн масл': 'vegetable oil',
  'курин филе': 'chicken fillet',
  'курин грудк': 'chicken breast',
  'сгущен молок': 'condensed milk',
  'минеральн вод': 'mineral water',
}));
// Adjective stems used only inside phrases (no standalone translation).
const RU_PHRASE_ADJ = new Map(Object.entries({
  сливочн: 1, оливков: 1, подсолнечн: 1, растительн: 1,
  филе: 1, грудк: 1, сгущен: 1, минеральн: 1,
}));

const CYRILLIC_RE = /[а-яё]/i;
const MAX_STEM = 12;

// Longest-prefix stem lookup. Returns { stem, en } or null.
function ruStemLookup(token, map) {
  for (let len = Math.min(token.length, MAX_STEM); len >= 3; len--) {
    const key = token.slice(0, len);
    const en = map.get(key);
    if (en !== undefined) return { stem: key, en };
  }
  return null;
}

// Translate a Russian product name to English. Returns the English name,
// or null when nothing recognizable was found (caller keeps the original).
// Unknown Cyrillic tokens (brands like "Простоквашино") are dropped so the
// result stays matchable; Latin tokens are kept as-is.
export function translateRuToEn(name) {
  if (!CYRILLIC_RE.test(name)) return null;
  const tokens = name.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean);
  const out = [];
  let translated = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].replace(/[^a-zа-я0-9]/g, '');
    if (!tok) continue;
    const hit = ruStemLookup(tok, RU_EN_PRODUCTS);
    const adj = ruStemLookup(tok, RU_PHRASE_ADJ);
    // Prefer the longer stem for phrase matching ("сливочн" over "слив")
    const best = adj && (!hit || adj.stem.length > hit.stem.length) ? adj : hit;
    // Try a two-word phrase first (both word orders)
    if (best && i + 1 < tokens.length) {
      const nextTok = tokens[i + 1].replace(/[^a-zа-я0-9]/g, '');
      const nHit = ruStemLookup(nextTok, RU_EN_PRODUCTS);
      const nAdj = ruStemLookup(nextTok, RU_PHRASE_ADJ);
      const next = nAdj && (!nHit || nAdj.stem.length > nHit.stem.length) ? nAdj : nHit;
      if (next) {
        const phrase = RU_EN_PHRASES.get(`${best.stem} ${next.stem}`) ||
                       RU_EN_PHRASES.get(`${next.stem} ${best.stem}`);
        if (phrase) {
          if (!out.includes(phrase)) out.push(phrase);
          translated = true;
          i++;
          continue;
        }
      }
    }
    if (hit) {
      if (!out.includes(hit.en)) out.push(hit.en);
      translated = true;
    } else if (!CYRILLIC_RE.test(tokens[i]) && /[a-z]/.test(tokens[i])) {
      out.push(tokens[i]); // keep Latin-letter tokens; drop pure numbers/percentages
    }
  }
  if (!translated) return null;
  const result = out.join(' ').trim();
  return result ? result.charAt(0).toUpperCase() + result.slice(1) : null;
}

function classifyCategory(name) {
  const lower = name.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) return cat;
  }
  return 'Other';
}

const TOTAL_PRICE_RE = /([0-9]{1,4}[.,][0-9]{2})\s*[$₸₽€]?\s*$/;
const UNIT_TOKENS = '(?:lb|1b|ib|lbs|oz|g|kg|kgs|gr|gms|ml|mls|l|gal|gals|qt|qts|pt|pts)';

const NAME_STRIPPERS = [
  /[$₸₽€]\s*\d+([.,]\d{1,2})?/g,
  /\d+([.,]\d{1,2})?\s*[$₸₽€]/g,
  new RegExp('\\/\\s*\\d*\\s*' + UNIT_TOKENS + '\\b', 'gi'),
  new RegExp('\\b\\d+(?:[.,]\\d+)?\\s*' + UNIT_TOKENS + '\\b', 'gi'),
  /\([^)]*\)/g,
  /\s+@\s*/g,
  /[*#@~|]+/g,
  /\s+\d+(?:[.,]\d+)?\s*(?=\s|$)/g,
];

function isNoise(line) {
  return NOISE.some((re) => re.test(line));
}

// Heuristic to detect OCR garbage. A line is "garbage" when after cleaning:
//   - too many runs of repeated identical letters (e.g. "kkkk"),
//   - vowel ratio is implausibly low (real product names have vowels),
//   - too many lone letters separated by spaces ("k m d x").
function looksLikeGarbage(name) {
  const letters = name.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length < 3) return true;

  // 3+ consecutive identical letters → very rare in real words
  if (/([a-zA-Zа-яё])\1{2,}/i.test(name)) return true;

  // Very low vowel ratio (Latin + Cyrillic vowels)
  const vowels = letters.match(/[aeiouyаеёиоуыэюя]/gi)?.length || 0;
  if (vowels / letters.length < 0.15) return true;

  // Many 1- and 2-char tokens suggests OCR noise like "k m d x"
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    const tiny = tokens.filter((t) => t.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '').length <= 2).length;
    if (tiny / tokens.length > 0.5) return true;
  }

  return false;
}

// Russian quantity/unit tokens stripped from names ("кг", "шт", "0.5л"...).
// JS \b is ASCII-only, so Cyrillic units use explicit boundaries instead.
const RU_UNIT_RE = /(?:^|[\s\d.,])(?:кг|гр|г|шт|мл|л|уп|пач|бут)\.?(?=[\s\d.,]|$)/gi;

function cleanName(raw) {
  let s = raw.replace(TOTAL_PRICE_RE, '');
  for (const re of NAME_STRIPPERS) s = s.replace(re, ' ');
  s = s.replace(RU_UNIT_RE, ' ');
  return s
    .replace(/\s{2,}/g, ' ')
    .replace(/^[^a-zA-Zа-яА-ЯёЁ]+/, '')
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]+$/, '')
    .trim();
}

function defaultExpiryFor(category, baseDate = new Date()) {
  const days = DEFAULT_SHELF_LIFE[category] ?? 7;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function structureConfidence(name, priceMatched) {
  let score = 0;
  if (priceMatched) score += 40;
  if (name.length >= 3) score += 20;
  if (/[a-zA-Zа-яА-ЯёЁ]/.test(name)) score += 20;
  if (/\s/.test(name)) score += 10;
  if (name.length < 30) score += 10;
  return score;
}

export async function parseReceipt(ocrResult) {
  const text = ocrResult.data?.text || '';
  const lines = text.split(/\r?\n/);

  // Detect currency from the FULL text (so e.g. one `$` at the bottom marks
  // the whole receipt as USD even if individual lines don't repeat the symbol).
  // If nothing is detected, default to USD — matches the most common English
  // test receipts. Receipts that include ₸/тг/тенге get tagged as KZT and
  // skip conversion entirely.
  const sourceCurrency = detectCurrency(text) || 'USD';

  const lineConfidence = {};
  for (const w of ocrResult.data?.words || []) {
    const ln = w.line?.text || '';
    if (!lineConfidence[ln]) lineConfidence[ln] = { sum: 0, count: 0 };
    lineConfidence[ln].sum += w.confidence || 0;
    lineConfidence[ln].count += 1;
  }

  const items = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 3) continue;
    if (isNoise(line)) continue;

    const priceMatch = line.match(TOTAL_PRICE_RE);
    if (!priceMatch) continue;
    const price = priceMatch[1].replace(',', '.');

    let name = cleanName(line);
    if (!name || name.length < 2) continue;
    if (!/[a-zA-Zа-яА-ЯёЁ]/.test(name)) continue;
    if (looksLikeGarbage(name)) continue;

    // Russian item → translate to English so ML filtering and recipe
    // recommendations can match it. Original kept in `originalName`.
    let originalName = null;
    const translated = translateRuToEn(name);
    if (translated) {
      originalName = name;
      name = translated;
    }

    const lineConfData = lineConfidence[rawLine] || lineConfidence[line];
    const ocrConf = lineConfData ? lineConfData.sum / lineConfData.count : 75;
    const structConf = structureConfidence(name, true);
    const confidence = Math.round(0.5 * ocrConf + 0.5 * structConf);

    const category = classifyCategory(name);
    const expiryDate = defaultExpiryFor(category);

    items.push({
      name,
      price,
      expiryDate,
      confidence: Math.min(99, Math.max(40, confidence)),
      category,
      quantity: 1,
      unit: 'pcs',
      ...(originalName ? { originalName } : {}),
    });
  }

  // Convert all prices to integer tenge. Preserves originalPrice +
  // originalCurrency so the UI / DB can show "was $3.49 → 1675 ₸" if it wants.
  // Live rates from open.er-api.com (cached 12h); on timeout fallback rates
  // kick in so the scanner never breaks.
  await convertItemsToKzt(items, sourceCurrency);

  return items;
}
