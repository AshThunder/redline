---
version: 2.0
name: Redline
description: "Intercom's editorial system (warm cream canvas, white floating cards, charcoal type, one reserved AI accent) rebuilt for a trading cockpit. Adds a warm Night theme, a tabular data layer, AA-verified trading semantics, chart tokens and the components a pre-trade stress desk needs. Bitget cyan takes the role Intercom gives Fin Orange: it marks the AI, and nothing else."
base: "getdesign.md/intercom (Intercom-design-analysis)"

themes:
  day:
    canvas: "#f5f1ec"
    surface-1: "#ffffff"
    surface-2: "#f8f5f0"
    surface-3: "#efeae3"
    surface-4: "#e9e4dc"
    hairline: "#e3ded6"
    hairline-strong: "#d3cec6"
    hairline-tertiary: "#bdb7ae"
    ink: "#111111"
    ink-muted: "#45433f"
    ink-subtle: "#5e5b56"
    ink-tertiary: "#716e68"
    primary: "#111111"
    primary-hover: "#2a2926"
    on-primary: "#ffffff"
    accent: "#1fd5e0"
    accent-hover: "#5ee7ef"
    on-accent: "#111111"
    accent-ink: "#00747c"
    accent-subtle: "rgb(31 213 224 / 0.14)"
    gain: "#0b7a3b"
    loss: "#c42b2f"
    caution: "#946000"
    gain-subtle: "#e5f3e9"
    loss-subtle: "#fbe8e7"
    caution-subtle: "#fbf0d9"
  night:
    canvas: "#0f0e0c"
    surface-1: "#181715"
    surface-2: "#1f1e1b"
    surface-3: "#272521"
    surface-4: "#2e2c28"
    hairline: "#2c2a26"
    hairline-strong: "#3b3833"
    hairline-tertiary: "#4a4640"
    ink: "#f5f1ec"
    ink-muted: "#d3cec6"
    ink-subtle: "#aaa59d"
    ink-tertiary: "#8a857d"
    primary: "#f5f1ec"
    primary-hover: "#ffffff"
    on-primary: "#111111"
    accent: "#1fd5e0"
    accent-hover: "#5ee7ef"
    on-accent: "#111111"
    accent-ink: "#1fd5e0"
    accent-subtle: "rgb(31 213 224 / 0.12)"
    gain: "#3dbb68"
    loss: "#f0585d"
    caution: "#f2a93b"
    gain-subtle: "rgb(61 187 104 / 0.12)"
    loss-subtle: "rgb(240 88 93 / 0.12)"
    caution-subtle: "rgb(242 169 59 / 0.12)"

typography:
  sans: "Geist Sans (substitute for Intercom's proprietary Saans)"
  mono: "Geist Mono, tabular-nums (every number)"
  display-xl: { size: 72px, weight: 500, lineHeight: 1.05, tracking: -2.0px }
  display-lg: { size: 56px, weight: 500, lineHeight: 1.10, tracking: -1.4px }
  display-md: { size: 40px, weight: 500, lineHeight: 1.15, tracking: -0.8px }
  headline: { size: 28px, weight: 500, lineHeight: 1.20, tracking: -0.5px }
  card-title: { size: 22px, weight: 500, lineHeight: 1.25, tracking: -0.3px }
  subhead: { size: 20px, weight: 400, lineHeight: 1.40, tracking: -0.2px }
  body-lg: { size: 18px, weight: 400, lineHeight: 1.50, tracking: -0.1px }
  body: { size: 16px, weight: 400, lineHeight: 1.50 }
  body-sm: { size: 14px, weight: 400, lineHeight: 1.50 }
  caption: { size: 12px, weight: 400, lineHeight: 1.40 }
  micro: { size: 11px, weight: 400, lineHeight: 1.30, use: "mono evidence IDs and chart ticks only" }
  button: { size: 14px, weight: 500, lineHeight: 1.20 }

rounded: { xs: 4px, sm: 6px, md: 8px, lg: 12px, xl: 16px, xxl: 24px, full: 9999px }
spacing: { xxs: 4px, xs: 8px, sm: 12px, md: 16px, lg: 24px, xl: 32px, xxl: 48px, section: 96px }
motion: { fast: 150ms, base: 200ms, slow: 250ms, ease: "cubic-bezier(0.16, 1, 0.3, 1)" }
---

# Redline design system

## 1. What we kept from Intercom

Intercom's marketing system is calm, editorial and product-led. Four ideas carry over unchanged:

- **A warm canvas, not white.** Day theme sits on cream `#f5f1ec`. White is reserved for cards that float on it, so hierarchy comes from surface change, not shadows.
- **Charcoal is the primary.** Primary buttons, headlines and body are charcoal `#111111`. The system primary is never a hue.
- **One reserved accent for the AI.** Intercom keeps Fin Orange for Fin, its AI agent, and never uses it decoratively. Redline does the same with Bitget cyan: it marks things the AI does (the "Redline it" action, the running trace, the Judge's suggested changes, tripwires). Nothing else gets it.
- **Weight 500 display with negative tracking**, sentence-case eyebrows, modest radii (8px controls, 12px cards, 16px showcase tiles), no drop shadows on cards, no atmospheric gradients.

## 2. What we changed, and why

Intercom's system is a marketing site. Redline is a trading cockpit that people stare at while money is on the line. These are the improvements:

1. **Two themes, one set of names.** Day (Intercom cream) is the default. Night is a warm charcoal derived from the same palette, not a cold blue-black, so the brand survives the switch. Components only ever use token names; they never branch on theme. Switch with `data-theme="night"` on `<html>`.
2. **Accent that cannot be confused with P&L.** Intercom's orange would collide with loss red and caution amber, which in a trading tool carry meaning. Cyan sits outside the red/amber/green axis, and it keeps the Bitget tie-in.
3. **Accent split into fill and ink.** Bright cyan is unreadable as text on cream (1.6:1). `accent` is for fills with charcoal text on top (10.5:1); `accent-ink` is the text/line version: deep teal `#00747c` in Day (4.9:1 on cream), plain cyan in Night.
4. **A real data layer.** Intercom has no numbers to speak of. Redline is mostly numbers: every figure is Geist Mono with `tabular-nums` (the `num` utility), numbers right-align in tables, signed values always show `+` or `-`, and units are lowercase and tight (`5x`, `8%`, `$1,250`).
5. **Trading semantics, verified.** Gain, loss and caution are tuned per theme to clear WCAG AA (4.5:1) on every surface they appear on. Intercom's report green `#0bdf50` fails on cream (1.8:1) and is dropped.
6. **Text ladder that passes.** Intercom's quaternary grey `#9c9fa5` is 2.4:1 on cream. Every text step here clears 4.5:1 on canvas, card and inset surfaces (table in section 9).
7. **Chart tokens.** Charts read the same CSS variables as the UI, so they follow the theme automatically.
8. **Two densities.** *Editorial* for the landing page (Intercom spacing, 96px sections, display type). *Cockpit* for the desk (16px gaps, 14px body, 12px labels). Same tokens, different rhythm.
9. **Resolved contradictions in the source.** The Intercom analysis says both "pill CTA" and "don't pill-round CTAs". Redline: buttons are 8px, never pills. Pills are only for status chips.

## 3. Colour

### Surfaces (Day / Night)

| Token | Day | Night | Use |
|---|---|---|---|
| `canvas` | #f5f1ec | #0f0e0c | Page ground |
| `surface-1` | #ffffff | #181715 | Panels and cards (the `panel` utility) |
| `surface-2` | #f8f5f0 | #1f1e1b | Inset tiles inside a panel, table headers, inputs on cards |
| `surface-3` | #efeae3 | #272521 | Skeletons, pressed rows, empty chart wells |
| `surface-4` | #e9e4dc | #2e2c28 | Selected list rows (command palette) |
| `hairline` | #e3ded6 | #2c2a26 | Default 1px borders and dividers |
| `hairline-strong` | #d3cec6 | #3b3833 | Input borders, hovered cards, dialogs |
| `hairline-tertiary` | #bdb7ae | #4a4640 | Axis lines, focus-adjacent emphasis |

Depth rule: a panel is `surface-1` + 1px `hairline`. Inside it, tiles step to `surface-2`. Never stack more than two levels. The only shadow in the system belongs to floating layers (dialogs, popovers): `0 24px 64px rgb(17 17 17 / 0.14)` in Day, `0 24px 64px rgb(0 0 0 / 0.5)` in Night.

### Text

| Token | Day | Night | Use |
|---|---|---|---|
| `ink` | #111111 | #f5f1ec | Headlines, values, body in focus |
| `ink-muted` | #45433f | #d3cec6 | Body copy, summaries |
| `ink-subtle` | #5e5b56 | #aaa59d | Secondary copy, descriptions |
| `ink-tertiary` | #716e68 | #8a857d | Labels, metadata, placeholders |

### Primary and accent

| Token | Day | Night | Use |
|---|---|---|---|
| `primary` / `on-primary` | #111111 / #ffffff | #f5f1ec / #111111 | Default CTA (inverts in Night) |
| `accent` / `on-accent` | #1fd5e0 / #111111 | same | AI CTA fill ("Redline it"), brand mark stroke |
| `accent-ink` | #00747c | #1fd5e0 | AI text and lines: spinner, tripwire icon, suggested values, median line, active tab bar |
| `accent-subtle` | cyan 14% | cyan 12% | AI-tinted backgrounds (selection, AI badges) |

Accent rules: one accent CTA per viewport, and never next to a charcoal primary CTA of equal weight. Accent is never a section background and never marks gain or loss.

### Trading semantics

| Token | Day | Night | Meaning |
|---|---|---|---|
| `gain` | #0b7a3b | #3dbb68 | Positive P&L, PROCEED verdict, survived scenarios |
| `loss` | #c42b2f | #f0585d | Negative P&L, KILL verdict, liquidation, broken rules |
| `caution` | #946000 | #f2a93b | RESIZE verdict, warnings, events inside the horizon |
| `*-subtle` | solid tints | 12% alpha | Chip and verdict-header backgrounds |

Colour is never the only signal: verdicts carry an icon and a word, P&L carries a sign, broken rules carry "Broken" or "Warning".

## 4. Typography

- **Geist Sans** stands in for Saans (the Intercom analysis names Geist as an acceptable substitute). Display and titles at weight 500, body at 400. Use 600 only for the verdict word.
- **Geist Mono with tabular numerals** for every number, ticker-like ID (`E12`) and keyboard hint. Never for prose.
- Tracking tightens with size exactly as Intercom does (-2.0px at 72px, 0 at body).
- Eyebrows and section labels are sentence case, 12px, `ink-subtle`, weight 500. No all-caps.
- Measure: summaries cap at 70ch. Cockpit captions can run to 60ch inside tiles.

| Token | Size / weight / line / tracking | Where |
|---|---|---|
| display-xl | 72 / 500 / 1.05 / -2.0 | Landing hero only |
| display-lg | 56 / 500 / 1.10 / -1.4 | Landing section openers |
| display-md | 40 / 500 / 1.15 / -0.8 | Landing sub-sections, empty-state headline |
| headline | 28 / 500 / 1.20 / -0.5 | Verdict headline, page titles |
| card-title | 22 / 500 / 1.25 / -0.3 | Ticker in the market strip, panel titles |
| body-lg | 18 / 400 / 1.50 | Landing lead paragraphs |
| body | 16 / 400 / 1.50 | Composer input, dialogs |
| body-sm | 14 / 400 / 1.50 | Cockpit default |
| caption | 12 / 400 / 1.40 | Labels, trace details, table meta |
| micro | 11 / 400 mono | Evidence IDs, chart ticks |

## 5. Layout and density

- 8px base. Max width 1440px on the desk, 1200px on the landing page.
- **Cockpit (desk):** 16px gaps between panels, 16–20px panel padding, 12px inside tiles. Left rail 340px (trace), right column fluid.
- **Editorial (landing):** 96px between sections, 24–32px card padding, 3-up grids at desktop, 2-up at 1024px, 1-up below 768px.
- Sticky header 56px, `canvas` at 85% with backdrop blur, 1px `hairline` bottom.

## 6. Shape

| Radius | Use |
|---|---|
| 4px `xs` | Kbd hints, evidence chips, tiny badges |
| 6px `sm` | Inline tags, skeleton bars |
| 8px `md` | Buttons, inputs, inset tiles, list rows |
| 12px `lg` | Panels and cards |
| 16px `xl` | Landing product-mockup tiles, dialogs |
| full | Status dots, avatar circles, status pills |

## 7. Components

**Buttons** (8px radius, 14px/500, heights 28 / 36 / 40):
- `primary`: `primary` fill, `on-primary` text, hover `primary-hover`. The default CTA.
- `ai`: `accent` fill, `on-accent` text, hover `accent-hover`. Only for starting an AI run ("Redline it"). The Fin-button equivalent.
- `secondary`: `surface-1` fill, 1px `hairline-strong`, `ink` text; hover `surface-2`.
- `tertiary`: text-only `ink-subtle`; hover `surface-2` fill and `ink` text.
- `danger`: `loss-subtle` fill, `loss` text, 1px loss at 30%.
- Pressed: translate 1px down. Disabled: 40% opacity, no pointer events. Focus: 2px ring in `accent-ink` at 50%, 2px offset.

**Panel**: `surface-1`, 1px `hairline`, 12px radius, no shadow.

**Composer**: panel with a 16px input, placeholder in `ink-tertiary`, the `ai` button at the right, example chips below as `secondary` sm buttons.

**Trace step**: status icon (spinner in `accent-ink`, check in `gain`, warning in `caution`), label in `ink` 14px, detail in `ink-subtle` 12px clamped to two lines with the full text on hover, duration right-aligned in mono `ink-tertiary`.

**Verdict card**: panel with its border tinted by the verdict colour at 25%. Header strip in `*-subtle` with icon + verdict word (600) in the verdict colour, then confidence and jury agreement in mono. Headline 28/500, summary `ink-muted` 14px, 70ch. Three death-mode tiles (`surface-2`, 8px), each with probability in its colour, mechanism, a tripwire row with the bell in `accent-ink`, and evidence IDs in micro mono. Below, a hairline-separated strip of changes: old value struck through in `ink-tertiary`, arrow, new value in `accent-ink`. Footer: "You make the call" line, then Skip / Log as taken.

**Stat tile**: `surface-2`, caption label, mono value 14px, coloured only when the value is signed.

**Market strip**: ticker 22/500, price in mono body-lg, 6-month sparkline in `accent-ink`, a row of stat cells split by hairlines, then the Bitget intel row on `surface-2`.

**Tabs**: text tabs, `ink-subtle` → `ink` when active, 1px `accent-ink` underline, counts as small mono badges (`caution-subtle` when something is broken).

**Evidence chip**: mono micro text in a 4px-radius hairline box; hover turns border and text `accent-ink`. It shows the evidence on hover.

**Stress table**: scenario name + description on the left, underlying move and P&L on margin right-aligned in mono, outcome as a pill (`loss-subtle` "Liquidated", `caution-subtle` "Stopped", `gain-subtle` or neutral "Survives").

**Command palette**: 16px radius dialog, `surface-1`, 1px `hairline-strong`, floating-layer shadow, overlay `rgb(17 17 17 / 0.28)` in Day and `rgb(0 0 0 / 0.6)` in Night. Selected row `surface-4`.

**Inputs**: `surface-1` on canvas or `surface-2` inside panels, 1px `hairline-strong`, 8px radius, 36px height; focus border `accent-ink`.

## 8. Charts

Charts read CSS variables directly (`stroke="var(--color-loss)"`) so they follow the theme.

| Element | Token |
|---|---|
| Grid lines | `hairline` |
| Zero line | `hairline-strong` |
| Axis ticks | `ink-tertiary`, 11px mono |
| Primary series / median | `accent-ink`, 2px |
| Replay paths | `gain` or `loss` by outcome, 1px at 35% |
| Stop level | `caution`, dashed 3 3 |
| Liquidation level | `loss`, dashed 3 3 |
| Histogram bars | `loss` below zero, `gain` above, `ink-tertiary` straddling |
| Tooltip | `surface-1`, 1px `hairline-strong`, 8px radius, 12px text |

No 3D, no gradients except the 25%→0% sparkline fill, no legend when a caption can say it.

## 9. Accessibility

Contrast measured against canvas / card / inset (WCAG 2.2, 4.5:1 needed for normal text):

| Pair | Day | Night |
|---|---|---|
| ink | 16.8 / 18.9 / 17.2 | 17.2 / 15.9 / 14.8 |
| ink-subtle | ≥ 6.0 | ≥ 6.2 |
| ink-tertiary | 4.5 / 5.1 / 4.6 | 5.3 / 4.9 / 4.6 |
| accent-ink | 4.9 / 5.5 / 5.1 | 10.7 / 9.9 / 9.3 |
| gain | 4.8 / 5.4 / 5.0 | 7.8 / 7.3 / 6.8 |
| loss | 5.0 / 5.6 / 5.1 | 5.8 / 5.3 / 5.0 |
| caution | 4.8 / 5.3 / 4.9 | 9.7 / 9.0 / 8.4 |
| on-accent on accent | 10.5 | 10.5 |

Also: visible focus on every interactive element, 36px minimum control height on desktop and 44px on touch, `prefers-reduced-motion` collapses all motion, and colour never carries meaning alone.

## 10. Motion

150–250ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Things enter with an 8px rise and fade; nothing bounces. Streaming results appear as they arrive (the trace is the loading state), so there are no full-page spinners. Skeletons pulse on `surface-2`/`surface-3`.

## 11. Icons and imagery

Phosphor icons only, regular weight at 14–16px, bold only inside the verdict header. On the landing page, product screenshots are the hero of every section, framed in 16px tiles, as Intercom does.

## 12. Do and don't

Do:
- Keep Day on cream; lift content onto white panels.
- Use charcoal for ordinary CTAs and cyan only for the AI.
- Put every number in mono with a sign where it is a change.
- Pair every colour signal with a word or icon.

Don't:
- Use pure white as the Day canvas, or cold blue-black for Night.
- Use cyan for gain, as a background, or as decoration.
- Add shadows to cards, or gradients to surfaces.
- Pill-round buttons or write all-caps eyebrows.
- Hard-code hex values in components; add a token instead.
