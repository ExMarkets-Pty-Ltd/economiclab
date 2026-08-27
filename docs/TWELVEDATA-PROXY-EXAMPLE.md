Twelve Data — Serverless Proxy Example for EconomicLab

This document provides a ready-to-adapt serverless proxy implementation for Twelve Data. It keeps the API key server-side and returns a normalized array the frontend expects.

Important: I attempted to fetch Twelve Data docs from the public site but could not retrieve them in this environment. The code below is written against Twelve Data's common `/quote` batch endpoint pattern. Please verify the provider symbols in `SYMBOL_MAP` against the official Twelve Data docs or dashboard before deploying.

Environment variables

- `TWELVEDATA_API_KEY` — your Twelve Data API key (set in your serverless provider's environment secrets)
- `TWELVEDATA_API_URL` — optional override, default `https://api.twelvedata.com/quote`

Recommended symbol mapping (verify against Twelve Data docs)

const SYMBOL_MAP = {
  EURUSD: 'EUR/USD',
  USDJPY: 'USD/JPY',
  USDZAR: 'USD/ZAR',
  XAUUSD: 'XAU/USD',
  OIL: 'WTI',          // verify: could be 'CL', 'WTI', or provider-specific symbol
  NDX: 'NDX',          // verify exact index symbol
  BTCUSD: 'BTC/USD'
};

Netlify Function Example (Node)

Place this file at `netlify/functions/market-data.js`.

*** Begin code: netlify/functions/market-data.js ***

const fetch = require('node-fetch');

const SYMBOL_MAP = {
  EURUSD: 'EUR/USD',
  USDJPY: 'USD/JPY',
  USDZAR: 'USD/ZAR',
  XAUUSD: 'XAU/USD',
  OIL: 'WTI',
  NDX: 'NDX',
  BTCUSD: 'BTC/USD'
};

const DEFAULT_PROVIDER_URL = 'https://api.twelvedata.com/quote';

exports.handler = async function(event) {
  const qs = event.queryStringParameters || {};
  const symbolsParam = qs.symbols || '';
  const ids = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : Object.keys(SYMBOL_MAP);

  const providerKey = process.env.TWELVEDATA_API_KEY;
  const providerUrl = process.env.TWELVEDATA_API_URL || DEFAULT_PROVIDER_URL;

  if (!providerKey) return { statusCode: 500, body: 'TWELVEDATA_API_KEY not configured' };

  const providerSymbols = ids.map(id => SYMBOL_MAP[id]).filter(Boolean);
  if (!providerSymbols.length) return { statusCode: 400, body: 'No valid symbols requested' };

  try {
    // Build Twelve Data quote URL. The quote endpoint accepts comma-separated symbols.
    const url = providerUrl + '?symbol=' + encodeURIComponent(providerSymbols.join(',')) + '&apikey=' + encodeURIComponent(providerKey);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429) return { statusCode: 429, headers: corsHeaders(), body: 'Rate limited' };
    if (!res.ok) return { statusCode: res.status, headers: corsHeaders(), body: 'Provider error' };

    const raw = await res.json();

    // Twelve Data returns either an object per symbol or a single object for one symbol.
    // Normalize into an array matching our client contract.
    const normalized = ids.map(id => {
      const providerSym = SYMBOL_MAP[id];
      // raw may be { 'EUR/USD': { ... }, 'BTC/USD': { ... } }
      const r = raw && raw[providerSym] ? raw[providerSym] : (raw && raw.symbol === providerSym ? raw : null);

      if (!r) return { id, symbol: providerSym, name: prettyName(id) };

      // Twelve Data's quote response fields include: price, previous_close, percent_change, datetime, etc.
      const price = parseFloat(r.price);
      const previousClose = r.previous_close ? parseFloat(r.previous_close) : null;
      const change = (price != null && previousClose != null) ? (price - previousClose) : (r.change ? parseFloat(r.change) : null);
      const changePercent = r.percent_change ? parseFloat(r.percent_change) : ((previousClose ? (change / previousClose) * 100 : null));

      return {
        id,
        symbol: providerSym,
        name: prettyName(id),
        price: isNaN(price) ? null : price,
        previousClose: isNaN(previousClose) ? null : previousClose,
        change: isNaN(change) ? null : change,
        changePercent: isNaN(changePercent) ? null : changePercent,
        marketStatus: r.status || 'N/A',
        timestamp: r.datetime || new Date().toISOString()
      };
    });

    return {
      statusCode: 200,
      headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(), cacheHeaders()),
      body: JSON.stringify(normalized)
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: corsHeaders(), body: 'Server error' };
  }
};

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

function corsHeaders(){ return { 'Access-Control-Allow-Origin': '*' }; }
function cacheHeaders(){ return { 'Cache-Control': 'max-age=20, s-maxage=30' }; }

*** End code ***

Cloudflare Worker Example

Use `wrangler` to deploy. Store `TWELVEDATA_API_KEY` as a secret.

*** Begin code: worker/index.js ***
addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

const SYMBOL_MAP = {
  EURUSD: 'EUR/USD',
  USDJPY: 'USD/JPY',
  USDZAR: 'USD/ZAR',
  XAUUSD: 'XAU/USD',
  OIL: 'WTI',
  NDX: 'NDX',
  BTCUSD: 'BTC/USD'
};

const DEFAULT_PROVIDER_URL = 'https://api.twelvedata.com/quote';

async function handle(request){
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get('symbols') || '';
  const ids = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : Object.keys(SYMBOL_MAP);

  const providerKey = TWELVEDATA_API_KEY; // bound secret via wrangler
  const providerUrl = DEFAULT_PROVIDER_URL;

  if (!providerKey) return new Response('TWELVEDATA_API_KEY not configured', { status: 500 });

  const providerSymbols = ids.map(id => SYMBOL_MAP[id]).filter(Boolean);
  if (!providerSymbols.length) return new Response('No valid symbols', { status: 400 });

  const fetchUrl = providerUrl + '?symbol=' + encodeURIComponent(providerSymbols.join(',')) + '&apikey=' + encodeURIComponent(providerKey);

  const res = await fetch(fetchUrl, { headers: { Accept: 'application/json' } });
  if (res.status === 429) return new Response('Rate limited', { status: 429 });
  if (!res.ok) return new Response('Provider error', { status: res.status });

  const raw = await res.json();

  const normalized = ids.map(id => {
    const providerSym = SYMBOL_MAP[id];
    const r = raw && raw[providerSym] ? raw[providerSym] : (raw && raw.symbol === providerSym ? raw : null);
    const price = r && r.price ? parseFloat(r.price) : null;
    const previousClose = r && r.previous_close ? parseFloat(r.previous_close) : null;
    const change = (price != null && previousClose != null) ? (price - previousClose) : null;
    const changePercent = (r && r.percent_change) ? parseFloat(r.percent_change) : (previousClose ? (change / previousClose) * 100 : null);
    return {
      id,
      symbol: providerSym,
      name: prettyName(id),
      price: isNaN(price) ? null : price,
      previousClose: isNaN(previousClose) ? null : previousClose,
      change: isNaN(change) ? null : change,
      changePercent: isNaN(changePercent) ? null : changePercent,
      marketStatus: r && r.status ? r.status : 'N/A',
      timestamp: r && r.datetime ? r.datetime : new Date().toISOString()
    };
  });

  return new Response(JSON.stringify(normalized), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

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
*** End code ***

Deployment steps (Netlify)

1. Add `netlify/functions/market-data.js` to the repo.
2. In Netlify site settings set `TWELVEDATA_API_KEY` as an environment variable.
3. Deploy the site (Netlify will deploy the function). The function URL will be `/.netlify/functions/market-data`.
4. Test with curl:

```bash
curl 'https://your-site.netlify.app/.netlify/functions/market-data?symbols=EURUSD,USDJPY'
```

5. In the browser console point the client to the endpoint:

```js
window.ExMarketsMarketData.setEndpoint('https://your-site.netlify.app/.netlify/functions/market-data')
```

Final notes

- Verify exact Twelve Data symbol strings in the Twelve Data docs/dashboard and update `SYMBOL_MAP` before deployment. The code is defensive if a provider record is missing.
- Twelve Data free tier often has delayed data; confirm your plan if you need real-time pricing.
- After you confirm symbol strings or want me to look them up, I will update the `SYMBOL_MAP` and adapt the normalization to match the exact response fields.
