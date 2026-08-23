(function () {
  'use strict';

  var theme = 'light';
  try {
    theme = localStorage.getItem('exmarkets-theme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    theme = 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
