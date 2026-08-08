# ExMarkets Design System Style Guide

A complete documentation of the ExMarkets visual language, including color palettes, typography scales, component designs, and utility classes.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Spacing Scale & Layout](#spacing-scale--layout)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Buttons](#buttons)
8. [Cards](#cards)
9. [Navigation Components](#navigation-components)
10. [Tables & Data Displays](#tables--data-displays)
11. [Chart Placeholders](#chart-placeholders)
12. [Icon System](#icon-system)

---

## Brand Identity

### Logo Typography (ExMarkets Text-only logo used in navigation)
- **Font:** Inter, sans-serif with uppercase text and tight letter-spacing (`0.16em`)
- **Weight:** 800 Extra Bold for strong visual presence  
- **Color:** `var(--color-text)` - Light gray/blue (#e8eef7)

### Design Philosophy
Modern fintech aesthetic combining:
- Deep navy backgrounds with cyan/teal accents
- Clean, readable typography (Inter font family)
- Subtle gradients and smooth transitions (`180ms ease`)
- Professional yet approachable feel suitable for financial data display

---

## Color Palette

### Primary Colors
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--color-primary` | #4f8cff | Primary blue gradient base (starts here) | Main action states, links on dark background |
| `--color-primary-2` | #2faaff | Lighter primary cyan/blue | Gradients to create depth |

### Accent Colors
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--color-accent` | #16d9e3 | Bright cyan accent | Highlights, icons with focus states |
| `--color-info` | #7c93ff | Medium blue for informational elements | Info notifications, secondary highlights |

### Status Colors (Semantic)
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--color-success` | #4ade80 | Green for success states | Positive data points, completed actions |
| `--color-warning` | #fbbf24 | Amber/orange for warnings | Attention required indicators |
| `--color-danger` | #fb7185 | Red/pink for errors/danger | Negative values, destructive actions |

### Background & Surface Colors (Dark Theme)
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--color-bg` | #0b1324 | Base background color | Page backgrounds |
| `--color-surface` | #111f3d | Primary surface/container | Cards, panels |
| `--color-surface-alt` | #15233e | Secondary surface element | Alternating card states |
| `--color-panel` | #172443 | Panel backgrounds | Section containers |

### Border & Text Colors
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--color-border` | rgba(255, 255, 255, 0.08) | Subtle border color | Card borders, table rows |
| `--color-text` | #e8eef7 | Primary text on dark backgrounds | Headings, body text |
| `--color-muted` | #8ba3c8 | Secondary/muted text | Meta information, labels |

### Background Gradients (Body)
```css
background: radial-gradient(circle at top left, rgba(79, 140, 255, 0.12), transparent 28%),
            radial-gradient(circle at bottom right, rgba(22, 217, 227, 0.08), transparent 24%),
            var(--color-bg);
```

---

## Typography System

### Font Families

**Primary Sans-Serif:**
```css
--font-sans: "Inter", "Segoe UI", Roboto, Oxygen, Ubuntu, 
             Cantarell, "Helvetica Neue", sans-serif;
```

**Monospace (for financial data):**
```css
--font-mono: "Fira Code", "JetBrains Mono", Menlo, Monaco, 
              Consolas, "Liberation Mono", monospace;
```

### Type Scale

| Variable | Size | Weight | Description | Use Case |
|----------|------|--------|-------------|----------|
| `--text-hero` | 3rem (48px) | 700-900 | Large headings, hero text | Hero sections |
| `--text-heading` | 1.5rem (24px) | 600 | Section headers, card titles | Main content hierarchy |
| `--text-subtitle` | 1.125rem (18px) | 700-800 | Subtitles, nav branding | Navigation, subtitles |
| `--text-body` | 1rem (16px) | 400 | Main body text | Paragraph content |
| `--text-small` | 0.875rem (14px) | 400-500 | Small details | Secondary information |
| `--text-caption` | 0.75rem (12px) | 400 | Captions, labels | Status indicators |

### Type Scale CSS Variable Reference
```css
/* All typography sizes */
--font-sans: "Inter", sans-serif;
--font-mono: "Fira Code", monospace;

var(--text-large):    font-size: 2.25rem (36px); 
var(--text-hero):     font-size: 3rem (48px) for hero text with higher weight
   
/* Standard headings */
var(--text-heading):  font-size: 1.5rem;
var(--text-subtitle): font-size: 1.125rem;

/* Body and small text */
var(--text-body):     font-size: 1rem; /* 16px, line-height: 1.6 */
var(--text-small):    font-size: 0.875rem (14px);
var(--text-caption):  font-size: 0.75rem (12px);

/* Line height is base set on root */
html { 
  line-height: 1.6; /* ~29px for body text at this size */
}
```

### Typography Usage Guidelines
- **Headings:** Use `var(--text-heading)` or larger with font-weight 700+
- **Navigation Branding:** Apply uppercase transform + tight letter-spacing (`letter-spacing: -1.6em` which equals `-0.16rem`)  
- **Body Text:** Always use proper line-height (1.5+) for readability on financial data displays
- **Monospace Numbers:** Use `var(--font-mono)` for numerical/financial values to ensure consistency across screens

---

## Spacing Scale & Layout

### Spacing Tokens (4rem increments based)
```css
/* All spacing variables */
var(--space-0):      0px;
var(--space-1):      0.25rem (4px);
var(--space-2):      0.5rem (8px);
var(--space-3):      0.75rem (12px);
var(--space-4):      1rem (16px) — base spacing unit;
var(--space-5):      1.5rem (24px);
var(--space-6):      2rem (32px);
var(--space-7):      2.5rem (40px);
var(--space-8):      3rem (48px) — large section spacing;
var(--space-9):      4rem (64px) — hero/large gap space;
```

### Container Width & Layout Variables
| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `--max-content-width` | 1200px | Maximum content width before narrowing | All containers use min(100%, var(--max-content-width)) |
| `--grid-gap` | 1.5rem (24px) | Default grid item gap between columns/rows | Grid layouts, flexbox with row utility |

### Layout Utilities CSS Reference
```css
/* Container: Max width centered */
.container {
  max-width: min(100%, var(--max-content-width));
  margin-inline: auto;      /* Centered horizontally */
  padding-inline: var(--space-4); /* Side spacing on both edges */
}

/* Grid systems (CSS grid) */
.grid--1   { grid-template-columns: 1fr }           /* Single column full width */
.grid--2   { grid-template-columns: repeat(2, minmax(0, 1fr)) } 
.grid--3   { grid-template-columns: repeat(3, minmax(0, 1fr)) } 
.grid--4   { grid-template-columns: repeat(4, minmax(0, 1fr)) }
.grid--auto{ grid-template-columns: repeat(auto-fit, minmax(288px, 1fr)); } /* Responsive columns */

/* Gap applied via .grid class or inline-gap style */

/* Flex container for rows */
.row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: var(--space-4); 
}

/* Align items vertically center when needed */
.row--aligned { align-items: center; }
```

---

## Border Radius System

| Variable | Value | Description | Use Case |
|----------|-------|-------------|----------|
| `var(--radius-small)` | 0.375rem (6px) | Subtle border radius for small elements | Input fields, icon backgrounds |
| `var(--radius-medium)` | 0.75rem (12px) | Standard card/button corner rounding | Most buttons, cards by default |
| `var(--radius-large)` | 1.25rem (20px) | Generous radius for prominent UI elements | Featured actions, highlighted cards |
| `var(--radius-pill)` | 999px* | Fully rounded/pill shape | Status badges, navigation toggles |

---

## Shadows System

### Shadow Scale Tokens
```css
/* Box shadow utilities */
var(--shadow-xs):   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);     -- Very subtle elevation
var(--shadow-sm):   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);      -- Small lift effect  
var(--shadow-md):   box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);     -- Medium depth
var(--shadow-lg):   box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);    -- Large prominence
```

### Shadow Classes CSS Reference
- `.shadow--xs` - Minimal lift for flat surfaces  
- `.shadow--sm` - Standard button/card elevation when hovered or focused   
- `.shadow--md` - Noticeable depth for elevated containers 
- `.shadow--lg` - Dramatic shadow for featured elements at viewport edge  

---

## Buttons

### Button Base Styling
```css
/* All buttons use this base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);        /* Default spacing between icon/text (8px) */
  
  min-height: calc(3rem + px to match font-size); /* Height adjusts with content typically ~48px for large fonts, smaller when text only (~1.5rem or 24px base) - actually we see it's hardcoded at var(--space-7 = 24px minimum but actual rendered height may vary */
  
  padding: calc(0 to match container); /* Standardized button padding across sizes using appropriate px values for different font/size contexts (typically around ~8px vertical, ~16px horizontal) - see variations below */ 
  
  
border-radius: var(--radius-large);     /* Default rounded corners = 20px radius */
  border-color: transparent;            /* No visible borders unless specified */
  
/* Typography styling inherited from parent or set explicitly on smaller sizes */
font-weight: 700;          /* Bold weight ensures clear button text legibility without relying solely on contrast differences for accessibility compliance across all UI contexts where color-only interaction states might occur under varying brightness/contrast conditions per WCAG guidelines in certain dark/light scenarios if applicable to this particular design system implementation context or when used against alternative background surfaces instead of primary page backgrounds */
  
  cursor: pointer;          /* Standard interactive feedback visual indication that element responds well enough via hover animation on focusable elements within our main color contrast threshold requirements ensuring minimum relative luminance differences meet WCAG accessibility standards across all button styles regardless of whether they appear alone or adjacent to other UI components like icons, text labels etcetera */
  
  transition: transform var(--duration-180ms) ease-in-out,                /* Smooth hover/active states for visual feedback without abrupt jumps between original/restling down slightly on mouse movement direction changes indicating interactivity cues throughout user interactions with various interactive elements including focus rings when keyboard navigation applied appropriately via CSS outline properties set elsewhere within this design system's stylesheet file covering all button types and variants defined here along with secondary actions, links styled as buttons */
                    box-shadow var(--duration-180ms) ease-in-out,          /* Adds shadow/depth to hover states for enhanced visibility on elevated surface elements or when used alongside subtle background color changes within the same container context if needed beyond standard outline focus ring behavior which is handled separately per button state requirements in this particular implementation */
                    background-color var(--duration-180ms) ease-in-out,    /* Smooth transitions ensuring smooth user experience during hover/active interactions across all applicable UI states defined throughout our entire design system documentation covering various component types including cards tables charts etcetera mentioned earlier alongside buttons themselves and their multiple variant forms outlined below */
                    border-color var(--duration-180ms) ease-in-out;         /* Border color transitions for button variants with colored borders or solid backgrounds that might change hue based on context-specific requirements beyond standard interactive feedback signals like hovers/focus states described within this section specifically about buttons themselves as standalone UI elements not nested inside other containers unless explicitly requested otherwise by specific use cases calling into the design system's button component utility functions defined elsewhere in our codebase repositories outside of documentation purposes which would require examining source files directly rather than just reading markdown style guides for reference only */
}

/* Focus-visible states (keyboard navigation) - outlined ring instead of solid border when focused via keyboard/assistive tech not mouse/touch interactions triggering hover events described above handling both physical and assistive technologies accessing the same interface elements through different input mechanisms simultaneously but producing similar visual feedback consistent with design system guidelines established throughout this document */
.btn:focus-visible {
  outline: var(--focus-ring-width-2px) solid rgba(22, 217, 227, 0.9);    /* Cyan ring color matches accent theme = #4f8cff (primary blue) at opacity level chosen to maintain visibility against both light/dark backgrounds without overwhelming contrast ratios required per WCAG guidelines specified elsewhere in this style guide under accessibility section if applicable beyond current scope of button component definition */
  outline-offset: var(--focus-ring-offset-3px);                            /* Offset from edge creates breathing room between outermost ring and actual clickable boundary area defined by border-radius shape rather than sharp corners when element has no visible borders or just subtle background differences compared to surrounding page/content structure context where this focus state is rendered against */
}

/* Hover states (mouse/touch interactions) - slightly elevated via translateY(-1px) visual cue indicating active/inactive switch without changing underlying DOM content/behavior only affecting rendering layer temporarily until interaction ends causing revert back to original rest state specified above before hover conditions were satisfied initially triggering animation start defined within transition properties listed alongside other CSS custom property variable references found throughout this style guide under various component sections including buttons cards tables charts etcetera mentioned earlier in different contexts unrelated specifically here but following consistent design patterns across entire ExMarkets UI framework documentation currently being compiled into single markdown file format for easy reference purposes by developers designing new features or modifying existing ones */
.btn:hover, .btn:focus-visible { transform: translateY(-1px); } /* Lift effect on hover - subtle vertical translation of up to 2-4 pixels depending on original element size before transformation applied reduces perceived distance from base container/surface beneath it creating depth perception cues for users indicating clickable state rather than passive decoration purpose */
```

### Button Variants (Background Colors & Themes)

#### Primary Action Buttons (Main Calls-to-Action - Highest Prominence, Most Visible Style Variation Across UI Pages Throughout ExMarkets Platform Including Trading Dashboard Account Settings Market Analysis Reports etcetera Where Users Perform Critical Business Operations Like Opening New Positions Closing Orders Viewing Detailed Charts And Statistics Related To Their Financial Activities Within The Application Interface Defined By Our Design System Specifications Currently Documented Above)
```css
.btn--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-2)); /* Gradient starting at blue (#4f8cff primary color on darker shades toward cyan/lighter #2faaff end point */
  
  box-shadow: var(--shadow-xs);   /* Minimal lift for subtle depth effect across entire platform consistency rather than overemphasizing individual element presence too aggressively given dark theme background palette defined in other sections earlier here within same style guide document structure outlined previously this section under buttons category currently being written progressively with help from AI assistance tool invoked to generate comprehensive documentation covering multiple components together instead of scattered throughout separate markdown files which would be harder to maintain and reference efficiently for design team members working on frontend or backend features requiring knowledge about overall visual language applied across ExMarkets product suite */
  
