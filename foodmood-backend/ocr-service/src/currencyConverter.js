// Currency conversion utilities for OCR-parsed receipts.
//
// Strategy:
//   - Detect source currency from the raw receipt text (symbols + ISO codes + words).
//   - Convert prices to KZT (Kazakhstani tenge) using rates from a free public API
//     (open.er-api.com — no API key required, generous free tier).
//   - Cache rates in memory for 12h to avoid hammering the API.
//   - Fall back to hardcoded approximate rates (May 2026) if the API is unreachable
//     so the scanner never breaks.

// Approximate rates as of May 2026 — used only when the live API is unreachable.
const FALLBACK_RATES = {
  USD_KZT: 480,
  RUB_KZT: 5.5,
  EUR_KZT: 520,
  KZT_KZT: 1,
};

const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
let cache = { rates: null, fetchedAt: 0 };

// Fetch fresh KZT rates from the free open.er-api.com endpoint.
// API returns: { result: 'success', base_code: 'USD', rates: { KZT: 480.5, RUB: 87.2, ... } }
async function fetchRatesFromApi() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`exchange API status ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('exchange API returned non-success payload');
    }
    const kztPerUsd = data.rates.KZT;
    const rubPerUsd = data.rates.RUB;
    const eurPerUsd = data.rates.EUR;
    if (!kztPerUsd) throw new Error('exchange API missing KZT rate');
    return {
      USD_KZT: kztPerUsd,
      // USD → RUB → KZT  ===  (1 / RUB-per-USD) * KZT-per-USD
      RUB_KZT: rubPerUsd ? kztPerUsd / rubPerUsd : FALLBACK_RATES.RUB_KZT,
      EUR_KZT: eurPerUsd ? kztPerUsd / eurPerUsd : FALLBACK_RATES.EUR_KZT,
      KZT_KZT: 1,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getRatesToKzt() {
  const now = Date.now();
  if (cache.rates && now - cache.fetchedAt < TTL_MS) return cache.rates;
  try {
    const rates = await fetchRatesFromApi();
    cache = { rates, fetchedAt: now };
    return rates;
  } catch (err) {
    console.warn('[currency] live rates failed, using fallback:', err.message);
    return FALLBACK_RATES;
  }
}

// Detect currency from raw receipt text. Returns ISO code or null when unknown.
export function detectCurrency(text) {
  const t = String(text || '');
  // Order matters — check KZT first because Kazakh receipts often also include $ in totals.
  if (/[₸]|\bKZT\b|\bтг\.?\b|тенге/i.test(t)) return 'KZT';
  if (/[₽]|\bRUB\b|\bруб(?:ль|лей|\.|\b)/i.test(t)) return 'RUB';
  if (/[€]|\bEUR\b|\beuros?\b|\bевро\b/i.test(t)) return 'EUR';
  if (/[$]|\bUSD\b|\bUS\$|\bdollars?\b|\bдоллар/i.test(t)) return 'USD';
  return null;
}

// Convert one price (number or numeric string) to integer tenge.
export async function convertPriceToKzt(price, fromCurrency) {
  const n = typeof price === 'number' ? price : parseFloat(String(price).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (!fromCurrency || fromCurrency === 'KZT') return Math.round(n);
  const rates = await getRatesToKzt();
  const rate = rates[`${fromCurrency}_KZT`];
  if (!rate) return Math.round(n);
  return Math.round(n * rate);
}

// Bulk-convert an array of parsed items in-place, attaching original-currency metadata.
// items: [{ price: string, ... }]
export async function convertItemsToKzt(items, sourceCurrency) {
  if (!items || items.length === 0) return items;
  const currency = sourceCurrency || 'USD';
  if (currency === 'KZT') {
    for (const it of items) {
      const n = parseFloat(String(it.price).replace(',', '.'));
      it.price = Number.isFinite(n) ? String(Math.round(n)) : it.price;
      it.currency = 'KZT';
    }
    return items;
  }
  const rates = await getRatesToKzt();
  const rate = rates[`${currency}_KZT`] || 1;
  for (const it of items) {
    const original = parseFloat(String(it.price).replace(',', '.'));
    if (!Number.isFinite(original)) continue;
    const kzt = Math.round(original * rate);
    it.originalPrice = original.toFixed(2);
    it.originalCurrency = currency;
    it.price = String(kzt);
    it.currency = 'KZT';
  }
  return items;
}
