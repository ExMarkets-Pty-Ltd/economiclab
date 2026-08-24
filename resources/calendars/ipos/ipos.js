(function () {
  'use strict';

  const controls = document.querySelectorAll('[data-ipo-view], #ipo-search, #ipo-date, #ipo-market');
  const loading = document.querySelector('[data-ipo-state="loading"]');
  const unavailable = document.querySelector('[data-ipo-state="unavailable"]');
  const empty = document.querySelector('[data-ipo-state="empty"]');
  const tableWrap = document.querySelector('[data-ipo-table-wrap]');

  function showUnavailable() {
    loading.hidden = true;
    empty.hidden = true;
    tableWrap.hidden = true;
    unavailable.hidden = false;
  }

  controls.forEach(function (control) {
    control.addEventListener('click', showUnavailable);
    control.addEventListener('input', showUnavailable);
    control.addEventListener('change', showUnavailable);
  });

  window.setTimeout(showUnavailable, 0);
})();
