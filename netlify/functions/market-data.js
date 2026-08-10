// Netlify Function: market-data
// Uses Twelve Data via server-side environment variable TWELVEDATA_API_KEY.
// Resolves provider symbols via symbol_search and caches mappings.

const { MarketDataApi, CreateConfig } = require('@twelvedata/twelvedata-node');
const fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;

const SYMBOL_SEARCH_URL = process.env.TWELVEDATA_API_URL_SYMBOL_SEARCH || 'https://api.twelvedata.com/symbol_search';
const QUOTE_URL = process.env.TWELVEDATA_API_URL_QUOTE || 'https://api.twelvedata.com/quote';

const SYMBOL_MAP_PREF = {
  EURUSD: ['EUR/USD', 'EURUSD'],
  USDJPY: ['USD/JPY', 'USDJPY'],
  USDZAR: ['USD/ZAR', 'USDZAR'],
  XAUUSD: ['XAU/USD', 'XAUUSD'],
  OIL: ['WTI', 'CL', 'BRENT', 'OIL'],
  NDX: ['NDX', 'NAS100', 'NASDAQ:NDX'],
  BTCUSD: ['BTC/USD', 'BTCUSD']
};

const symbolCache = { value: {}, ttl: 24 * 3600 * 1000 };
const quoteCache = { value: {}, ttl: 20 * 1000 };
let marketDataApi = null;

function now() { return Date.now(); }

function jsonHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    ...extra
  };
}

function getMarketDataApi(apiKey) {
  if (!marketDataApi) {
    const config = CreateConfig(apiKey);
    marketDataApi = new MarketDataApi(config);
  }
  return marketDataApi;
}

async function resolveProviderSymbol(id, apiKey) {
  const key = id.toUpperCase();
  const cached = symbolCache.value[key];
  if (cached && (now() - cached.ts) < symbolCache.ttl) return cached.sym;

  const candidates = SYMBOL_MAP_PREF[key] || [key];
  for (const q of candidates) {
    const url = `${SYMBOL_SEARCH_URL}?symbol=${encodeURIComponent(q)}&apikey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetchFn(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || json.symbols || []);
      if (Array.isArray(list) && list.length) {
        const sym = list[0].symbol || list[0].symbol_code || list[0].symbol_name;
        if (sym) {
          symbolCache.value[key] = { sym, ts: now() };
          return sym;
        }
      }
      if (json && json.symbol) {
        symbolCache.value[key] = { sym: json.symbol, ts: now() };
        return json.symbol;
      }
    } catch (e) {
      console.warn('symbol_search error', e);
    }
  }

  const fallback = candidates[0];
  symbolCache.value[key] = { sym: fallback, ts: now() };
  return fallback;
}

function normalizeMarketId(value) {
  if (value == null) return '';
  const text = String(value).trim();
  const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';

  for (const [id, candidates] of Object.entries(SYMBOL_MAP_PREF)) {
    const known = [id, ...(candidates || [])].map(s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, ''));
    if (known.includes(compact)) return id;
  }
  return compact;
}

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

exports.handler = async function(event) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Twelve Data API key not configured (TWELVEDATA_API_KEY)' })
    };
  }

  const qs = event.queryStringParameters || {};
  const directSymbol = qs.symbol ? String(qs.symbol).trim() : '';
  const isDirectQuoteRequest = !!directSymbol && (directSymbol.includes('/') || !!normalizeMarketId(directSymbol));

  if (isDirectQuoteRequest) {
    const id = normalizeMarketId(directSymbol) || directSymbol.toUpperCase();
    const providerSym = directSymbol.includes('/') ? directSymbol : await resolveProviderSymbol(id, apiKey);
    const quoteUrl = `${QUOTE_URL}?symbol=${encodeURIComponent(providerSym)}&apikey=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetchFn(quoteUrl, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const errorJson = await response.text().catch(() => '');
        console.error('Twelve Data quote request failed', response.status, errorJson);
        return {
          statusCode: response.status >= 500 ? 502 : 400,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: 'Twelve Data quote request failed.' })
        };
      }

      const payload = await response.json();
      const raw = Array.isArray(payload) ? payload[0] : (payload && payload.data ? payload.data : payload);
      if (!raw || (payload && payload.code)) {
        return {
          statusCode: 404,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: 'No quote available for the requested symbol.' })
        };
      }

      const normalized = [normalizeQuoteRecord(id, providerSym, raw)];
      return { statusCode: 200, headers: jsonHeaders(), body: JSON.stringify(normalized) };
    } catch (e) {
      console.error('market-data direct quote error', e);
      return {
        statusCode: 502,
        headers: jsonHeaders(),
        body: JSON.stringify({ error: 'Market data quote request failed.' })
      };
    }
  }

  const symbolsParam = qs.symbols || '';
  const ids = symbolsParam ? symbolsParam.split(',').map(s => normalizeMarketId(s) || s.trim().toUpperCase()) : Object.keys(SYMBOL_MAP_PREF);

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
  const qcached = quoteCache.value[cacheKey];
  if (qcached && (now() - qcached.ts) < quoteCache.ttl) {
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], qcached.data[idToProvider[id]] || qcached.data[id]));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(normalized) };
  }

  try {
    const api = getMarketDataApi(apiKey);
    const raw = await api.getQuote({ symbol: providerSymbols.join(',') });

    const rawMap = {};
    if (Array.isArray(raw)) {
      raw.forEach(r => { if (r && r.symbol) rawMap[r.symbol] = r; });
    } else if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(k => { rawMap[k] = raw[k]; });
      if (raw.symbol && !rawMap[raw.symbol]) rawMap[raw.symbol] = raw;
    }

    quoteCache.value[cacheKey] = { data: rawMap, ts: now() };
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], rawMap[idToProvider[id]] || rawMap[id]));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(normalized) };
  } catch (e) {
    console.error('market-data error', e);
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Market data provider request failed.' })
    };
  }
};