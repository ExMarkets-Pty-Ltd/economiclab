/* Hero Dashboard - AUD/USD Live Market Data with Chart
   Uses Alpha Vantage API for real forex data (free tier, 5 calls/min)
*/
(function () {
  'use strict';

  // Configuration
  var PROXY_ENDPOINT = 'https://exmarkets.netlify.app/.netlify/functions/market-data';
  var FALLBACK_API_KEY = 'demo'; // Alpha Vantage free tier key
  var FALLBACK_API_BASE = 'https://www.alphavantage.co/query';
  var UPDATE_INTERVAL = 60000; // 60 seconds
  var MAX_CHART_POINTS = 50;
  var useProxyEndpoint = true;

  // DOM elements
  var priceEl = document.getElementById('hero-price');
  var changeEl = document.getElementById('hero-change');
  var statusEl = document.getElementById('hero-status');
  var canvas = document.getElementById('hero-chart');

  // Chart context
  var ctx = canvas ? canvas.getContext('2d') : null;
  var chartData = []; // Array of {price, time}
  var currentPrice = null;
  var previousPrice = null;
  var updateTimer = null;

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
      if (previousPrice !== null && currentPrice !== null) {
        var change = currentPrice - previousPrice;
        var changePercent = (change / previousPrice) * 100;
        var sign = change > 0 ? '+' : (change < 0 ? '−' : '');
        changeEl.textContent = sign + changePercent.toFixed(2) + '%';
        changeEl.classList.remove('hero-dashboard__pill--positive', 'hero-dashboard__pill--negative');
        if (change > 0) {
          changeEl.classList.add('hero-dashboard__pill--positive');
        } else if (change < 0) {
          changeEl.classList.add('hero-dashboard__pill--negative');
        }
      } else {
        changeEl.textContent = '–';
      }
    }

    setStatus('DATA AVAILABLE');
  }

  function addChartPoint(price) {
    chartData.push({
      price: price,
      time: new Date().toLocaleTimeString()
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
    var bgColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
    var primaryColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    var textMutedColor = window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim();

    // Clear canvas with background color
    ctx.fillStyle = bgColor || '#0b1324';
    ctx.fillRect(0, 0, width, height);

    if (!chartData.length) {
      // No data yet
      ctx.fillStyle = textMutedColor || '#8ba3c8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for market data...', width / 2, height / 2);
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
    ctx.strokeStyle = primaryColor || '#4f8cff';
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
      ctx.fillStyle = 'rgba(79, 140, 255, 0.1)';
      ctx.fill();

      // Draw data points
      ctx.fillStyle = primaryColor || '#4f8cff';
      for (var i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function fetchAUDUSD() {
    if (!priceEl) return;

    setStatus('UPDATING');

    if (useProxyEndpoint) {
      // Try existing proxy endpoint first
      var proxyUrl = PROXY_ENDPOINT + '?symbols=AUDUSD';
      fetch(proxyUrl, { headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Proxy returned ' + res.status);
          return res.json();
        })
        .then(function (json) {
          if (Array.isArray(json) && json.length) {
            var data = json[0];
            if (data.price && !isNaN(parseFloat(data.price))) {
              handlePriceUpdate(parseFloat(data.price));
            } else {
              throw new Error('Invalid price in proxy response');
            }
          } else {
            throw new Error('Empty response from proxy');
          }
        })
        .catch(function (err) {
          console.warn('Proxy endpoint failed, falling back to Alpha Vantage:', err);
          useProxyEndpoint = false;
          fetchWithAlphaVantage();
        });
    } else {
      fetchWithAlphaVantage();
    }
  }

  function fetchWithAlphaVantage() {
    // Use Open Exchange Rates API (free tier, no auth required)
    // Or fallback to exchangerate-api.com
    var url = 'https://open.er-api.com/v6/latest/AUD';

    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.rates && json.rates.USD) {
          var price = parseFloat(json.rates.USD);
          if (!isNaN(price)) {
            handlePriceUpdate(price);
          } else {
            throw new Error('Invalid price data');
          }
        } else {
          throw new Error('No USD rate in response');
        }
      })
      .catch(function (err) {
        console.error('Open ER API failed, trying fallback:', err);
        // Fallback to another API
        fetchFromExchangeRate();
      });
  }

  function fetchFromExchangeRate() {
    // Fallback to exchangerate-api.com (limited free tier)
    var url = 'https://v6.exchangerate-api.com/v6/latest/AUD';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.conversion_rates && json.conversion_rates.USD) {
          var price = parseFloat(json.conversion_rates.USD);
          if (!isNaN(price)) {
            handlePriceUpdate(price);
          } else {
            throw new Error('Invalid price data');
          }
        } else {
          throw new Error('No USD rate in response');
        }
      })
      .catch(function (err) {
        handleFetchError(err);
      });
  }

  function handlePriceUpdate(price) {
    if (currentPrice !== null) {
      previousPrice = currentPrice;
    }
    currentPrice = price;
    addChartPoint(price);
    updateDisplay();
  }

  function handleFetchError(err) {
    console.error('Hero dashboard fetch error:', err);
    if (currentPrice === null) {
      // First fetch failed - show error
      priceEl.textContent = 'Unavailable';
      setStatus('DATA UNAVAILABLE');
    } else {
      // We have data from before, just update status
      setStatus('DATA AVAILABLE');
    }
  }

  function scheduleUpdate() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(function () {
      fetchAUDUSD();
      scheduleUpdate();
    }, UPDATE_INTERVAL);
  }

  // Initialize
  function init() {
    if (!priceEl) return; // Hero dashboard not on this page

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

    fetchAUDUSD();
    scheduleUpdate();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', function () {
    if (updateTimer) clearTimeout(updateTimer);
  });
})();
