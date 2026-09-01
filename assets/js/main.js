/* EconomicLab site scripts
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

  function createSubmenu(id, label, items) {
    return '<li class="has-submenu"><div class="site-nav__parent"><a class="site-nav__link" href="">' + label + '</a><button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="' + id + '" aria-label="Toggle ' + label + ' submenu"></button></div><ul class="submenu" id="' + id + '">' + items.map(function (item) {
      return '<li><a class="site-nav__link" href="' + item.href + '">' + item.label + '</a></li>';
    }).join('') + '</ul></li>';
  }

  let navToggle = null;
  let navMenu = null;
  let navInner = null;
  let mobileMenuActions = null;

  function renderCanonicalNavigation() {
    let header = document.querySelector('.site-nav');
    if (!header) {
      header = document.createElement('header');
      header.className = 'site-nav';
      header.setAttribute('role', 'banner');
      document.body.insertBefore(header, document.body.firstChild);
    }

    const insights = [
      { label: 'Markets', href: '/markets.html' },
      { label: 'Business', href: '/companies.html' },
      { label: 'Technology', href: '/technology.html' },
      { label: 'Economy', href: '/economy.html' }
    ];
    const calendars = [
      { label: 'Economics', href: '/data/calendars/economics/' },
      { label: 'Earnings', href: '/data/calendars/earnings/' },
      { label: 'Dividends', href: '/data/calendars/dividends/' },
      { label: 'IPOs', href: '/data/calendars/ipos/' }
    ];
    const trading = [
      { label: 'Markets Overview', href: '/markets/overview/' },
      { label: 'Forex', href: '/markets/forex/' },
      { label: 'Gold & Commodities', href: '/markets/gold-commodities/' },
      { label: 'Indices', href: '/markets/indices/' },
      { label: 'Stocks', href: '/markets/stocks/' },
      { label: 'Cryptocurrencies', href: '/markets/cryptocurrencies/' },
      { label: 'Brokers', href: '/markets/brokers/' },
      { label: 'Broker Comparison', href: '/markets/broker-comparison/' },
      { label: 'Platforms', href: '/markets/platforms/' },
      { label: 'Strategies', href: '/markets/strategies/' },
      { label: 'Risk Management', href: '/markets/risk-management/' }
    ];

    const resourcesMarkup = '<li class="has-submenu"><div class="site-nav__parent"><a class="site-nav__link" href="/data/">Data</a><button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="submenu-resources" aria-label="Toggle Data submenu"></button></div><ul class="submenu" id="submenu-resources">' + createSubmenu('submenu-calendars', 'Calendars', calendars) + '<li><a class="site-nav__link" href="/data/biggest-market-movers/">Biggest Market Movers</a></li><li><a class="site-nav__link" href="/tradingview.html">Charts</a></li><li><a class="site-nav__link" href="/markets/broker-comparison/">Broker Comparison</a></li></ul></li>';
    const mobileHeaderActions = '<div class="site-nav__mobile-actions site-nav__mobile-actions--header"><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button><button class="site-nav__toggle btn btn--ghost btn--small" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-navigation" aria-label="Open menu">☰</button></div>';
    const desktopActions = '<div class="site-nav__actions"><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button><button class="btn btn--ghost btn--small site-nav__action-btn site-nav__action-btn--signin" type="button">Sign In</button><button class="btn btn--primary btn--small site-nav__action-btn site-nav__action-btn--primary" type="button">Getting Started</button></div>';
    const mobileMenuActions = '<div class="site-nav__mobile-actions site-nav__mobile-actions--menu"><button class="btn btn--ghost btn--small site-nav__action-btn site-nav__action-btn--signin" type="button">Sign In</button><button class="btn btn--primary btn--small site-nav__action-btn site-nav__action-btn--primary" type="button">Getting Started</button><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button></div>';
    header.innerHTML = '<div class="site-nav__inner"><a class="site-nav__brand" href="/" aria-label="EconomicLab home"><img class="logo logo-light" src="/assets/images/ExMarkets Premium Transparent Black logo.png" alt="EconomicLab" /><img class="logo logo-dark" src="/assets/images/ExMarkets White Transparent logo.png" alt="EconomicLab" /><span class="sr-only">EconomicLab</span></a>' + mobileHeaderActions + '<ul class="site-nav__links" id="site-navigation" data-nav-menu>' + createSubmenu('submenu-trading', 'Markets', trading) + resourcesMarkup + '<li><a class="site-nav__link" href="/solutions/">Solutions</a></li>' + createSubmenu('submenu-insights', 'Insights', insights) + '<li><a class="site-nav__link" href="/">Education</a></li>' + '</ul>' + mobileMenuActions + desktopActions + '</div>';

    const currentPath = window.location.pathname.replace(/index\.html$/, '');
    header.querySelectorAll('.site-nav__link[href]').forEach(function (link) {
      const linkPath = new URL(link.href, window.location.origin).pathname.replace(/index\.html$/, '');
      if (linkPath !== '/' && currentPath === linkPath) {
        link.setAttribute('aria-current', 'page');
        let parent = link.closest('.has-submenu');
        while (parent) {
          parent.querySelector(':scope > .site-nav__parent .site-nav__link').setAttribute('aria-current', 'page');
          parent = parent.parentElement.closest('.has-submenu');
        }
      }
    });
  }

  renderCanonicalNavigation();

  navToggle = document.querySelector('[data-nav-toggle]');
  navMenu = document.querySelector('[data-nav-menu]');
  navInner = document.querySelector('.site-nav__inner');
  mobileMenuActions = document.querySelector('.site-nav__mobile-actions--menu');
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');

  document.querySelectorAll('a').forEach(function (link) {
    const label = link.textContent.trim();
    if (label === 'Dividends' && link.getAttribute('href') === '/data/calendars/economics/') {
      link.setAttribute('href', '/data/calendars/dividends/');
    }
    if (label === 'IPOs' && link.getAttribute('href') !== '/data/calendars/ipos/') {
      link.setAttribute('href', '/data/calendars/ipos/');
    }
  });

  const socialLinks = [
    { label: 'Facebook', href: 'https://www.facebook.com/exmarketsofficial?utm_source=chatgpt.com', icon: '<path d="M13.5 8.5h-2V7.2c0-.6.4-.9 1-.9h1V3.9l-1.7-.1c-2 0-3.3 1.2-3.3 3.4v1.3H7v2.6h1.5v5h3v-5h2l.4-2.6Z"/>' },
    { label: 'Instagram', href: 'https://www.instagram.com/exmarketsofficial?utm_source=chatgpt.com', icon: '<rect x="4" y="4" width="12" height="12" rx="3"/><circle cx="10" cy="10" r="3"/><circle cx="14.5" cy="5.7" r=".8" fill="currentColor" stroke="none"/>' },
    { label: 'X', href: 'https://x.com/exmarkets_za?utm_source=chatgpt.com', icon: '<path d="m4 4 4.7 6.3L4.3 16h2.2l3.2-3.8 2.8 3.8H16l-4.9-6.6L15.6 4h-2.2l-3 3.6L7.8 4H4Zm3.6 1.6h.9l4.2 8.8h-.9L7.6 5.6Z"/>' },
    { label: 'YouTube', href: 'https://youtube.com/@exmarketsofficial?utm_source=chatgpt.com', icon: '<path d="M16.8 6.2a2 2 0 0 0-1.4-1.4C14.2 4.5 10 4.5 10 4.5s-4.2 0-5.4.3a2 2 0 0 0-1.4 1.4C3 7.4 3 10 3 10s0 2.6.2 3.8a2 2 0 0 0 1.4 1.4c1.2.3 5.4.3 5.4.3s4.2 0 5.4-.3a2 2 0 0 0 1.4-1.4C17 12.6 17 10 17 10s0-2.6-.2-3.8ZM8.8 12.7V7.3l4.5 2.7-4.5 2.7Z"/>' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@exmarketsofficial?utm_source=chatgpt.com', icon: '<path d="M12.5 3h2.1c.2 1.4 1 2.4 2.4 2.8v2.1a6.3 6.3 0 0 1-2.4-.7v4.4a4.4 4.4 0 1 1-3.8-4.4v2.2a2.2 2.2 0 1 0 1.7 2.2V3Z"/>' }
  ];

  document.querySelectorAll('.footer').forEach(function (footer) {
    const desktop = footer.querySelector('.footer__desktop');
    const socialMarkup = '<div class="footer__social container"><p class="footer__social-title">Feel connected anytime, anywhere.</p><div class="footer__social-links">' + socialLinks.map(function (social) {
      return '<a class="footer__social-link" href="' + social.href + '" target="_blank" rel="noopener noreferrer" aria-label="' + social.label + '"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">' + social.icon + '</svg></a>';
    }).join('') + '</div></div>';

    if (desktop && !footer.querySelector('.footer__social')) {
      footer.insertAdjacentHTML('afterbegin', socialMarkup);
      desktop.insertAdjacentHTML('beforeend', '<nav class="footer__legal" aria-label="Legal links"><a href="/about/privacy-policy/">Privacy Policy</a><a href="/about/cookies-policy/">Cookie Policy</a><a href="/about/terms-of-use/">Terms of Use</a><a href="/about/disclaimer/">Disclaimer</a></nav>');
    }
  });

  function applyTheme(themeName) {
    root.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEY, themeName);

    themeToggles.forEach(function (toggle) {
      const isLight = themeName === 'light';
      const icon = toggle.querySelector('.theme-toggle__icon') || document.createElement('span');
      icon.className = 'theme-toggle__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = isLight ? '☀' : '☾';
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      toggle.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      toggle.querySelectorAll('.theme-toggle__label').forEach(function (label) {
        label.remove();
      });
      if (!toggle.contains(icon)) {
        toggle.innerHTML = '';
        toggle.appendChild(icon);
      }
    });
  }

  applyTheme(initialTheme);

  function bindMobileNavigation() {
    navToggle = document.querySelector('[data-nav-toggle]');
    navMenu = document.querySelector('[data-nav-menu]');
    navInner = document.querySelector('.site-nav__inner');
    mobileMenuActions = document.querySelector('.site-nav__mobile-actions--menu');

    if (!navToggle || !navMenu || !navInner) {
      return;
    }

    navToggle.dataset.bound = 'true';
    navToggle.onclick = function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      this.setAttribute('aria-expanded', String(nextExpanded));
      this.setAttribute('aria-label', nextExpanded ? 'Close navigation menu' : 'Open navigation menu');
      this.textContent = nextExpanded ? '✕' : '☰';
      navMenu.classList.toggle('is-open', nextExpanded);
      if (mobileMenuActions) {
        mobileMenuActions.classList.toggle('is-open', nextExpanded);
      }
      navInner.classList.toggle('is-menu-open', nextExpanded);
      document.body.classList.toggle('menu-open', nextExpanded);
    };
  }

  bindMobileNavigation();

  // Mobile dropdown buttons
  document.querySelectorAll('.site-nav__dropdown-btn').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      const submenu = this.parentElement.nextElementSibling;
      
      if (submenu && submenu.classList.contains('submenu')) {
        const isOpen = submenu.classList.contains('is-open');
        const parentItem = this.closest('.has-submenu');
        const siblingButtons = parentItem && parentItem.parentElement
          ? parentItem.parentElement.querySelectorAll(':scope > .has-submenu > .site-nav__parent .site-nav__dropdown-btn')
          : [];

        siblingButtons.forEach(function (siblingBtn) {
          if (siblingBtn === btn) {
            return;
          }
          siblingBtn.setAttribute('aria-expanded', 'false');
          const siblingSubmenu = siblingBtn.parentElement.nextElementSibling;
          if (siblingSubmenu && siblingSubmenu.classList.contains('submenu')) {
            siblingSubmenu.classList.remove('is-open');
            siblingSubmenu.querySelectorAll('.submenu.is-open').forEach(function (nestedSubmenu) {
              nestedSubmenu.classList.remove('is-open');
            });
            siblingSubmenu.querySelectorAll('.site-nav__dropdown-btn').forEach(function (nestedBtn) {
              nestedBtn.setAttribute('aria-expanded', 'false');
            });
          }
        });

        this.setAttribute('aria-expanded', String(!isOpen));
        submenu.classList.toggle('is-open', !isOpen);
        if (isOpen) {
          submenu.querySelectorAll('.submenu.is-open').forEach(function (nestedSubmenu) {
            nestedSubmenu.classList.remove('is-open');
          });
          submenu.querySelectorAll('.site-nav__dropdown-btn').forEach(function (nestedBtn) {
            nestedBtn.setAttribute('aria-expanded', 'false');
          });
        }
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
