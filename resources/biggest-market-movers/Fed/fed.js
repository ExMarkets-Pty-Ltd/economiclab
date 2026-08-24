(function () {
  'use strict';

  var endpoint = 'https://exmarkets.netlify.app/.netlify/functions/market-data';
  var cards = document.querySelectorAll('[data-fed-symbol]');
  var symbols = Array.prototype.map.call(cards, function (card) { return card.getAttribute('data-fed-symbol'); });

  function formatQuote(quote) {
    if (!quote || quote.price == null || !Number.isFinite(Number(quote.price))) return 'Data unavailable';
    return Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 5 });
  }

  function formatChange(quote) {
    if (!quote || quote.changePercent == null || !Number.isFinite(Number(quote.changePercent))) return 'Daily change unavailable';
    var value = Number(quote.changePercent);
    return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
  }

  function renderUnavailable() {
    cards.forEach(function (card) {
      card.querySelector('strong').textContent = 'Data unavailable';
      card.querySelector('small').textContent = 'Existing exMarkets quote provider unavailable';
    });
  }

  if (!cards.length) return;

  fetch(endpoint + '?symbols=' + encodeURIComponent(symbols.join(',')), { headers: { Accept: 'application/json' } })
    .then(function (response) {
      if (!response.ok) throw new Error('Market data request failed');
      return response.json();
    })
    .then(function (quotes) {
      var byId = {};
      (Array.isArray(quotes) ? quotes : []).forEach(function (quote) { byId[quote.id || quote.symbol] = quote; });
      cards.forEach(function (card) {
        var quote = byId[card.getAttribute('data-fed-symbol')];
        card.querySelector('strong').textContent = formatQuote(quote);
        card.querySelector('small').textContent = quote && quote.timestamp ? 'Daily change: ' + formatChange(quote) + ' | Updated: ' + new Date(quote.timestamp).toLocaleString() : 'Daily change unavailable';
      });
    })
    .catch(function () { renderUnavailable(); });
})();
