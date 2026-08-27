EconomicLab — Serverless Market-Data Proxy

Purpose

This document explains how to deploy a secure serverless proxy that the EconomicLab frontend can call to obtain normalized market data for the homepage market cards. The proxy holds any provider API key in server-side environment variables so that no secret is exposed in the browser or repository.

Goals

- Provide a single batch endpoint the client can call (no provider key in browser).
- Normalize provider responses into a stable JSON format the site expects.
- Apply light caching and rate-limit protection server-side.
- Make symbol mapping explicit and editable without changing the frontend.

Security reminder

Do NOT store API keys in the repository or in client code. Use serverless environment variables (Netlify/Vercel/Cloudflare Workers secrets, AWS Lambda env vars, etc.).

Expected client → proxy contract

Request: GET /.netlify/functions/market-data?symbols=EURUSD,USDJPY,USDZAR

Response: 200 OK
Content-Type: application/json

[
  {
    "id": "EURUSD",
    "symbol": "OANDA:EURUSD",          // optional provider-specific string
    "name": "EUR/USD",
    "price": 1.23456,
    "previousClose": 1.23000,
    "change": 0.00456,
    "changePercent": 0.3707,
    "marketStatus": "OPEN",
    "timestamp": "2026-08-10T12:34:56Z"
  },
  ...
]

The client expects an array. Each object should contain the fields shown (missing optional fields are acceptable but cards will show 'temporarily unavailable' when critical values are absent).

Provider selection and symbol mapping

- Choose one provider that covers FX, commodities (XAU), oil, indices (NASDAQ 100), and crypto (BTC/USD). Examples to consider: Twelve Data, Finnhub, or a paid tier of another provider. Check the provider's docs for symbol formats and licensing.
- Do NOT guess provider-specific symbol strings in the proxy. Confirm via the provider docs or dashboard, then put the correct provider symbol in `SYMBOL_MAP` in the proxy.

Example: SYMBOL_MAP (server-side)

const SYMBOL_MAP = {
  EURUSD: 'OANDA:EURUSD',   // replace with the provider's official symbol
  USDJPY: 'OANDA:USDJPY',
  USDZAR: 'FX_IDC:USDZAR',
  XAUUSD: 'OANDA:XAUUSD',
  OIL: 'NYMEX:CL1!',        // choose the oil benchmark you want (WTI/Brent)
  NDX: 'INDEX:NDX',
  BTCUSD: 'COINBASE:BTCUSD'
};

Replace all right-hand values with the provider's exact symbols.

Netlify Functions (Node) — example

File: `netlify/functions/market-data.js`

// NOTE: replace PROVIDER_URL and normalization code with the provider you choose.
const fetch = require('node-fetch');

const SYMBOL_MAP = {
  // Update these to the provider's official symbols
  EURUSD: 'EURUSD',
  USDJPY: 'USDJPY',
  USDZAR: 'USDZAR',
  XAUUSD: 'XAUUSD',
  OIL: 'CL',
  NDX: 'NDX',
  BTCUSD: 'BTCUSD'
};

exports.handler = async function(event) {
  const qs = event.queryStringParameters || {};
  const symbolsParam = qs.symbols || '';
  const ids = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : Object.keys(SYMBOL_MAP);

  if (!process.env.PROVIDER_API_KEY) {
    return { statusCode: 500, body: 'Provider API key not configured' };
  }

  // Map our ids to provider symbols
  const providerSymbols = ids.map(id => SYMBOL_MAP[id]).filter(Boolean);
  if (!providerSymbols.length) return { statusCode: 400, body: 'No valid symbols' };

  try {
    // Example provider call (replace with provider's batch/quote endpoint)
    // e.g. const url = `https://api.provider.com/v1/quotes?symbols=${providerSymbols.join(',')}&apikey=${process.env.PROVIDER_API_KEY}`;
    const url = process.env.PROVIDER_URL + '?symbols=' + encodeURIComponent(providerSymbols.join(',')) + '&apikey=' + encodeURIComponent(process.env.PROVIDER_API_KEY);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429) return { statusCode: 429, headers: corsHeaders(), body: 'Rate limited' };
    if (!res.ok) return { statusCode: res.status, headers: corsHeaders(), body: 'Provider error' };
    const raw = await res.json();

    // Normalize: provider-specific parsing goes here
    // Below is a placeholder normalization loop — adapt to your provider's response format
    const normalized = ids.map(id => {
      const providerSym = SYMBOL_MAP[id];
      const r = findProviderRecord(raw, providerSym); // implement findProviderRecord
      if (!r) return { id, symbol: providerSym, name: prettyName(id) };
      return {
        id,
        symbol: providerSym,
        name: prettyName(id),
        price: r.price,
        previousClose: r.previousClose,
        change: r.price != null && r.previousClose != null ? (r.price - r.previousClose) : (r.change || null),
        changePercent: r.percent != null ? r.percent : (r.price != null && r.previousClose ? ((r.price - r.previousClose) / r.previousClose) * 100 : null),
        marketStatus: r.marketStatus || 'N/A',
        timestamp: r.timestamp || new Date().toISOString()
      };
    });

    return {
      statusCode: 200,
      headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(), cacheHeaders()),
      body: JSON.stringify(normalized)
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: corsHeaders(), body: 'Server error' };
  }
};

function corsHeaders(){ return { 'Access-Control-Allow-Origin': '*'}; }
function cacheHeaders(){ return { 'Cache-Control': 'max-age=30, s-maxage=60' }; }
function prettyName(id){
  switch(id){
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

// Implement provider-specific lookup depending on response structure
function findProviderRecord(raw, providerSym){
  // Example: if provider returns { 'EURUSD': {...}, 'BTCUSD': {...} }
  if (!raw) return null;
  if (raw[providerSym]) return raw[providerSym];
  // If provider returns array, find by symbol
  if (Array.isArray(raw)) return raw.find(r => (r.symbol || '').toUpperCase() === providerSym.toUpperCase());
  return null;
}


Vercel Serverless Function (Node)

- Vercel functions are similar; place an `api/market-data.js` file and use `module.exports = async (req, res) => { ... }` with `process.env.PROVIDER_API_KEY`.

Cloudflare Worker example (lightweight JS)

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request){
  const url = new URL(request.url);
  const ids = (url.searchParams.get('symbols') || '').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  const SYMBOL_MAP = {/* same mapping as above */};
  const providerSymbols = ids.map(id => SYMBOL_MAP[id]).filter(Boolean);
  if (!providerSymbols.length) return new Response('No symbols', { status: 400 });

  const PROVIDER_URL = PROV_URL_FROM_ENV(); // set via Wrangler secrets and substitute here
  const PROVIDER_API_KEY = PROV_KEY_FROM_ENV();

  const fetchUrl = PROVIDER_URL + '?symbols=' + encodeURIComponent(providerSymbols.join(',')) + '&apikey=' + encodeURIComponent(PROVIDER_API_KEY);
  const res = await fetch(fetchUrl, { headers: { Accept: 'application/json' } });
  const raw = await res.json();

  const normalized = ids.map(id => { /* normalize like Netlify example */ });
  return new Response(JSON.stringify(normalized), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

Deployment & environment variables

- Netlify: set `PROVIDER_API_KEY` and `PROVIDER_URL` in Site settings → Build & deploy → Environment. Functions deploy from `netlify/functions/`.
- Vercel: set `PROVIDER_API_KEY` and `PROVIDER_URL` in Project Settings → Environment Variables. Place function under `api/`.
- Cloudflare Workers: use `wrangler secret put PROVIDER_API_KEY` or you can bind to KV or environment.

Local testing

1. Deploy your function and obtain its public URL, e.g. `https://exmarkets-proxy.example.com/market-data`.
2. Test with curl:

```bash
curl 'https://exmarkets-proxy.example.com/market-data?symbols=EURUSD,USDJPY'
```

3. Point the frontend to the endpoint in the browser console for testing:

```js
window.ExMarketsMarketData.setEndpoint('https://exmarkets-proxy.example.com/market-data')
```

CORS & caching

- The proxy must set `Access-Control-Allow-Origin` (prefer restricting origin to your site in production). For local testing `*` is acceptable.
- Use server-side caching and short `Cache-Control` headers to reduce provider calls (e.g., 30s–5m depending on plan and allowable latency). The client already refreshes every 5 minutes; server can cache 30–60s for bursting protection.

Rate-limit & backoff

- Respect provider rate limits—use server-side caching, batch requests and an exponential backoff on 429 responses.
- Log provider 429s and gradually increase cache TTL if limits are hit.

Testing checklist (before publishing)

- Verify `SYMBOL_MAP` values exactly match provider symbols. Do not guess them; consult provider docs.
- Confirm provider endpoints & fields (price, previous close, timestamp) and adapt normalization code.
- Deploy the proxy with environment variables and test `curl` responses.
- Set the client `window.ExMarketsMarketData.setEndpoint(...)` to the deployed URL and verify all 7 cards populate correctly.
- Confirm no API key is visible in page source or network calls.
- Test the site in light/dark theme and mobile/desktop.

Support

If you tell me which provider you'd like (Twelve Data, Finnhub, Alpha Vantage, etc.) I can:
- Provide a concrete, fully working serverless function implementation for that provider.
- Provide exact `SYMBOL_MAP` entries based on the provider's documented symbols.
- Give deployment instructions tailored to Netlify/Vercel/Cloudflare with commands and env var names.

