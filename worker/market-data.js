// Cloudflare Worker: worker/market-data.js
// Uses TWELVEDATA_API_KEY bound as a secret via Wrangler.

const SYMBOL_SEARCH_URL = 'https://api.twelvedata.com/symbol_search';
const QUOTE_URL = 'https://api.twelvedata.com/quote';

const SYMBOL_MAP_PREF = {
  EURUSD: ['EUR/USD', 'EURUSD'],
  USDJPY: ['USD/JPY', 'USDJPY'],
  USDZAR: ['USD/ZAR', 'USDZAR'],
  XAUUSD: ['XAU/USD', 'XAUUSD'],
  OIL: ['WTI', 'CL', 'BRENT', 'OIL'],
  NDX: ['NDX', 'NAS100', 'NASDAQ:NDX'],
  BTCUSD: ['BTC/USD', 'BTCUSD']
};

const symbolCache = new Map();
const quoteCache = new Map();

function now() { return Date.now(); }

function prettyName(id) {
  switch (id) {
    case 'EURUSD': return 'EUR/USD';
    case 'USDJPY': return 'USD/JPY';
    case 'USDZAR': return 'USD/ZAR';
    case 'XAUUSD': return 'Gold';
    case 'OIL': return 'Oil';
    case 'NDX': return 'NASDAQ 100';
    case 'BTCUSD': return 'Bitcoin';
    default: return id;
  }
}

async function resolveProviderSymbol(id, apiKey) {
  const key = id.toUpperCase();
  const cached = symbolCache.get(key);
  if (cached && (now() - cached.ts) < 24 * 3600 * 1000) return cached.sym;

  const candidates = SYMBOL_MAP_PREF[key] || [key];
  for (const q of candidates) {
    const url = `${SYMBOL_SEARCH_URL}?symbol=${encodeURIComponent(q)}&apikey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || json.symbols || []);
      if (Array.isArray(list) && list.length) {
        const sym = list[0].symbol || list[0].symbol_code || list[0].symbol_name;
        if (sym) {
          symbolCache.set(key, { sym, ts: now() });
          return sym;
        }
      }
      if (json && json.symbol) {
        symbolCache.set(key, { sym: json.symbol, ts: now() });
        return json.symbol;
      }
    } catch (e) {
      /* ignore */
    }
  }

  const fallback = candidates[0];
  symbolCache.set(key, { sym: fallback, ts: now() });
  return fallback;
}

function normalizeQuoteRecord(id, providerSym, r) {
  if (!r) return { id, symbol: providerSym, name: prettyName(id) };
  const price = r.price != null ? parseFloat(r.price) : null;
  const previousClose = r.previous_close != null ? parseFloat(r.previous_close) : null;
  const change = (price != null && previousClose != null) ? (price - previousClose) : (r.change != null ? parseFloat(r.change) : null);
  const changePercent = r.percent_change != null ? parseFloat(r.percent_change) : (previousClose ? (change / previousClose) * 100 : null);
  return {
    id,
    symbol: providerSym,
    name: prettyName(id),
    price: isNaN(price) ? null : price,
    previousClose: isNaN(previousClose) ? null : previousClose,
    change: isNaN(change) ? null : change,
    changePercent: isNaN(changePercent) ? null : changePercent,
    marketStatus: (r && (r.status || (r.is_market_open ? (r.is_market_open ? 'OPEN' : 'CLOSED') : null))) || 'N/A',
    timestamp: r && (r.datetime || r.timestamp) ? (r.datetime || new Date(parseInt(r.timestamp, 10) * 1000).toISOString()) : new Date().toISOString()
  };
}

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const apiKey = TWELVEDATA_API_KEY;
  if (!apiKey) return new Response('TWELVEDATA_API_KEY not configured', { status: 500 });

  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get('symbols') || '';
  const ids = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : Object.keys(SYMBOL_MAP_PREF);

  const providerSymbols = [];
  const idToProvider = {};
  for (const id of ids) {
    const providerSym = await resolveProviderSymbol(id, apiKey);
    if (providerSym) {
      providerSymbols.push(providerSym);
      idToProvider[id] = providerSym;
    }
  }

  const cacheKey = providerSymbols.join(',');
  const cached = quoteCache.get(cacheKey);
  if (cached && (now() - cached.ts) < 20 * 1000) {
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], cached.data[idToProvider[id]] || cached.data[id]));
    return new Response(JSON.stringify(normalized), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  const fetchUrl = `${QUOTE_URL}?symbol=${encodeURIComponent(providerSymbols.join(','))}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(fetchUrl, { headers: { Accept: 'application/json' } });
  if (res.status === 429) return new Response('Rate limited', { status: 429 });
  if (!res.ok) return new Response('Provider error', { status: res.status });

  const raw = await res.json();
  const rawMap = {};
  if (Array.isArray(raw)) raw.forEach(r => { if (r && r.symbol) rawMap[r.symbol] = r; });
  else if (raw && typeof raw === 'object') { Object.keys(raw).forEach(k => { rawMap[k] = raw[k]; }); if (raw.symbol && !rawMap[raw.symbol]) rawMap[raw.symbol] = raw; }

  quoteCache.set(cacheKey, { data: rawMap, ts: now() });
  const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], rawMap[idToProvider[id]] || rawMap[id]));
  return new Response(JSON.stringify(normalized), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
