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

  function createSubmenu(id, label, items, href) {
    return '<li class="has-submenu"><div class="site-nav__parent"><a class="site-nav__link" href="' + href + '">' + label + '</a><button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="' + id + '" aria-label="Toggle ' + label + ' submenu"></button></div><ul class="submenu" id="' + id + '">' + items.map(function (item) {
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
      { label: 'Markets', href: '/markets' },
      { label: 'Business', href: '/companies' },
      { label: 'Technology', href: '/technology' },
      { label: 'Economy', href: '/economy' }
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

    const resourcesMarkup = '<li class="has-submenu"><div class="site-nav__parent"><a class="site-nav__link" href="/data">Data</a><button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="submenu-resources" aria-label="Toggle Data submenu"></button></div><ul class="submenu" id="submenu-resources">' + createSubmenu('submenu-calendars', 'Calendars', calendars, '/data/calendars') + '<li><a class="site-nav__link" href="/data/biggest-market-movers/">Biggest Market Movers</a></li><li><a class="site-nav__link" href="/tradingview">Charts</a></li><li><a class="site-nav__link" href="/markets/broker-comparison/">Broker Comparison</a></li></ul></li>';
    const mobileHeaderActions = '<div class="site-nav__mobile-actions site-nav__mobile-actions--header"><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button><button class="site-nav__toggle btn btn--ghost btn--small" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-navigation" aria-label="Open menu">☰</button></div>';
    const desktopActions = '<div class="site-nav__actions"><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button><button class="btn btn--ghost btn--small site-nav__action-btn site-nav__action-btn--signin" type="button">Sign In</button><button class="btn btn--primary btn--small site-nav__action-btn site-nav__action-btn--primary" type="button">Get Started</button></div>';
    const mobileMenuActions = '<div class="site-nav__mobile-actions site-nav__mobile-actions--menu"><button class="btn btn--ghost btn--small site-nav__action-btn site-nav__action-btn--signin" type="button">Sign In</button><button class="btn btn--primary btn--small site-nav__action-btn site-nav__action-btn--primary" type="button">Get Started</button><div class="site-nav__mobile-actions--icons"><button class="btn btn--ghost btn--small theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode"><span class="theme-toggle__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5V5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l-1.77 1.77M17.3 6.7l-1.77-1.77"></path></svg></span></button><button class="btn btn--ghost btn--small site-nav__search-btn" type="button" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="5.5"></circle><path d="M16 16L21 21"></path></svg></button></div></div>';
    header.innerHTML = '<div class="site-nav__inner"><a class="site-nav__brand" href="/" aria-label="EconomicLab home"><img class="logo logo-light" src="/assets/images/ExMarkets Premium Transparent Black logo.png" alt="EconomicLab" /><img class="logo logo-dark" src="/assets/images/ExMarkets White Transparent logo.png" alt="EconomicLab" /><span class="sr-only">EconomicLab</span></a>' + mobileHeaderActions + '<ul class="site-nav__links" id="site-navigation" data-nav-menu>' + createSubmenu('submenu-trading', 'Markets', trading, '/markets') + resourcesMarkup + '<li><a class="site-nav__link" href="/solutions">Solutions</a></li>' + createSubmenu('submenu-insights', 'Insights', insights, '/insights') + '<li><a class="site-nav__link" href="/education">Education</a></li>' + '</ul>' + mobileMenuActions + desktopActions + '</div>';

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
  document.querySelectorAll('.site-nav__action-btn--primary').forEach(function (button) {
    const link = document.createElement('a');
    link.className = button.className;
    link.href = '/subscription/pricing/';
    link.textContent = button.textContent;
    button.replaceWith(link);
  });
  document.querySelectorAll('.site-nav__action-btn--signin').forEach(function (button) {
    button.setAttribute('aria-disabled', 'true');
    button.title = 'Sign-in is not available yet';
  });

  const searchDialog = document.createElement('dialog');
  searchDialog.className = 'site-search-dialog';
  searchDialog.setAttribute('aria-labelledby', 'site-search-title');
  searchDialog.innerHTML = '<div class="site-search-dialog__form"><div class="site-search-dialog__heading"><label id="site-search-title" for="site-search-input">Search EconomicLab</label><button class="btn btn--ghost btn--small" type="button" data-search-close aria-label="Close search">×</button></div><input id="site-search-input" type="search" autocomplete="off" placeholder="Search pages" /><p class="site-search-dialog__status" role="status">Type to search EconomicLab pages.</p><ul class="site-search-dialog__results"></ul></div>';
  document.body.appendChild(searchDialog);
  const searchInput = searchDialog.querySelector('#site-search-input');
  const searchStatus = searchDialog.querySelector('.site-search-dialog__status');
  const searchResults = searchDialog.querySelector('.site-search-dialog__results');
  let searchIndex = null;
  let searchIndexRequest = null;

  function getPageLabel(path) {
    const fixedLabels = {
      '/': 'Home',
      '/markets': 'Markets',
      '/data': 'Data',
      '/insights': 'Insights',
      '/solutions': 'Solutions',
      '/education': 'Education'
    };
    if (fixedLabels[path]) {
      return fixedLabels[path];
    }

    return path.split('/').filter(Boolean).pop()
      .replace(/\.html$/, '')
      .split('-')
      .map(function (part) {
        return part.toUpperCase() === part ? part : part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function loadSearchIndex() {
    if (searchIndex) {
      return Promise.resolve(searchIndex);
    }
    if (!searchIndexRequest) {
      searchIndexRequest = fetch('/sitemap.xml').then(function (response) {
        if (!response.ok) {
          throw new Error('Search index request failed with HTTP ' + response.status);
        }
        return response.text();
      }).then(function (xml) {
        const sitemap = new DOMParser().parseFromString(xml, 'application/xml');
        if (sitemap.querySelector('parsererror')) {
          throw new Error('Search index sitemap is invalid XML');
        }
        searchIndex = Array.from(sitemap.querySelectorAll('loc')).map(function (location) {
          const url = new URL(location.textContent, window.location.origin);
          if (
            url.hostname !== window.location.hostname &&
            url.hostname !== 'economiclab.co.za' &&
            url.hostname !== 'www.economiclab.co.za'
          ) {
            return null;
          }
          return { href: url.pathname, label: getPageLabel(url.pathname) };
        }).filter(Boolean);
        return searchIndex;
      }).catch(function (error) {
        searchIndexRequest = null;
        throw error;
      });
    }
    return searchIndexRequest;
  }

  function renderSearchResults(query) {
    searchResults.replaceChildren();
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      searchStatus.textContent = 'Type to search EconomicLab pages.';
      return;
    }
    loadSearchIndex().then(function (pages) {
      const matches = pages.filter(function (page) {
        return (page.label + ' ' + page.href).toLowerCase().includes(normalizedQuery);
      }).slice(0, 10);
      searchResults.replaceChildren();
      matches.forEach(function (page) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = page.href;
        link.textContent = page.label;
        item.appendChild(link);
        searchResults.appendChild(item);
      });
      searchStatus.textContent = matches.length ? matches.length + ' matching pages' : 'No matching pages found.';
    }).catch(function (error) {
      console.error('Unable to load site search index', error);
      searchStatus.textContent = 'Search is temporarily unavailable. Please try again.';
    });
  }

  document.querySelectorAll('.site-nav__search-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      searchDialog.showModal();
      searchInput.focus();
      renderSearchResults(searchInput.value);
    });
  });
  searchDialog.querySelector('[data-search-close]').addEventListener('click', function () {
    searchDialog.close();
  });
  searchInput.addEventListener('input', function () {
    renderSearchResults(this.value);
  });

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

  function applyTheme(themeName) {
    root.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEY, themeName);

    themeToggles.forEach(function (toggle) {
      const isLight = themeName === 'light';
      const icon = toggle.querySelector('.theme-toggle__icon') || document.createElement('span');
      icon.className = 'theme-toggle__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = isLight
        ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2m7.07-17.07-1.42 1.42M6.35 17.65l-1.42 1.42M22 12h-2M4 12H2m17.07 7.07-1.42-1.42M6.35 6.35 4.93 4.93"></path></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M20.985 12.486A9 9 0 1 1 11.514 3.015a7 7 0 0 0 9.471 9.471Z"></path></svg>';
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

})();
