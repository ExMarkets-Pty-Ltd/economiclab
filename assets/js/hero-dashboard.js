/* Hero dashboard consumes the shared EconomicLab market-data response. */
(function () {
  'use strict';

  var MAX_CHART_POINTS = 50;

  // DOM elements
  var priceEl = document.getElementById('hero-price');
  var changeEl = document.getElementById('hero-change');
  var statusEl = document.getElementById('hero-status');
  var canvas = document.getElementById('hero-chart');

  // Chart context
  var ctx = canvas ? canvas.getContext('2d') : null;
  var chartData = []; // Array of {price, time}
  var currentPrice = null;
  var currentChangePercent = null;
  var currentTimestampKnown = false;
  var currentDataIsStale = false;
  var hasReceivedMarketData = false;

  // Setup canvas
  if (canvas) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);
    redrawChart();
  }

  function setStatus(status) {
    if (statusEl) {
      statusEl.textContent = 'Market status: ' + status;
    }
  }

  function formatPrice(price) {
    if (price === null || price === undefined) return '-';
    return Number(price).toFixed(5);
  }

  function updateDisplay() {
    if (!priceEl) return;
    if (currentPrice === null) {
      priceEl.textContent = 'Loading...';
      setStatus('LOADING');
      return;
    }
    priceEl.textContent = formatPrice(currentPrice);

    // Update change pill
    if (changeEl) {
      if (currentChangePercent !== null) {
        var sign = currentChangePercent > 0 ? '+' : (currentChangePercent < 0 ? '−' : '');
        changeEl.textContent = sign + Math.abs(currentChangePercent).toFixed(2) + '%';
        changeEl.classList.remove('hero-dashboard__pill--positive', 'hero-dashboard__pill--negative');
        if (currentChangePercent > 0) {
          changeEl.classList.add('hero-dashboard__pill--positive');
        } else if (currentChangePercent < 0) {
          changeEl.classList.add('hero-dashboard__pill--negative');
        }
      } else {
        changeEl.textContent = '–';
      }
    }

    setStatus(currentDataIsStale ? 'LAST KNOWN DATA' : (currentTimestampKnown ? 'DATA AVAILABLE' : 'TIMESTAMP UNAVAILABLE'));
  }

  function addChartPoint(price, timestamp) {
    chartData.push({
      price: price,
      time: new Date(timestamp).toLocaleTimeString()
    });

    // Keep only last MAX_CHART_POINTS
    if (chartData.length > MAX_CHART_POINTS) {
      chartData.shift();
    }

    redrawChart();
  }

  function redrawChart() {
    if (!ctx || !canvas) return;

    var rect = canvas.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    // Get theme-aware colors
    var bgColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-surface-2').trim();
    var primaryColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    var textMutedColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim();

    // Clear canvas with background color
    ctx.fillStyle = bgColor || '#F3F6FA';
    ctx.fillRect(0, 0, width, height);

    if (!chartData.length) {
      // No data yet
      ctx.fillStyle = textMutedColor || '#667085';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(hasReceivedMarketData ? 'Intraday chart data unavailable' : 'Waiting for market data...', width / 2, height / 2);
      return;
    }

    // Calculate min/max prices for scaling
    var prices = chartData.map(function (d) { return d.price; });
    var minPrice = Math.min.apply(null, prices);
    var maxPrice = Math.max.apply(null, prices);
    var priceRange = maxPrice - minPrice || 1;
    var padding = priceRange * 0.1; // 10% padding

    // Draw chart
    var chartWidth = width - 20;
    var chartHeight = height - 20;
    var startX = 10;
    var startY = 10;

    // Calculate point positions
    var points = chartData.map(function (d, index) {
      var x = startX + (index / (chartData.length - 1 || 1)) * chartWidth;
      var y = startY + chartHeight - (((d.price - minPrice + padding) / (priceRange + padding * 2)) * chartHeight);
      return { x: x, y: y, price: d.price };
    });

    // Draw line chart
    ctx.strokeStyle = primaryColor || '#05EEFC';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (points.length) {
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();

    // Draw gradient fill under line
    if (points.length) {
      ctx.lineTo(points[points.length - 1].x, chartHeight + startY);
      ctx.lineTo(points[0].x, chartHeight + startY);
      ctx.fillStyle = 'rgba(5, 238, 252, 0.1)';
      ctx.fill();

      // Draw data points
      ctx.fillStyle = primaryColor || '#05EEFC';
      for (var i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function handleMarketData(event) {
    var markets = Array.isArray(event.detail) ? event.detail : [];
    var quote = markets.find(function (market) { return market && market.id === 'AUDUSD'; });
    var price = quote && Number(quote.price);
    if (!Number.isFinite(price)) return;

    currentPrice = price;
    currentChangePercent = quote.changePercent != null && Number.isFinite(Number(quote.changePercent))
      ? Number(quote.changePercent)
      : null;
    hasReceivedMarketData = true;
    currentTimestampKnown = !!quote.timestamp && Number.isFinite(Date.parse(quote.timestamp));
    currentDataIsStale = currentTimestampKnown && Date.now() - Date.parse(quote.timestamp) > 24 * 60 * 60 * 1000;
    if (currentTimestampKnown && !currentDataIsStale && /[T ]\d{2}:\d{2}/.test(String(quote.timestamp))){
      addChartPoint(price, quote.timestamp);
    } else {
      redrawChart();
    }
    updateDisplay();
  }

  function handleFetchError() {
    if (currentPrice === null) {
      priceEl.textContent = 'Unavailable';
      setStatus('DATA UNAVAILABLE');
    } else {
      setStatus('LAST KNOWN DATA');
    }
  }

  // Initialize
  function init() {
    if (!priceEl) return; // Hero dashboard not on this page
    document.addEventListener('economiclab:market-data-updated', handleMarketData);
    document.addEventListener('economiclab:market-data-error', handleFetchError);

    // Handle theme changes
    document.addEventListener('change', function (e) {
      if (e.target && e.target.dataset && e.target.dataset.themeToggle !== undefined) {
        setTimeout(redrawChart, 50); // Redraw chart with new theme colors
      }
    });

    // Also watch for direct HTML theme attribute changes
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'data-theme') {
          setTimeout(redrawChart, 50);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
