# Design System

Warm earth light, warm charcoal dark. One theme, two modes, no brand noise.

## Architecture

```
Physical (external)
  Tailwind built-ins or bare CSS named colors — untouchable
      ↓
Palette  packages/ui/src/styles/palette.css
  Every hex literal the project owns, named by mode and role
      ↓
Semantic  packages/ui/src/styles/tokens.css
  --color-*, --font-*, --radius-*, --shadow-*, --duration-* vars that code uses
```

**Rule:** project code references semantic tokens only. Never write a raw hex or a `--palette-*` var outside of `tokens.css`.

## Palette

### Light

Warm earth neutrals, low-saturation. All text colors meet WCAG AA (≥ 4.5 : 1) on `--palette-light-paper`.

| Variable                   | Hex       | 和名 | Role            | Contrast on paper |
| -------------------------- | --------- | ---- | --------------- | ----------------- |
| `--palette-light-paper`    | `#faf7eb` | 纸白 | page background | —                 |
| `--palette-light-cloud`    | `#f5f2ec` | 米白 | muted surface   | —                 |
| `--palette-light-oat`      | `#e8e0d0` | 燕麦 | border, divider | —                 |
| `--palette-light-sand`     | `#d4c5a9` | 沙色 | strong border   | —                 |
| `--palette-light-fog`      | `#726e69` | 温灰 | secondary text  | 4.70 : 1          |
| `--palette-light-stone`    | `#666666` | 深灰 | body text alt   | 5.33 : 1          |
| `--palette-light-charcoal` | `#333333` | 炭黑 | body text       | 11.77 : 1         |
| `--palette-light-ink`      | `#1a1a1a` | 墨黑 | headings        | 16.1 : 1          |

### Dark

Warm charcoal ramp, R > B throughout. All text colors meet WCAG AA on `--palette-dark-0`.

| Variable                  | Hex       | Role            | Contrast on dark-0                      |
| ------------------------- | --------- | --------------- | --------------------------------------- |
| `--palette-dark-0`        | `#1a1917` | page background | —                                       |
| `--palette-dark-1`        | `#242220` | muted surface   | —                                       |
| `--palette-dark-2`        | `#332f2c` | border          | —                                       |
| `--palette-dark-3`        | `#46413d` | strong border   | —                                       |
| `--palette-dark-text`     | `#e6e3dc` | body text       | 14.0 : 1                                |
| `--palette-dark-text-dim` | `#9a948d` | secondary text  | 5.28 : 1 on dark-0 / 5.27 : 1 on dark-1 |

### Brand Accent — 蘇芳色 Suou-iro

蘇芳色（すおういろ）is the color of dye extracted from the heartwood of the sappan tree (_Caesalpinia sappan_), used in Heian-era court robes and noble garments. A deep, subdued rose-crimson with low saturation — stately without being loud, warm without being bright. The name carries the weight of classical refinement: beauty that asserts itself through depth, not through display.

| Variable                | Hex       | Mode  | Role                    | Contrast           |
| ----------------------- | --------- | ----- | ----------------------- | ------------------ |
| `--palette-brand-light` | `#963c5a` | light | text, links, focus ring | 6.30 : 1 on paper  |
| `--palette-brand-dark`  | `#d8a0b2` | dark  | text, links, focus ring | 8.04 : 1 on dark-0 |

Accent-foreground (text **on** an accent-colored background):

| Context    | Foreground              | Hex       | Contrast              |
| ---------- | ----------------------- | --------- | --------------------- |
| light mode | `--palette-light-paper` | `#faf7eb` | 6.30 : 1 on `#963c5a` |
| dark mode  | `--palette-dark-0`      | `#1a1917` | 8.04 : 1 on `#d8a0b2` |

### Semantic States

Low-saturation, drawn from Japanese natural-color names. Light values are dark enough to use as foreground text on paper; dark values are light enough on dark-0.

| Variable              | Light hex | Dark hex  | 和名             | Contrast (light/dark) |
| --------------------- | --------- | --------- | ---------------- | --------------------- |
| `--palette-success-*` | `#4d5e38` | `#a8b890` | 深苔 / 苔緑 sage | 6.56 : 1 / 8.44 : 1   |
| `--palette-warning-*` | `#7a5520` | `#d4b88e` | 深朽葉 / 朽葉    | 6.22 : 1 / 9.37 : 1   |
| `--palette-error-*`   | `#a03030` | `#d06464` | 緋色 hiiro       | 6.61 : 1 / 4.81 : 1   |

## Semantic Tokens

| Token                       | Light         | Dark          | Use for                     |
| --------------------------- | ------------- | ------------- | --------------------------- |
| `--color-background`        | light-paper   | dark-0        | page surface                |
| `--color-muted`             | light-cloud   | dark-1        | elevated / tinted surface   |
| `--color-foreground`        | light-ink     | dark-text     | default body text           |
| `--color-muted-foreground`  | light-fog     | dark-text-dim | secondary text, captions    |
| `--color-border`            | light-oat     | dark-2        | outlines, dividers          |
| `--color-border-strong`     | light-sand    | dark-3        | input focus, active borders |
| `--color-divider`           | light-oat     | dark-1        | soft visual separators      |
| `--color-accent`            | brand-light   | brand-dark    | CTA, focus ring, links      |
| `--color-accent-foreground` | light-paper   | dark-0        | text on accent background   |
| `--color-success`           | success-light | success-dark  | positive status             |
| `--color-warning`           | warning-light | warning-dark  | caution state               |
| `--color-error`             | error-light   | error-dark    | errors, destructive         |

## Border Radius

Corners are intentionally restrained — Japanese design avoids both sharp edges and the over-rounded look common in Western design systems.

| Token           | Value    | Tailwind class | Use for                        |
| --------------- | -------- | -------------- | ------------------------------ |
| `--radius-xs`   | `2px`    | —              | inline chips, tight UI tags    |
| `--radius-sm`   | `3px`    | `rounded-sm`   | small buttons, compact inputs  |
| `--radius-md`   | `5px`    | `rounded-md`   | buttons, inputs, select fields |
| `--radius-lg`   | `7px`    | `rounded-lg`   | cards, panels, popovers        |
| `--radius-xl`   | `10px`   | `rounded-xl`   | dialogs, drawers               |
| `--radius-full` | `9999px` | `rounded-full` | pill badges                    |

## Shadows

Shadows are nearly flat — depth is implied by border and background contrast, not shadow blur.

| Token         | Use for                     |
| ------------- | --------------------------- |
| `--shadow-xs` | inputs at rest, subtle lift |
| `--shadow-sm` | cards, default surface      |
| `--shadow-md` | popovers, dropdowns         |
| `--shadow-lg` | dialogs, modals             |

## Typography

| Token          | Stack                                                  | Use for                      |
| -------------- | ------------------------------------------------------ | ---------------------------- |
| `--font-sans`  | Geist → Inter → system-ui → PingFang SC → Noto Sans SC | body, UI labels              |
| `--font-serif` | Lora → Noto Serif SC → Georgia                         | long-form prose, pull quotes |
| `--font-mono`  | Geist Mono → JetBrains Mono → Fira Code                | code, numerics               |

**Weight rules:**

- Body: 400
- Medium emphasis: 500
- Headings: 600 maximum — avoid 700+ on CJK (browser synthetic bold degrades stroke quality)

## Animation

| Token             | Value   | Use for                      |
| ----------------- | ------- | ---------------------------- |
| `--duration-fast` | `100ms` | micro interactions, toggles  |
| `--duration-base` | `180ms` | default transitions          |
| `--duration-slow` | `320ms` | complex transitions, reveals |

Easing: prefer `ease-out` for entrances, `ease-in` for exits. Never use linear for UI motion.

## Theme Switching

Dark mode is triggered by a `.dark` class on `<html>`. Use `applyTheme(dark)` from `@my-memos/ui` to toggle it — it suppresses transitions during the switch to avoid a flash.

`app.html` contains a small inline script that applies the correct theme before first paint, based on `localStorage` preference or system preference. `Masthead` owns the user-facing toggle and persists the choice to `localStorage`.

## Usage

```css
@import "@my-memos/ui/styles";
```

```css
.card {
  background: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}

.card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

## Principles

1. **Warm light, warm dark** — both modes use warm palettes; the accent is the only element with strong chromatic identity.
2. **Semantic tokens only in code** — never bare hex, never `--palette-*` in component files.
3. **Accent is restrained** — covers ≤ 5 % of visible area. CTA buttons, focus rings, links only.
4. **Low saturation always** — if a new color feels vivid, it is wrong for this system.
5. **Breathing room** — generous whitespace is a feature, not a gap to fill.
6. **New hex goes to palette first** — add to `palette.css`, name it, then reference from `tokens.css`.
7. **No new semantic token without discussion** — one-off dimming uses `color-mix(in srgb, var(--color-foreground) 60%, transparent)`.
