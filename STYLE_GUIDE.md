# ExMarkets Design System

This document defines the ExMarkets visual language, components, and layout foundations. Use `style.css` as the central stylesheet for tokens, utilities, and component styles.

## 1. Color Palette

- `--color-bg`: #0b1324 — primary page background
- `--color-surface`: #111f3d — main surface backgrounds
- `--color-surface-alt`: #15233e — secondary panels
- `--color-panel`: #172443 — accent panel surface
- `--color-text`: #e8eef7 — primary text
- `--color-muted`: #8ba3c8 — secondary text and disabled states
- `--color-border`: rgba(255, 255, 255, 0.08) — subtle borders
- `--color-primary`: #4f8cff — brand primary action
- `--color-primary-2`: #2faaff — accent gradient
- `--color-accent`: #16d9e3 — highlight and interactive accent
- `--color-success`: #4ade80 — success states
- `--color-warning`: #fbbf24 — warning states
- `--color-danger`: #fb7185 — danger states
- `--color-info`: #7c93ff — info and neutral highlights

## 2. Typography

### Font stacks
- Sans-serif: `var(--font-sans)`
- Mono: `var(--font-mono)`

### Text sizes
- `--text-hero`: 3rem
- `--text-large`: 2.25rem
- `--text-heading`: 1.5rem
- `--text-subtitle`: 1.125rem
- `--text-body`: 1rem
- `--text-small`: 0.875rem
- `--text-caption`: 0.75rem

### Typography principles
- Use strong, clean headings for market sections.
- Use muted text for metadata, labels, and secondary information.
- Keep line length optimized with the container width.

## 3. Spacing Scale

- `--space-0`: 0
- `--space-1`: 0.25rem
- `--space-2`: 0.5rem
- `--space-3`: 0.75rem
- `--space-4`: 1rem
- `--space-5`: 1.5rem
- `--space-6`: 2rem
- `--space-7`: 2.5rem
- `--space-8`: 3rem
- `--space-9`: 4rem

Use the spacing scale consistently for padding, gaps, and margins. Prefer multiples of the same scale to preserve visual rhythm.

## 4. Grid System

### Core classes
- `.container` — centers content and limits width to `var(--max-content-width)`
- `.grid` — base grid container with consistent gap
- `.grid--1`, `.grid--2`, `.grid--3`, `.grid--4` — fixed column counts
- `.grid--auto` — responsive auto-fit layout for cards and sections

### Layout patterns
- Use `.grid--auto` for dashboard cards and content panels.
- Use `.row` for horizontal alignment and utility groups.
- Use `.stack` and `.stack--tight` for vertical spacing between elements.

## 5. Border Radius

- `--radius-small`: 0.375rem
- `--radius-medium`: 0.75rem
- `--radius-large`: 1.25rem
- `--radius-pill`: 999px

Use rounded corners for surfaces, cards, buttons, and badges.

## 6. Shadows

- `--shadow-xs`: 0 1px 2px rgba(0, 0, 0, 0.08)
- `--shadow-sm`: 0 4px 12px rgba(0, 0, 0, 0.10)
- `--shadow-md`: 0 12px 30px rgba(0, 0, 0, 0.14)
- `--shadow-lg`: 0 24px 48px rgba(0, 0, 0, 0.18)

Use subtle shadows for depth. Reserve heavier shadows for floating panels and callouts.

## 7. Buttons

### Classes
- `.btn` — base button style
- `.btn--primary` — main action
- `.btn--secondary` — secondary action
- `.btn--ghost` — low-emphasis action
- `.btn--success` — positive state
- `.btn--danger` — destructive state
- `.btn--small` — compact variant

### Example markup

```html
<button class="btn btn--primary">Primary action</button>
<button class="btn btn--secondary">Secondary action</button>
<button class="btn btn--ghost">Ghost action</button>
```

## 8. Cards

### Card foundation
- `.card` — base card surface
- `.card--elevated` — stronger shadow
- `.card--panel` — accent panel style
- `.card__header` — card header container
- `.card__title` — title text
- `.card__meta` — supporting metadata

### Example markup

```html
<article class="card card--panel">
  <div class="card__header">
    <h2 class="card__title">Market insight</h2>
    <span class="card__meta">Updated 5 min ago</span>
  </div>
  <p>Top-level commentary and summary text live here.</p>
</article>
```

## 9. Icons

Icons are treated as compact interface indicators.

### Icon classes
- `.icon` — base icon container
- `.icon--muted` — lower emphasis icon

### Example markup

```html
<span class="icon" data-icon="🔍"></span>
<span class="icon icon--muted" data-icon="📈"></span>
```

## 10. Navigation styles

### Navigation structure
- `.nav` — global navigation wrapper
- `.nav__brand` — brand or logo text
- `.nav__links` — link group
- `.nav__link` — individual link
- `.nav__actions` — action buttons in the nav

### Example markup

```html
<nav class="nav">
  <div class="nav__brand">ExMarkets</div>
  <ul class="nav__links">
    <li><a href="#" class="nav__link">News</a></li>
    <li><a href="#" class="nav__link">Markets</a></li>
    <li><a href="#" class="nav__link">Insights</a></li>
  </ul>
  <div class="nav__actions">
    <button class="btn btn--ghost">Sign in</button>
    <button class="btn btn--primary">Subscribe</button>
  </div>
</nav>
```

## 11. Tables

### Table classes
- `.table` — base table layout
- `.table--zebra` — alternate row shading
- `.table__status` — badge-style status indicator

### Example markup

```html
<table class="table table--zebra">
  <thead>
    <tr>
      <th>Market</th>
      <th>Price</th>
      <th>Change</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Equities</td>
      <td>$1,279</td>
      <td>+1.4%</td>
      <td><span class="table__status">Bullish</span></td>
    </tr>
  </tbody>
</table>
```

## 12. Charts placeholders

Use chart placeholders for architecture planning and page layout before final visualizations are implemented.

### Chart classes
- `.chart-card` — placeholder container
- `.chart-card__title` — title text
- `.chart-card__note` — supporting note

### Example markup

```html
<section class="chart-card">
  <div>
    <h3 class="chart-card__title">Chart placeholder</h3>
    <p class="chart-card__note">Visualizations appear here in the next phase.</p>
  </div>
</section>
```

## 13. Utility classes

- `.text-brand` — brand-colored text
- `.text-muted` — muted text
- `.text-uppercase` — uppercase with letter spacing
- `.shadow--sm`, `.shadow--md`, `.shadow--lg` — shadow utilities
- `.radius--small`, `.radius--medium`, `.radius--large`, `.radius--pill` — radius utilities

## 14. Implementation notes

- The design language is built for a financial news experience with high contrast, crisp typography, and subtle depth.
- Use consistent spacing, color roles, and component classes across pages.
- Keep interaction states visible through hover, focus, and active styles.
- The style guide is intentionally neutral to adapt easily to text-heavy and data-driven layouts.
