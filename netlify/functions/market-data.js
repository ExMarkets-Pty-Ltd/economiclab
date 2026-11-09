// Netlify Function: market-data
// Uses Twelve Data via server-side environment variable TWELVEDATA_API_KEY.
// Uses verified provider symbols directly to avoid charging symbol-search credits on every cold start.

const fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;

const QUOTE_URL = process.env.TWELVEDATA_API_URL_QUOTE || 'https://api.twelvedata.com/quote';
const PRICE_URL = process.env.TWELVEDATA_API_URL_PRICE || 'https://api.twelvedata.com/price';
const EXCHANGE_RATE_URL = process.env.TWELVEDATA_API_URL_EXCHANGE_RATE || 'https://api.twelvedata.com/exchange_rate';

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
  USDIndex: ['USDINDEX', 'DXY', 'USD'],
  BTCUSD: ['BTC/USD', 'BTCUSD']
};

const quoteCache = { value: {}, ttl: 20 * 1000 };
function now() { return Date.now(); }

function jsonHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    ...extra
  };
}

function resolveProviderSymbol(id) {
  const candidates = SYMBOL_MAP_PREF[id] || [id];
  return candidates[0] || '';
}

function successHeaders() {
  return jsonHeaders({
    'Cache-Control': 'public, max-age=20, s-maxage=60, stale-while-revalidate=30'
  });
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

function normalizeTimestamp(record) {
  const value = record && (record.datetime != null ? record.datetime : record.timestamp);
  if (value == null || value === '') return null;

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    const milliseconds = text.length === 10 ? numeric * 1000 : numeric;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getCurrentPriceFromRecord(r) {
  if (!r || typeof r !== 'object') return null;

  const candidates = [
    r.price,
    r.rate,
    r.last,
    r.close,
    r.value,
    r.data && r.data.price,
    r.data && r.data.rate,
    r.data && r.data.last,
    r.data && r.data.close,
    r.data && r.data.value
  ];

  for (const value of candidates) {
    const numeric = getNumericPrice(value);
    if (numeric != null) return numeric;
  }
  return null;
}

function normalizeQuoteRecord(id, providerSym, r) {
  if (!r) return { id, symbol: providerSym, name: prettyName(id) };
  const price = getCurrentPriceFromRecord(r);
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
    timestamp: normalizeTimestamp(r)
  };
}

function getNestedValue(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return null;
}

function isForexSymbol(symbol) {
  return typeof symbol === 'string' && /^[A-Z]{3}\/[A-Z]{3}$/.test(symbol.toUpperCase());
}

function getNumericPrice(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coerceQuotePayload(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload.data && typeof payload.data === 'object') {
    const data = payload.data;
    if (Array.isArray(data)) return data[0] || null;
    return data;
  }
  return payload;
}

async function fetchQuoteWithForexFallback(apiKey, symbol) {
  const quoteSymbol = String(symbol || '').trim();
  if (!quoteSymbol) return null;

  const quoteUrl = `${QUOTE_URL}?symbol=${encodeURIComponent(quoteSymbol)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetchFn(quoteUrl, { headers: { Accept: 'application/json' } });
    if (!response || !response.ok) {
      const detail = response && typeof response.text === 'function' ? await response.text().catch(() => '') : '';
      console.warn('Twelve Data quote request failed', { status: response ? response.status : 'unknown', symbol: quoteSymbol, detail: detail ? String(detail).slice(0, 200) : '' });
      return null;
    }

    const payload = await response.json();
    const primary = coerceQuotePayload(payload);
    const primaryPrice = getNumericPrice(getNestedValue(primary, ['price', 'last', 'close', 'rate']));
    if (primaryPrice != null) {
      return primary;
    }

    if (!isForexSymbol(quoteSymbol)) {
      return primary;
    }

    const fallbackUrls = [
      `${PRICE_URL}?symbol=${encodeURIComponent(quoteSymbol)}&apikey=${encodeURIComponent(apiKey)}`,
      `${EXCHANGE_RATE_URL}?symbol=${encodeURIComponent(quoteSymbol)}&apikey=${encodeURIComponent(apiKey)}`
    ];

    for (const fallbackUrl of fallbackUrls) {
      try {
        const fallbackResponse = await fetchFn(fallbackUrl, { headers: { Accept: 'application/json' } });
        if (!fallbackResponse || !fallbackResponse.ok) {
          const fallbackText = fallbackResponse && typeof fallbackResponse.text === 'function' ? await fallbackResponse.text().catch(() => '') : '';
          console.warn('Twelve Data forex fallback failed', { status: fallbackResponse ? fallbackResponse.status : 'unknown', symbol: quoteSymbol, detail: fallbackText ? String(fallbackText).slice(0, 200) : '' });
          continue;
        }

        const fallbackPayload = await fallbackResponse.json();
        const fallbackRaw = coerceQuotePayload(fallbackPayload);
        const fallbackPrice = getCurrentPriceFromRecord(fallbackRaw);
        if (fallbackPrice != null) {
          const merged = {
            ...(fallbackRaw || {}),
            price: fallbackPrice,
            previous_close: getNestedValue(fallbackRaw, ['previous_close', 'previousClose', 'close']) ?? getNestedValue(primary, ['previous_close', 'previousClose', 'close']) ?? null,
            datetime: getNestedValue(fallbackRaw, ['datetime', 'timestamp', 'date']) ?? getNestedValue(primary, ['datetime', 'timestamp', 'date']) ?? null,
            status: getNestedValue(fallbackRaw, ['status']) ?? getNestedValue(primary, ['status']) ?? 'OPEN'
          };
          return merged;
        }
      } catch (e) {
        console.warn('Twelve Data forex fallback error', { symbol: quoteSymbol, message: e && e.message ? String(e.message).slice(0, 200) : 'unknown error' });
      }
    }

    return primary;
  } catch (e) {
    console.warn('Twelve Data quote request error', { symbol: quoteSymbol, message: e && e.message ? String(e.message).slice(0, 200) : 'unknown error' });
    return null;
  }
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
    const providerSym = directSymbol.includes('/') ? directSymbol : resolveProviderSymbol(id);

    try {
      const raw = await fetchQuoteWithForexFallback(apiKey, providerSym);
      if (!raw || (raw && raw.code)) {
        return {
          statusCode: 404,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: 'No quote available for the requested symbol.' })
        };
      }

      const normalized = [normalizeQuoteRecord(id, providerSym, raw)];
      return { statusCode: 200, headers: successHeaders(), body: JSON.stringify(normalized) };
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
    const providerSym = resolveProviderSymbol(id);
    if (providerSym) {
      providerSymbols.push(providerSym);
      idToProvider[id] = providerSym;
    }
  }

  const cacheKey = providerSymbols.join(',');
  const qcached = quoteCache.value[cacheKey];
  if (qcached && (now() - qcached.ts) < quoteCache.ttl) {
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], qcached.data[idToProvider[id]] || qcached.data[id]));
    return { statusCode: 200, headers: successHeaders(), body: JSON.stringify(normalized) };
  }

  try {
    const rawMap = {};
    let successfulQuotes = 0;

    for (const providerSym of providerSymbols) {
      const quoteRecord = await fetchQuoteWithForexFallback(apiKey, providerSym);
      if (quoteRecord) {
        rawMap[providerSym] = quoteRecord;
        successfulQuotes += 1;
      }
    }

    if (!successfulQuotes) {
      return {
        statusCode: 502,
        headers: jsonHeaders(),
        body: JSON.stringify({ error: 'Market data provider returned no usable quotes.' })
      };
    }

    quoteCache.value[cacheKey] = { data: rawMap, ts: now() };
    const normalized = ids.map(id => normalizeQuoteRecord(id, idToProvider[id], rawMap[idToProvider[id]] || rawMap[id]));
    return { statusCode: 200, headers: successHeaders(), body: JSON.stringify(normalized) };
  } catch (e) {
    console.error('market-data error', e);
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Market data provider request failed.' })
    };
  }
};