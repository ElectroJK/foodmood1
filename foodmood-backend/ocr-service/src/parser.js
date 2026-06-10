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
  const letters = name.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return true;

  // 3+ consecutive identical letters → very rare in real words
  if (/([a-zA-Z])\1{2,}/i.test(name)) return true;

  // Very low vowel ratio
  const vowels = letters.match(/[aeiouy]/gi)?.length || 0;
  if (vowels / letters.length < 0.15) return true;

  // Many 1- and 2-char tokens suggests OCR noise like "k m d x"
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    const tiny = tokens.filter((t) => t.replace(/[^a-zA-Z]/g, '').length <= 2).length;
    if (tiny / tokens.length > 0.5) return true;
  }

  return false;
}

function cleanName(raw) {
  let s = raw.replace(TOTAL_PRICE_RE, '');
  for (const re of NAME_STRIPPERS) s = s.replace(re, ' ');
  return s
    .replace(/\s{2,}/g, ' ')
    .replace(/^[^a-zA-Z]+/, '')
    .replace(/[^a-zA-Z0-9\s]+$/, '')
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
  if (/[a-zA-Z]/.test(name)) score += 20;
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

    const name = cleanName(line);
    if (!name || name.length < 2) continue;
    if (!/[a-zA-Z]/.test(name)) continue;
    if (looksLikeGarbage(name)) continue;

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
    });
  }

  // Convert all prices to integer tenge. Preserves originalPrice +
  // originalCurrency so the UI / DB can show "was $3.49 → 1675 ₸" if it wants.
  // Live rates from open.er-api.com (cached 12h); on timeout fallback rates
  // kick in so the scanner never breaks.
  await convertItemsToKzt(items, sourceCurrency);

  return items;
}
