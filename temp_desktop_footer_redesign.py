from pathlib import Path

root = Path(r'C:\Users\Usere\Documents\GitHub\exmarkets')
files = list(root.glob('*.html')) + [root / 'articles' / 'article-template.html']

for path in files:
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    if 'class="container footer__grid footer__desktop"' not in text:
        continue

    prefix = '../' if 'articles' in path.parts else ''

    block = f'''      <div class="container footer__grid footer__desktop">
        <div class="footer__row footer__row--branding">
          <div class="footer__brand-section">
            <a class="site-nav__brand" href="{prefix}index.html" aria-label="exMarkets home">
              <img class="logo logo-light" src="{prefix}assets/images/ExMarkets Black Transparent Logo.png" alt="exMarkets" />
              <img class="logo logo-dark" src="{prefix}assets/images/ExMarkets White Transparent logo.png" alt="exMarkets" />
              <span class="sr-only">exMarkets</span>
            </a>
            <p class="text-muted footer__description">
              Financial Markets Research &amp; Insights providing clear market intelligence, research and analysis across global financial markets.
            </p>
          </div>
        </div>

        <div class="footer__row footer__row--sections">
          <div class="footer__column">
            <h3 class="h3 footer__heading">COMPANY</h3>
            <ul class="footer__links">
              <li><a href="{prefix}about.html">Who we are</a></li>
              <li><a href="{prefix}blog.html">Blog</a></li>
              <li><a href="{prefix}contact.html">Help Center</a></li>
              <li><a href="{prefix}contact.html">Careers</a></li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">CALENDARS</h3>
            <ul class="footer__links">
              <li><a href="{prefix}economic-calendar.html">Economics</a></li>
              <li><a href="{prefix}economic-calendar.html">Earnings</a></li>
              <li><a href="{prefix}economic-calendar.html">Dividends</a></li>
              <li><a href="{prefix}economic-calendar.html">IPOs</a></li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">COMMUNITY</h3>
            <ul class="footer__links">
              <li>Social network</li>
              <li>Refer a friend</li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">GROWTH OPPORTUNITIES</h3>
            <ul class="footer__links">
              <li><a href="{prefix}contact.html">Advertising</a></li>
              <li><a href="{prefix}contact.html">Partner program</a></li>
              <li><a href="{prefix}contact.html">Education program</a></li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">SUBSCRIPTION</h3>
            <ul class="footer__links">
              <li>Pricing</li>
            </ul>
          </div>
        </div>

        <div class="footer__row footer__row--bottom">
          <div class="footer__column">
            <h3 class="h3 footer__heading">BIGGEST MARKET MOVERS</h3>
            <ul class="footer__links">
              <li>Federal Reserve (Fed) interest-rate decisions</li>
              <li>US CPI / Inflation</li>
              <li>US Nonfarm Payrolls (NFP)</li>
              <li>US PCE Inflation</li>
              <li>US GDP</li>
              <li>ECB</li>
              <li>BoE</li>
              <li>BoJ</li>
              <li>SARB interest-rate decisions</li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">TRADING</h3>
            <ul class="footer__links">
              <li><a href="{prefix}markets.html">Overview</a></li>
              <li><a href="{prefix}brokers.html">Brokers</a></li>
              <li><a href="{prefix}brokers.html">Brokers comparison</a></li>
            </ul>
          </div>

          <div class="footer__column">
            <h3 class="h3 footer__heading">POLICIES &amp; SECURITY</h3>
            <ul class="footer__links">
              <li><a href="{prefix}about.html">Terms of Use</a></li>
              <li><a href="{prefix}about.html">Disclaimer</a></li>
              <li><a href="{prefix}about.html">Privacy Policy</a></li>
              <li><a href="{prefix}about.html">Cookies Policy</a></li>
            </ul>
          </div>

          <div class="footer__column footer__column--empty" aria-hidden="true"></div>
          <div class="footer__column footer__column--empty" aria-hidden="true"></div>
        </div>
      </div>
'''

    start = text.index('<div class="container footer__grid footer__desktop">')
    end = text.index('</div>\n\n      <div class="footer__mobile">', start)
    if end == -1:
        continue
    text = text[:start] + block + text[end + len('</div>'):]  # leave the mobile div start intact
    path.write_text(text, encoding='utf-8')
    print(f'UPDATED {path.name}')
