/* ExMarkets market-data client module
 - Expects a secure serverless proxy endpoint that returns a normalized JSON array of market objects.
 - DOES NOT contain any private API key. Deploy a serverless proxy to call the chosen provider.

 Normalized market object format expected from server-side proxy:
 [
   {
     symbol: 'EURUSD',        // internal id
     name: 'EUR/USD',
     providerSymbol: 'OANDA:EURUSD', // optional provider-specific symbol
     price: 1.23456,
     previousClose: 1.23000,
     change: 0.00456,        // price - previousClose (optional if provided)
     changePercent: 0.37,    // percent (optional if provided)
     marketStatus: 'OPEN',   // or 'CLOSED' or 'N/A'
     timestamp: '2026-08-10T12:34:56Z' // ISO timestamp when price was valid
   },
   ...
 ]

 If no proxy is configured (MARKET_DATA_ENDPOINT empty), the UI will show a graceful "Market data temporarily unavailable" message.
*/
(function(){
  'use strict';

  // Configuration
  var MARKET_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  var MARKET_DATA_ENDPOINT = '/.netlify/functions/market-data'; // serverless proxy endpoint

  // Internal market list (internal IDs only). Provider symbol mapping happens server-side.
  var MARKETS = [
    { id: 'EURUSD', display: 'EUR/USD' },
    { id: 'USDJPY', display: 'USD/JPY' },
    { id: 'USDZAR', display: 'USD/ZAR' },
    { id: 'XAUUSD', display: 'Gold' },
    { id: 'OIL', display: 'Oil' },
    { id: 'NDX', display: 'NASDAQ 100' },
    { id: 'BTCUSD', display: 'Bitcoin' }
  ];

  var grid = document.getElementById('live-market-grid');
  var disclosure = document.getElementById('market-disclosure');
  var lastSuccessfulFetchAt = null;
  var refreshTimer = null;
  var backoffMultiplier = 1;

  function formatNumberForInstrument(id, value){
    if (value === null || value === undefined || isNaN(value)) return '-';
    switch(id){
      case 'EURUSD':
      case 'USDZAR':
        return value.toFixed(5);
      case 'USDJPY':
        return value.toFixed(3);
      case 'XAUUSD':
        return value.toFixed(2);
      case 'OIL':
        return value.toFixed(2);
      case 'NDX':
        return Math.round(value).toLocaleString();
      case 'BTCUSD':
        if (value >= 1000) return value.toLocaleString(undefined, {maximumFractionDigits:2});
        return value.toLocaleString(undefined, {maximumFractionDigits:2});
      default:
        return value;
    }
  }

  function createLoadingCard(container, display){
    container.innerHTML = '';
    var header = document.createElement('div'); header.className = 'market-panel__header';
    var label = document.createElement('span'); label.className = 'market-panel__label'; label.textContent = display; header.appendChild(label);
    container.appendChild(header);
    var val = document.createElement('div'); val.className = 'market-panel__value'; val.textContent = '';
    container.appendChild(val);
    var meta = document.createElement('p'); meta.className = 'market-panel__meta'; meta.textContent = 'Loading market data...'; container.appendChild(meta);
  }

  function createErrorCard(container, display){
    container.innerHTML = '';
    var header = document.createElement('div'); header.className = 'market-panel__header';
    var label = document.createElement('span'); label.className = 'market-panel__label'; label.textContent = display; header.appendChild(label);
    container.appendChild(header);
    var meta = document.createElement('p'); meta.className = 'market-panel__meta'; meta.textContent = 'Market data temporarily unavailable'; container.appendChild(meta);
  }

  function renderMarketCard(container, market){
    container.innerHTML = '';
    var header = document.createElement('div'); header.className = 'market-panel__header';
    var label = document.createElement('span'); label.className = 'market-panel__label'; label.textContent = market.name || market.symbol || '';
    header.appendChild(label);

    var symSpan = document.createElement('span'); symSpan.className = 'market-panel__symbol'; symSpan.textContent = (market.providerSymbol || market.symbol || '').replace(/:/g,' ');
    header.appendChild(symSpan);

    var delta = document.createElement('span'); delta.className = 'market-panel__delta';
    var change = market.change;
    var changePercent = market.changePercent;
    if ((change === undefined || change === null) && market.price != null && market.previousClose != null){
      change = market.price - market.previousClose;
    }
    if ((changePercent === undefined || changePercent === null) && change != null && market.previousClose != null && market.previousClose !== 0){
      changePercent = (change / market.previousClose) * 100;
    }
    if (change != null){
      var sign = change > 0 ? '+' : (change < 0 ? '−' : '');
      delta.textContent = sign + (changePercent != null ? (Math.abs(changePercent).toFixed(2) + '%') : (Math.abs(change).toFixed(2)));
      if (change > 0) delta.classList.add('market-panel__delta--positive');
      else if (change < 0) delta.classList.add('market-panel__delta--negative');
    }

    header.appendChild(delta);
    container.appendChild(header);

    var val = document.createElement('div'); val.className = 'market-panel__value';
    val.textContent = market.price != null ? formatNumberForInstrument(market.symbol || market.id, market.price) : '-';
    container.appendChild(val);

    var detailRow = document.createElement('div'); detailRow.className = 'market-panel__details';
    var prevClose = document.createElement('span'); prevClose.className = 'market-panel__stat';
    prevClose.textContent = 'Prev ' + (market.previousClose != null ? formatNumberForInstrument(market.symbol || market.id, market.previousClose) : '-');
    detailRow.appendChild(prevClose);

    var changeValue = document.createElement('span'); changeValue.className = 'market-panel__stat';
    if (change != null){
      var signed = change > 0 ? '+' : (change < 0 ? '−' : '');
      changeValue.textContent = 'Δ ' + signed + Math.abs(change).toFixed(change > 0 && (market.symbol || market.id) === 'USDJPY' ? 3 : 2);
      changeValue.classList.toggle('market-panel__stat--positive', change > 0);
      changeValue.classList.toggle('market-panel__stat--negative', change < 0);
    } else {
      changeValue.textContent = 'Δ -';
    }
    detailRow.appendChild(changeValue);

    var pctValue = document.createElement('span'); pctValue.className = 'market-panel__stat';
    if (changePercent != null){
      var signedPercent = changePercent > 0 ? '+' : (changePercent < 0 ? '−' : '');
      pctValue.textContent = 'Chg ' + signedPercent + Math.abs(changePercent).toFixed(2) + '%';
      pctValue.classList.toggle('market-panel__stat--positive', changePercent > 0);
      pctValue.classList.toggle('market-panel__stat--negative', changePercent < 0);
    } else {
      pctValue.textContent = 'Chg -';
    }
    detailRow.appendChild(pctValue);
    container.appendChild(detailRow);

    var meta = document.createElement('p'); meta.className = 'market-panel__meta';
    var tsText = '';
    if (market.timestamp){
      try{
        var d = new Date(market.timestamp);
        if (!isNaN(d)){
          tsText = 'Updated ' + d.toUTCString().replace('GMT','UTC');
        }
      }catch(e){ /* ignore */ }
    }
    if (!tsText && lastSuccessfulFetchAt){
      tsText = 'Updated ' + new Date(lastSuccessfulFetchAt).toUTCString().replace('GMT','UTC');
    }

    meta.textContent = (market.marketStatus ? (market.marketStatus + ' · ') : '') + (tsText || '');
    container.appendChild(meta);
  }

  function renderAllLoading(){
    var panels = grid.querySelectorAll('.market-panel');
    panels.forEach(function(p){
      var id = p.getAttribute('data-id');
      var cfg = MARKETS.find(function(m){ return m.id === id; });
      createLoadingCard(p, cfg ? cfg.display : id);
    });
  }

  function renderAllErrors(){
    var panels = grid.querySelectorAll('.market-panel');
    panels.forEach(function(p){
      var id = p.getAttribute('data-id');
      var cfg = MARKETS.find(function(m){ return m.id === id; });
      createErrorCard(p, cfg ? cfg.display : id);
    });
  }

  function normalizeMarketKey(value){
    if (!value && value !== 0) return '';
    return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function applyData(markets){
    // markets: array of normalized objects
    lastSuccessfulFetchAt = Date.now();
    var map = {};
    markets.forEach(function(m){
      var key = normalizeMarketKey((m && (m.id || m.symbol)) || '');
      if (key) map[key] = m;
    });

    var panels = grid.querySelectorAll('.market-panel');
    panels.forEach(function(p){
      var id = p.getAttribute('data-id');
      var normalizedId = normalizeMarketKey(id);
      var market = map[normalizedId];
      var cfg = MARKETS.find(function(m){ return m.id === id; });
      if (market){
        // preserve the normalized backend payload while filling any missing client-side fields
        market.id = market.id || id;
        market.symbol = market.symbol || id;
        market.name = market.name || (cfg ? cfg.display : id);
        renderMarketCard(p, market);
      } else {
        createErrorCard(p, cfg ? cfg.display : id);
      }
    });

    // update disclosure timestamp
    if (disclosure){
      disclosure.textContent = (disclosure.textContent.split('·')[0] || 'Market data provided via ExMarkets') + ' · Market data updated: ' + new Date(lastSuccessfulFetchAt).toUTCString().replace('GMT','UTC');
    }
  }

  function handleFetchError(err, status){
    console.warn('Market data fetch error', err, status);
    if (status === 429){
      backoffMultiplier = Math.min(backoffMultiplier * 2, 16);
      scheduleRefreshWithBackoff();
    }
    if (disclosure){
      disclosure.textContent = 'Market data provided via ExMarkets · Market data temporarily unavailable';
    }
  }

  function scheduleRefreshWithBackoff(){
    if (refreshTimer) clearTimeout(refreshTimer);
    var interval = Math.min(MARKET_REFRESH_INTERVAL * backoffMultiplier, 30 * 60 * 1000); // cap 30m
    refreshTimer = setTimeout(fetchAndRender, interval);
  }

  function fetchAndRender(){
    if (!MARKET_DATA_ENDPOINT){
      // no endpoint configured
      renderAllErrors();
      return;
    }

    renderAllLoading();

    // Build query: send comma separated list of ids
    var ids = MARKETS.map(function(m){ return m.id; }).join(',');
    var url = MARKET_DATA_ENDPOINT + (MARKET_DATA_ENDPOINT.indexOf('?') === -1 ? '?' : '&') + 'symbols=' + encodeURIComponent(ids);

    fetch(url, {headers: {'Accept': 'application/json'}}).then(function(res){
      if (!res.ok){
        handleFetchError(new Error('HTTP ' + res.status), res.status);
        throw new Error('fail');
      }
      return res.json();
    }).then(function(json){
      // Expect json to be an array of normalized market objects
      if (!Array.isArray(json)){
        handleFetchError(new Error('Invalid response format')); return;
      }
      backoffMultiplier = 1;
      applyData(json);

      // schedule next
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(fetchAndRender, MARKET_REFRESH_INTERVAL);
    }).catch(function(err){
      if (err.message !== 'fail') handleFetchError(err);
    });
  }

  function init(){
    // Initialize UI
    var panels = grid.querySelectorAll('.market-panel');
    panels.forEach(function(p){
      var id = p.getAttribute('data-id');
      var cfg = MARKETS.find(function(m){ return m.id === id; });
      createLoadingCard(p, cfg ? cfg.display : id);
    });

    // Fetch immediately
    fetchAndRender();

    // Pause refresh when page hidden
    document.addEventListener('visibilitychange', function(){
      if (document.hidden){
        if (refreshTimer) clearTimeout(refreshTimer);
      } else {
        // resume immediate fetch
        fetchAndRender();
      }
    });
  }

  if (!grid){
    console.warn('market-data: live market grid not found');
  } else {
    // Defer init to DOMContentLoaded if needed
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', init);
    } else init();
  }

  // Expose config for debugging
  window.ExMarketsMarketData = {
    _MARKET_DATA_ENDPOINT: function(){ return MARKET_DATA_ENDPOINT; },
    setEndpoint: function(url){ MARKET_DATA_ENDPOINT = url; fetchAndRender(); }
  };
})();
