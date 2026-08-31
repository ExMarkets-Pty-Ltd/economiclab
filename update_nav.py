import os
import re
from pathlib import Path

root = Path(r'C:\Users\Usere\Documents\GitHub\economiclab')
updated_count = 0

# Old navigation pattern 
old_section = '''          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">Insights</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-insights" aria-label="Toggle Insights submenu"></button>
            </div>
            <ul class="submenu" id="submenu-insights">
              <li><a class="site-nav__link" href="markets.html">Markets</a></li>
              <li><a class="site-nav__link" href="companies.html">Business</a></li>
              <li><a class="site-nav__link" href="technology.html">Technology</a></li>
              <li><a class="site-nav__link" href="economy.html">Economy</a></li>
            </ul>
          </li>
          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">Data</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-resources" aria-label="Toggle Resources submenu"></button>
            </div>
            <ul class="submenu" id="submenu-resources">
              <li><a class="site-nav__link" href="/data/calendars/economics/">Economic Calendar</a></li>
              <li><a class="site-nav__link" href="tradingview.html">Charts</a></li>
              <li><a class="site-nav__link" href="/markets/broker-comparison/">Broker Comparison</a></li>
            </ul>
          </li>
          <li><a class="site-nav__link" href="companies.html">Companies</a></li>
          <li><a class="site-nav__link" href="blog.html">Blog</a></li>
          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">About</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-about" aria-label="Toggle About submenu"></button>
            </div>
            <ul class="submenu" id="submenu-about">
              <li><a class="site-nav__link" href="about.html">About EconomicLab</a></li>
              <li><a class="site-nav__link" href="contact.html">Contact</a></li>
            </ul>
          </li>'''

new_section = '''          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">Markets</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-trading" aria-label="Toggle Markets submenu"></button>
            </div>
            <ul class="submenu" id="submenu-trading">
              <li><a class="site-nav__link" href="/markets/overview/">Overview</a></li>
              <li><a class="site-nav__link" href="/markets/forex/">Forex</a></li>
              <li><a class="site-nav__link" href="/markets/gold-commodities/">Gold & Commodities</a></li>
              <li><a class="site-nav__link" href="/markets/indices/">Indices</a></li>
              <li><a class="site-nav__link" href="/markets/stocks/">Stocks</a></li>
              <li><a class="site-nav__link" href="/markets/cryptocurrencies/">Cryptocurrencies</a></li>
              <li><a class="site-nav__link" href="/markets/brokers/">Brokers</a></li>
              <li><a class="site-nav__link" href="/markets/broker-comparison/">Broker Comparison</a></li>
              <li><a class="site-nav__link" href="/markets/platforms/">Platforms</a></li>
              <li><a class="site-nav__link" href="/markets/strategies/">Strategies</a></li>
              <li><a class="site-nav__link" href="/markets/risk-management/">Risk Management</a></li>
            </ul>
          </li>
          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">Data</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-resources" aria-label="Toggle Data submenu"></button>
            </div>
            <ul class="submenu" id="submenu-resources">
              <li><a class="site-nav__link" href="/data/calendars/economics/">Economic Calendar</a></li>
              <li><a class="site-nav__link" href="tradingview.html">Charts</a></li>
              <li><a class="site-nav__link" href="/markets/broker-comparison/">Broker Comparison</a></li>
            </ul>
          </li>
          <li><a class="site-nav__link" href="/">Solutions</a></li>
          <li class="has-submenu">
            <div class="site-nav__parent">
              <a class="site-nav__link" href="">Insights</a>
              <button class="site-nav__dropdown-btn" type="button" aria-expanded="false" aria-controls="submenu-insights" aria-label="Toggle Insights submenu"></button>
            </div>
            <ul class="submenu" id="submenu-insights">
              <li><a class="site-nav__link" href="markets.html">Markets</a></li>
              <li><a class="site-nav__link" href="companies.html">Business</a></li>
              <li><a class="site-nav__link" href="technology.html">Technology</a></li>
              <li><a class="site-nav__link" href="economy.html">Economy</a></li>
            </ul>
          </li>
          <li><a class="site-nav__link" href="/">Education</a></li>'''

for html_file in root.rglob('*.html'):
    try:
        content = html_file.read_text(encoding='utf-8')
        if old_section in content:
            new_content = content.replace(old_section, new_section)
            html_file.write_text(new_content, encoding='utf-8')
            updated_count += 1
            print(f"Updated: {html_file.relative_to(root)}")
    except Exception as e:
        print(f"Error in {html_file}: {e}")

print(f"\nTotal files updated: {updated_count}")
