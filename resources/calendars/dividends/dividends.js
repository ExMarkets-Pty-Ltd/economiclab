(function () {
  'use strict';

  const events = [
    { company: 'Apple Inc.', ticker: 'AAPL', country: 'United States', dividend: 0.26, currency: 'USD', yield: 0.44, exDate: '2026-08-07', recordDate: '2026-08-10', paymentDate: '2026-08-13' },
    { company: 'Microsoft Corp.', ticker: 'MSFT', country: 'United States', dividend: 0.83, currency: 'USD', yield: 0.68, exDate: '2026-08-13', recordDate: '2026-08-14', paymentDate: '2026-09-10' },
    { company: 'Coca-Cola Co.', ticker: 'KO', country: 'United States', dividend: 0.51, currency: 'USD', yield: 2.73, exDate: '2026-08-14', recordDate: '2026-08-17', paymentDate: '2026-09-15' },
    { company: 'Rio Tinto plc', ticker: 'RIO', country: 'United Kingdom', dividend: 1.24, currency: 'USD', yield: 4.12, exDate: '2026-08-20', recordDate: '2026-08-21', paymentDate: '2026-09-17' },
    { company: 'Nedbank Group', ticker: 'NED', country: 'South Africa', dividend: 7.98, currency: 'ZAR', yield: 6.84, exDate: '2026-08-24', recordDate: '2026-08-25', paymentDate: '2026-08-24' },
    { company: 'Toyota Motor Corp.', ticker: 'TM', country: 'Japan', dividend: 1.12, currency: 'USD', yield: 2.34, exDate: '2026-08-25', recordDate: '2026-08-26', paymentDate: '2026-09-04' },
    { company: 'Siemens AG', ticker: 'SIEGY', country: 'Germany', dividend: 1.58, currency: 'EUR', yield: 2.18, exDate: '2026-09-02', recordDate: '2026-09-03', paymentDate: '2026-09-18' },
    { company: 'BHP Group', ticker: 'BHP', country: 'Australia', dividend: 1.44, currency: 'USD', yield: 5.21, exDate: '2026-09-04', recordDate: '2026-09-07', paymentDate: '2026-09-22' },
    { company: 'Nestle SA', ticker: 'NSRGY', country: 'Switzerland', dividend: 3.10, currency: 'CHF', yield: 3.05, exDate: '2026-09-08', recordDate: '2026-09-09', paymentDate: '2026-09-25' }
  ];
  const today = new Date('2026-08-24T00:00:00');
  let period = new Date('2026-08-01T00:00:00');
  const $ = (id) => document.getElementById(id);
  const dateValue = (value) => new Date(value + 'T00:00:00');
  const formatDate = (value) => dateValue(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatPeriod = () => period.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  const statusFor = (event) => sameDay(dateValue(event.exDate), today) ? 'Ex-Dividend' : sameDay(dateValue(event.paymentDate), today) ? 'Payment Date' : 'Upcoming';

  function filteredEvents() {
    const query = $('dividend-search').value.trim().toLowerCase();
    const country = $('dividend-country').value;
    const dateFilter = $('dividend-date').value;
    const status = $('dividend-status').value;
    const periodMonth = period.getMonth();
    const periodYear = period.getFullYear();
    return events.filter((event) => {
      const exDate = dateValue(event.exDate);
      const paymentDate = dateValue(event.paymentDate);
      const matchesPeriod = exDate.getMonth() === period.getMonth() && exDate.getFullYear() === period.getFullYear();
      const matchesQuery = !query || event.company.toLowerCase().includes(query) || event.ticker.toLowerCase().includes(query);
      const matchesCountry = country === 'all' || event.country === country;
      const matchesDate = dateFilter === 'all' || (dateFilter === 'today' && (sameDay(exDate, today) || sameDay(paymentDate, today))) || (dateFilter === 'week' && exDate >= today && exDate <= new Date(today.getTime() + 7 * 86400000)) || (dateFilter === 'month' && exDate.getMonth() === periodMonth && exDate.getFullYear() === periodYear) || (dateFilter === 'next-month' && exDate.getMonth() === (periodMonth + 1) % 12 && exDate.getFullYear() === periodYear + (periodMonth === 11 ? 1 : 0));
      const matchesStatus = status === 'all' || (status === 'payment' && sameDay(paymentDate, today)) || (status === 'ex-dividend' && sameDay(exDate, today)) || (status === 'upcoming' && exDate >= today);
      return matchesPeriod && matchesQuery && matchesCountry && matchesDate && matchesStatus;
    });
  }

  function render() {
    const matching = filteredEvents();
    $('dividend-period').textContent = formatPeriod();
    $('dividend-result-count').textContent = matching.length + ' event' + (matching.length === 1 ? '' : 's');
    $('dividend-table-body').innerHTML = matching.map((event) => '<tr><td data-label="Date">' + formatDate(event.exDate) + '</td><td data-label="Company"><strong>' + event.company + '</strong></td><td data-label="Ticker"><span class="dividend-ticker">' + event.ticker + '</span></td><td data-label="Country">' + event.country + '</td><td data-label="Dividend"><strong>' + event.dividend.toFixed(2) + '</strong></td><td data-label="Currency">' + event.currency + '</td><td data-label="Ex-dividend">' + formatDate(event.exDate) + '</td><td data-label="Payment date">' + formatDate(event.paymentDate) + '</td></tr>').join('');
    $('dividend-empty').hidden = matching.length !== 0;
    $('dividend-stats').innerHTML = [['Upcoming dividends', events.filter((event) => dateValue(event.exDate) >= today).length], ['Paying today', events.filter((event) => sameDay(dateValue(event.paymentDate), today)).length], ['Highest dividend yield', Math.max(...events.map((event) => event.yield)).toFixed(2) + '%'], ['Countries represented', new Set(events.map((event) => event.country)).size]].map((stat) => '<div class="dividend-stat"><span>' + stat[0] + '</span><strong>' + stat[1] + '</strong></div>').join('');
  }

  function reset() {
    $('dividend-search').value = '';
    $('dividend-country').value = 'all';
    $('dividend-date').value = 'all';
    $('dividend-status').value = 'all';
    period = new Date('2026-08-01T00:00:00');
    render();
  }

  [...new Set(events.map((event) => event.country))].sort().forEach((country) => $('dividend-country').insertAdjacentHTML('beforeend', '<option value="' + country + '">' + country + '</option>'));
  document.querySelectorAll('#dividend-search, #dividend-country, #dividend-date, #dividend-status').forEach((control) => control.addEventListener('input', render));
  $('dividend-reset').addEventListener('click', reset);
  document.querySelector('[data-reset-dividends]').addEventListener('click', reset);
  $('dividend-previous').addEventListener('click', () => { period.setMonth(period.getMonth() - 1); render(); });
  $('dividend-next').addEventListener('click', () => { period.setMonth(period.getMonth() + 1); render(); });
  $('dividend-today').addEventListener('click', () => { period = new Date(today.getFullYear(), today.getMonth(), 1); render(); });
  $('dividend-retry').addEventListener('click', render);
  render();
})();
