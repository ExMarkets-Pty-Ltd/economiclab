/* ExMarkets site scripts
   Lightweight JavaScript for progressive enhancement and accessibility.
   Keeps the experience fast by avoiding external libraries and heavy dependencies.
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'exmarkets-theme';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', initialTheme);
  const preloader = document.createElement('div');
  preloader.className = 'site-preloader';
  preloader.setAttribute('role', 'status');
  preloader.setAttribute('aria-label', 'Loading');
  preloader.innerHTML = '<div class="site-preloader__content"><div class="site-preloader__logo" aria-hidden="true"><img class="site-preloader__logo-light" src="/assets/images/ExMarkets Premium Transparent Black logo.png" alt="" /><img class="site-preloader__logo-dark" src="/assets/images/ExMarkets White Transparent logo.png" alt="" /></div><span class="site-preloader__label">Loading</span><div class="site-preloader__track" aria-hidden="true"><span class="site-preloader__progress"></span></div></div>';
  document.body.insertBefore(preloader, document.body.firstChild);
  document.body.classList.add('preloader-active');

  let preloaderClosed = false;
  function closePreloader() {
    if (preloaderClosed) {
      return;
    }
    preloaderClosed = true;
    preloader.classList.add('is-complete');
    window.setTimeout(function () {
      preloader.remove();
      document.body.classList.remove('preloader-active');
    }, 500);
  }

  function finishWhenReady() {
    closePreloader();
  }

  if (document.readyState === 'complete') {
    finishWhenReady();
  } else {
    window.addEventListener('load', finishWhenReady, { once: true });
  }
  window.setTimeout(closePreloader, 9000);

  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  const navInner = document.querySelector('.site-nav__inner');
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');

  function applyTheme(themeName) {
    root.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEY, themeName);

    themeToggles.forEach(function (toggle) {
      const isLight = themeName === 'light';
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');

      const label = toggle.querySelector('.theme-toggle__label');
      if (label) {
        label.textContent = isLight ? 'Light theme' : 'Dark theme';
      }
    });
  }

  applyTheme(initialTheme);

  // Mobile navigation toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      this.setAttribute('aria-expanded', String(nextExpanded));
      this.setAttribute('aria-label', nextExpanded ? 'Close navigation menu' : 'Open navigation menu');
      this.textContent = nextExpanded ? '✕' : '☰';
      navMenu.classList.toggle('is-open', nextExpanded);
      if (navInner) {
        navInner.classList.toggle('is-menu-open', nextExpanded);
      }
      // Disable/enable page scrolling
      if (nextExpanded) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    });
  }

  // Mobile dropdown buttons
  document.querySelectorAll('.site-nav__dropdown-btn').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      const submenu = this.parentElement.nextElementSibling;
      
      if (submenu && submenu.classList.contains('submenu')) {
        const isOpen = submenu.classList.contains('is-open');
        this.setAttribute('aria-expanded', String(!isOpen));
        submenu.classList.toggle('is-open', !isOpen);
      }
    });
  });

  // Close menu when clicking a navigation link
  if (navMenu) {
    navMenu.querySelectorAll('a[href]:not([href=""])').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation menu');
        navToggle.textContent = '☰';
        navMenu.classList.remove('is-open');
        if (navInner) {
          navInner.classList.remove('is-menu-open');
        }
        document.body.classList.remove('menu-open');
        
        // Close any open dropdowns
        navMenu.querySelectorAll('.submenu.is-open').forEach(function (submenu) {
          submenu.classList.remove('is-open');
        });
        navMenu.querySelectorAll('.site-nav__dropdown-btn').forEach(function (btn) {
          btn.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  // Prevent default on parent links
  document.querySelectorAll('.site-nav__parent a[href=""]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
    });
  });

  if (themeToggles.length > 0) {
    themeToggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
      });
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

  // Footer accordion functionality
  document.querySelectorAll('.footer__accordion-button').forEach(function (button) {
    button.addEventListener('click', function () {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;
      
      this.setAttribute('aria-expanded', String(nextExpanded));
      
      const contentId = this.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      
      if (content) {
        if (nextExpanded) {
          // Calculate height for smooth animation
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0px';
        }
      }
    });
  });
})();
