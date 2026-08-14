// Vercel Serverless Function: api/market-data.js
// Uses TWELVEDATA_API_KEY env variable. Resolves provider symbols via symbol_search and caches mappings.

const { MarketDataApi, CreateConfig } = require('@twelvedata/twelvedata-node');
const fetchFn = globalThis.fetch || require('node-fetch');

const SYMBOL_SEARCH_URL = process.env.TWELVEDATA_API_URL_SYMBOL_SEARCH || 'https://api.twelvedata.com/symbol_search';

const SYMBOL_MAP_PREF = {
  EURUSD: ['EUR/USD', 'EURUSD'],
  GBPUSD: ['GBP/USD', 'GBPUSD'],
  AUDUSD: ['AUD/USD', 'AUDUSD'],
  NZDUSD: ['NZD/USD', 'NZDUSD'],
  USDJPY: ['USD/JPY', 'USDJPY'],
  USDCHF: ['USD/CHF', 'USDCHF'],
  USDCAD: ['USD/CAD', 'USDCAD'],
  USDZAR: ['USD/ZAR', 'USDZAR'],
  XAUUSD: ['XAU/USD', 'XAUUSD'],
  USOIL: ['CL', 'WTI', 'OIL', 'USOIL'],
  USDIndex: ['DXY', 'USD', 'USDINDEX'],
  BTCUSD: ['BTC/USD', 'BTCUSD']
};

const symbolCache = { value: {}, ttl: 24 * 3600 * 1000 };
const quoteCache = { value: {}, ttl: 20 * 1000 };
let marketDataApi = null;

function now() { return Date.now(); }

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

function prettyName(id) {
  switch (id) {
    case 'EURUSD': return 'EUR/USD';
    case 'GBPUSD': return 'GBP/USD';
    case 'AUDUSD': return 'AUD/USD';
    case 'NZDUSD': return 'NZD/USD';
    case 'USDJPY': return 'USD/JPY';
    case 'USDCHF': return 'USD/CHF';
    case 'USDCAD': return 'USD/CAD';
    case 'USDZAR': return 'USD/ZAR';
    case 'XAUUSD': return 'Gold';
    case 'USOIL': return 'USOIL';
    case 'USDIndex': return 'USDIndex';
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

module.exports = async (req, res) => {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return res.status(500).send('Twelve Data API key not configured (TWELVEDATA_API_KEY)');

  const symbolsParam = (req.query.symbols || '');
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
  const qcached = quoteCache.value[cacheKey];
  if (qcached && (now() - qcached.ts) < quoteCache.ttl) {
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], qcached.data[idToProvider[id]] || qcached.data[id]));
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json(normalized);
  }

  try {
    const api = getMarketDataApi(apiKey);
    const raw = await api.getQuote({ symbol: providerSymbols.join(',') });

    const rawMap = {};
    if (Array.isArray(raw)) raw.forEach(r => { if (r && r.symbol) rawMap[r.symbol] = r; });
    else if (raw && typeof raw === 'object') { Object.keys(raw).forEach(k => { rawMap[k] = raw[k]; }); if (raw.symbol && !rawMap[raw.symbol]) rawMap[raw.symbol] = raw; }

    quoteCache.value[cacheKey] = { data: rawMap, ts: now() };
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], rawMap[idToProvider[id]] || rawMap[id]));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(normalized);
  } catch (e) {
    console.error('market-data error', e);
    res.status(500).send('Server error');
  }
};