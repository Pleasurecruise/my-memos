# Skill: design-system

Apply this skill whenever you are writing or reviewing CSS, component styles, color values, or font references in this project.

## When to load

- Writing or editing any `.css` file
- Adding color, background, border, or text styling to a component
- Choosing a font-family or font-weight
- Implementing dark mode or theme switching
- Reviewing code for style compliance
- Adding a new semantic state or UI color

## Token reference (quick)

Import path: `packages/ui/src/styles/tokens.css` (re-exports palette).

### Color tokens

| Token                       | Light source          | Dark source             |
| --------------------------- | --------------------- | ----------------------- |
| `--color-background`        | light-paper `#faf7eb` | dark-0 `#1a1917`        |
| `--color-muted`             | light-cloud `#f5f2ec` | dark-1 `#242220`        |
| `--color-foreground`        | light-ink `#1a1a1a`   | dark-text `#e6e3dc`     |
| `--color-muted-foreground`  | light-fog `#726e69`   | dark-text-dim `#9a948d` |
| `--color-border`            | light-oat `#e8e0d0`   | dark-2 `#332f2c`        |
| `--color-border-strong`     | light-sand `#d4c5a9`  | dark-3 `#46413d`        |
| `--color-divider`           | light-oat `#e8e0d0`   | dark-1 `#242220`        |
| `--color-accent`            | brand-light `#6d5626` | brand-dark `#b89a64`    |
| `--color-accent-foreground` | light-paper `#faf7eb` | dark-0 `#1a1917`        |
| `--color-success`           | `#4d5e38`             | `#a8b890`               |
| `--color-warning`           | `#7a5520`             | `#d4b88e`               |
| `--color-error`             | `#a03030`             | `#d06464`               |

### Spacing tokens

| Token           | Value    | Tailwind class |
| --------------- | -------- | -------------- |
| `--radius-xs`   | `2px`    | —              |
| `--radius-sm`   | `3px`    | `rounded-sm`   |
| `--radius-md`   | `5px`    | `rounded-md`   |
| `--radius-lg`   | `7px`    | `rounded-lg`   |
| `--radius-xl`   | `10px`   | `rounded-xl`   |
| `--radius-full` | `9999px` | `rounded-full` |

### Shadow tokens

| Token         | Use for                 |
| ------------- | ----------------------- |
| `--shadow-xs` | inputs at rest          |
| `--shadow-sm` | cards (default surface) |
| `--shadow-md` | popovers, dropdowns     |
| `--shadow-lg` | dialogs, modals         |

### Duration tokens

| Token             | Value   |
| ----------------- | ------- |
| `--duration-fast` | `100ms` |
| `--duration-base` | `180ms` |
| `--duration-slow` | `320ms` |

### Font tokens

| Token          | Primary faces                                     |
| -------------- | ------------------------------------------------- |
| `--font-sans`  | Geist → Inter → system-ui (CJK fallback included) |
| `--font-serif` | Lora → Noto Serif SC → Georgia                    |
| `--font-mono`  | Geist Mono → JetBrains Mono → Fira Code           |

## Rules (non-negotiable)

1. **No raw hex in component files** — every color goes through a `--color-*` token.
2. **No `--palette-*` in components** — palette vars are internal to `tokens.css`.
3. **Dark mode via `.dark` on `<html>`** — never toggle color manually per-element.
4. **Accent ≤ 5% surface area** — it is an emphasis signal, not a fill color.
5. **Font weight ≤ 600 on CJK text** — synthetic bold degrades CJK stroke quality.
6. **New hex → palette.css first** — name it, reference it from tokens.css, then use the semantic token.
7. **No new token for one-off dimming** — use `color-mix(in srgb, var(--color-foreground) 60%, transparent)`.

## Anti-patterns

```css
/* BAD */
color: #1a1a1a;
background: var(--palette-light-paper);
font-family: "Inter", sans-serif;
font-weight: 700; /* on CJK text */

/* GOOD */
color: var(--color-foreground);
background: var(--color-background);
font-family: var(--font-sans);
font-weight: 600;
```

## Theme switching snippet

```js
function applyTheme(dark) {
  const style = document.createElement("style");
  style.textContent = "*, *::before, *::after { transition: none !important }";
  document.head.appendChild(style);
  document.documentElement.classList.toggle("dark", dark);
  getComputedStyle(document.documentElement).opacity; // flush
  requestAnimationFrame(() => style.remove());
}
```

## Full spec

See `docs/DESIGN.md` for the complete palette table, token table, principles, and rationale.
