/* ExMarkets site scripts
   Lightweight JavaScript for progressive enhancement and accessibility.
   Keeps the experience fast by avoiding external libraries and heavy dependencies.
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'exmarkets-theme';
  const root = document.documentElement;
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeLabel = themeToggle ? themeToggle.querySelector('.theme-toggle__label') : null;

  function applyTheme(themeName) {
    root.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEY, themeName);

    if (themeToggle) {
      const isLight = themeName === 'light';
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');

      if (themeLabel) {
        themeLabel.textContent = isLight ? 'Light theme' : 'Dark theme';
      }
    }
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
  applyTheme(initialTheme);

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      this.setAttribute('aria-expanded', String(nextExpanded));
      navMenu.classList.toggle('is-open', nextExpanded);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
    });
  }

  document.querySelectorAll('[data-scroll-to]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const targetId = this.getAttribute('data-scroll-to');
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
