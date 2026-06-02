# DocuStract Brand Identity

> The brand book for DocuStract — a modern document processing pipeline.

---

## 1. Brand Essence

**What we are.** DocuStract is a document processing pipeline — it extracts, transforms, and delivers structured data from documents at scale.

**What we stand for.** Reliability. Clarity. Developer-first design. Every interface, whether API or UI, should feel precise, well-crafted, and trustworthy.

**Personality.** Confident but not flashy. Technical but not cold. Like a senior engineer who writes excellent documentation — sharp, organized, quietly impressive.

---

## 2. Name

- **DocuStract** — a contraction of "Document" and "Extract/Contract". Conveys purpose without being generic.
- Always capitalized: `DocuStract`. Not "Docustract", "docustract", or "docu-stract".
- The logo wordmark uses this exact casing.

---

## 3. Logo

### Primary Mark

```
  ┌─────────────────────────────────────┐
  │                                     │
  │   D                                  │
  │   D   o                              │
  │   D   o   c                         │
  │   D   o   u   u                     │
  │   D   o   u   u   S                 │
  │   D   o   u   u   S   t             │
  │       o   u   u   S   t   r         │
  │           u   u   S   t   r   a     │
  │               u   S   t   r   a   c │
  │                   S   t   r   a   c │
  │                       t             │
  │                                     │
  └─────────────────────────────────────┘
```

The logo spells "DocuStract" using a cascading block style. Each letter is a filled rectangle — stacked to suggest document pages and data flow.

### Monogram (Compact)

When full wordmark is impractical, use the **DS** monogram — two overlapping filled rectangles forming a "D" and "S" composite. Favicon and avatar contexts.

### Usage Rules

- Minimum clear space: 1x the cap-height around all sides
- Never stretch, rotate, or recolor the logo
- Never place the logo on a background that doesn't meet contrast requirements (see §4)
- On dark backgrounds: use white logo
- On light backgrounds: use `#1a1a2e` (near-black) logo

---

## 4. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Ink | `#1a1a2e` | 26, 26, 46 | Primary text, dark logo variant |
| Paper | `#f8f7f4` | 248, 247, 244 | Background, light surfaces |
| Signal | `#4f46e5` | 79, 70, 229 | Primary accent, CTAs, links |
| Signal Light | `#eef2ff` | 238, 242, 255 | Hover states, highlights, badges |

### Supporting Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Slate | `#64748b` | 100, 116, 139 | Secondary text, icons |
| Mist | `#e2e8f0` | 226, 232, 240 | Borders, dividers |
| Success | `#10b981` | 16, 185, 129 | Success states, confirmations |
| Warning | `#f59e0b` | 245, 158, 11 | Warning states, deprecations |
| Error | `#ef4444` | 239, 68, 68 | Error states, destructive actions |

### Dark Mode Palette

| Name | Hex | Usage |
|------|-----|-------|
| Void | `#0f0f1a` | Dark background |
| Night | `#1a1a2e` | Card/surface background |
| Dim | `#64748b` | Secondary text |
| Glow | `#818cf8` | Links and accents (lighter indigo) |

### Contrast Requirements

All text/background combinations must meet WCAG AA:
- Normal text (< 18pt): minimum 4.5:1 contrast ratio
- Large text (≥ 18pt): minimum 3:1 contrast ratio
- UI components: minimum 3:1 contrast ratio

---

## 5. Typography

### Typeface: Inter

DocuStract uses **Inter** as its primary typeface — the open-source standard for clear, neutral UI typography.

```
Heading font:  Inter, -apple-system, BlinkMacSystemFont, sans-serif
Body font:     Inter, -apple-system, BlinkMacSystemFont, sans-serif
Mono font:     JetBrains Mono, Fira Code, Consolas, monospace
```

**Do not substitute Inter with Arial, Roboto, or Open Sans.** The brand relies on Inter's optical sizing and tabular numerals.

### Type Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px / 0.75rem | 400 | Captions, footnotes |
| `text-sm` | 14px / 0.875rem | 400 | Secondary body, labels |
| `text-base` | 16px / 1rem | 400 | Primary body text |
| `text-lg` | 18px / 1.125rem | 400 | Lead paragraphs |
| `text-xl` | 20px / 1.25rem | 600 | Section headings |
| `text-2xl` | 24px / 1.5rem | 700 | Page headings |
| `text-3xl` | 30px / 1.875rem | 700 | Hero headings |
| `text-4xl` | 36px / 2.25rem | 700 | Marketing hero |

### Line Heights

| Context | Line Height |
|---------|-------------|
| Body text | 1.6 (relaxed) |
| Headings | 1.2 (tight) |
| UI labels | 1.4 (normal) |
| Code / mono | 1.5 |

### Letter Spacing

| Token | Tracking | Usage |
|-------|----------|-------|
| `tracking-tight` | -0.025em | Large headings (≥ 24px) |
| `tracking-normal` | 0 | Body text |
| `tracking-wide` | +0.025em | All-caps labels, badges |

---

## 6. Iconography

### Style: Filled Rounded

Icons use a **filled, rounded** style:
- Stroke weight: 2px (when outlined)
- Corner radius: 4px (rounded squares), full radius (circles)
- Grid: 24×24px canvas, 2px padding
- Optical balance — not purely geometric

### Icon Sources

- **Lucide Icons** (primary) — consistent filled-rounded style, MIT licensed
- **Phosphor Icons** (fallback) — Duotone variant for emphasis
- **Custom icons** — only for product-specific concepts (e.g., the document pipeline)

### Icon Sizes

| Size | Usage |
|------|-------|
| 16px | Inline with text, tight spaces |
| 20px | Toolbar icons |
| 24px | Navigation, standard UI |
| 32px | Feature illustrations |
| 48px | Empty states, placeholders |

---

## 7. Visual Assets

### Images

- **Illustrations**: Abstract, geometric — document shapes, flow arrows, circuit traces. No clip art or stock photography.
- **Screenshots**: Real product UI only. Rounded corners (8px), subtle shadow, no border.
- **Diagrams**: Use `#4f46e5` (Signal) for primary flow, `#64748b` (Slate) for secondary. Consistent arrow style (filled arrowheads, 1.5px stroke).

### Patterns

- **Dot grid**: `#e2e8f0` dots on 24px grid — used for empty states and decorative backgrounds.
- **Halftone accent**: Signal color halftone (20% opacity) for hero section depth.

### Border Radius

| Token | Radius | Usage |
|-------|--------|-------|
| `radius-sm` | 4px | Badges, small chips |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Modals, large panels |
| `radius-xl` | 16px | Feature cards |
| `radius-full` | 9999px | Avatars, pills |

### Shadows

```css
--shadow-sm:  0 1px 2px rgba(26, 26, 46, 0.05);
--shadow-md:  0 4px 6px -1px rgba(26, 26, 46, 0.07), 0 2px 4px -1px rgba(26, 26, 46, 0.04);
--shadow-lg:  0 10px 15px -3px rgba(26, 26, 46, 0.08), 0 4px 6px -2px rgba(26, 26, 46, 0.04);
--shadow-xl:  0 20px 25px -5px rgba(26, 26, 46, 0.10), 0 10px 10px -5px rgba(26, 26, 46, 0.04);
```

---

## 8. Tone of Voice

### Core Principles

1. **Precise** — Say exactly what you mean. No filler. No buzzwords.
2. **Direct** — Get to the point. Developers scan; respect their time.
3. **Confident** — Own our decisions. "We chose X because Y."
4. **Helpful** — Anticipate questions. Write for the reader, not the author.

### Writing Rules

| Rule | Do | Don't |
|------|-----|-------|
| Active voice | "The API returns a document object." | "A document object is returned." |
| Short sentences | Aim for ≤ 20 words. | Stringing clauses with "and" repeatedly. |
| Plain language | "Run the pipeline" | "Execute the document ingestion workflow" |
| Code-style nouns | "API endpoint", "JSON payload" | "endpoint", "payload" (without context) |
| Present tense | "The function validates the input" | "The function will validate" |
| Specificity | "Returns HTTP 422" | "Returns an error" |

### Error Messages

Error messages must include:
1. What went wrong (clear, plain language)
2. What the user can do about it (actionable)
3. A code or reference ID (for API errors)

Example:
> **Invalid document format.** File type `.xlsx` is not supported. Supported formats: `.pdf`, `.docx`, `.png`. [Error DOC-402]

### Voice by Context

| Context | Tone | Example |
|---------|------|---------|
| API docs | Technical, precise | "The `POST /documents` endpoint accepts a multipart form payload." |
| Error messages | Clear, helpful | "Upload failed. The file exceeds the 50MB limit." |
| Marketing | Confident, concise | "Process millions of documents in minutes." |
| Onboarding | Patient, encouraging | "Let's get your first pipeline running." |
| Changelog | Matter-of-fact | "Added: Support for PDF/A archival format." |

---

## 9. Spacing & Layout

### Spacing Scale (Base: 4px)

```
0:   0px
1:   4px    (--space-1)
2:   8px    (--space-2)
3:   12px   (--space-3)
4:   16px   (--space-4)
5:   20px   (--space-5)
6:   24px   (--space-6)
8:   32px   (--space-8)
10:  40px   (--space-10)
12:  48px   (--space-12)
16:  64px   (--space-16)
20:  80px   (--space-20)
24:  96px   (--space-24)
```

### Layout Max Widths

| Context | Max Width |
|---------|-----------|
| Prose content | 72ch (≈ 720px) |
| Full-page layout | 1280px |
| Sidebar | 280px |
| API reference sidebar | 320px |

### Grid

- **8-point grid** for all spacing and sizing
- Content never bleeds edge-to-edge on desktop (min 24px side padding)
- Responsive breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

---

## 10. Motion & Animation

### Principles

1. **Purposeful** — Motion communicates state change, not decoration.
2. **Fast** — 150ms for micro-interactions, 250ms for layout transitions, 400ms for page transitions.
3. **Subtle** — Motion enhances, never distracts.

### Animation Tokens

```css
--duration-instant: 50ms;   /* Hover color, focus ring */
--duration-fast:    150ms;  /* Button press, toggle */
--duration-normal:  250ms;  /* Panel open, dropdown */
--duration-slow:    400ms;  /* Page transitions */

--ease-default:     cubic-bezier(0.4, 0, 0.2, 1);   /* General */
--ease-in:          cubic-bezier(0.4, 0, 1, 1);       /* Exit */
--ease-out:         cubic-bezier(0, 0, 0.2, 1);       /* Enter */
--ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful UI (sparingly) */
```

### Animation Patterns

| Interaction | Animation |
|-------------|-----------|
| Button press | Scale 0.97 → 1, 150ms ease-out |
| Dropdown open | Opacity 0→1 + translateY(-8px→0), 250ms ease-out |
| Toast notification | Slide in from top-right, 400ms ease-out |
| Page transition | Opacity fade, 200ms ease |
| Loading spinner | Continuous rotation, 700ms linear |
| Skeleton shimmer | Gradient sweep left-to-right, 1.5s ease-in-out, infinite |

### Avoid

- Bouncing animations on error states
- Animations longer than 500ms (excluding full-page transitions)
- Animations for users with `prefers-reduced-motion`

---

## 11. Component Patterns

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `#4f46e5` Signal | White | None | Main CTAs |
| Secondary | `#f8f7f4` Paper | `#1a1a2e` Ink | `#e2e8f0` Mist | Secondary actions |
| Ghost | Transparent | `#4f46e5` Signal | None | Tertiary actions |
| Destructive | `#ef4444` Error | White | None | Destructive actions |
| Disabled | `#e2e8f0` Mist | `#94a3b8` | None | Disabled state |

- Border radius: `radius-md` (8px)
- Padding: 8px 16px (compact), 12px 24px (default), 16px 32px (large)
- Font: 14px / 600 weight

### Cards

- Background: `#f8f7f4` (Paper) on light, `#1a1a2e` (Night) on dark
- Border: 1px `#e2e8f0` (Mist)
- Border radius: `radius-lg` (12px)
- Shadow: `--shadow-sm` default, `--shadow-md` on hover
- Padding: 24px

### Form Inputs

- Border: 1px `#e2e8f0`, focus: 2px `#4f46e5`
- Border radius: `radius-md` (8px)
- Padding: 10px 14px
- Background: `#f8f7f4`
- Placeholder color: `#94a3b8`

### Badges / Tags

- Border radius: `radius-sm` (4px)
- Padding: 2px 8px
- Font: 12px / 500 weight
- Variants: Neutral (Mist bg, Slate text), Signal (Signal Light bg, Signal text), Success (green tint), Warning (amber tint), Error (red tint)

---

## 12. Dark Mode

Dark mode is supported via CSS custom properties. All components must be tested in both modes.

**Strategy**: CSS variable swap on `[data-theme="dark"]` or `prefers-color-scheme: dark`.

Key dark mode overrides:
- Background surfaces: `#0f0f1a` / `#1a1a2e`
- Text: White (`#ffffff`) for primary, `#94a3b8` for secondary
- Borders: `#2d2d4a`
- Accent (links): `#818cf8` (lighter indigo for readability on dark)
- Focus ring: `#818cf8`

**Never use pure black (`#000000`)** on dark mode — it creates harsh contrast. Use `#0f0f1a` (near-black with a hint of indigo) instead.

---

## 13. Logo Usage — Quick Reference

| Background | Logo Color | Example |
|-----------|-----------|---------|
| White / `#f8f7f4` | Ink `#1a1a2e` | Website header |
| Dark / `#0f0f1a` | White | Dark mode |
| Signal `#4f46e5` | White | Brand moments |
| Photo / gradient | Use monogram only | Social media |

---

_This document is the single source of truth for DocuStract's visual identity. Update this file first; all other design artifacts (Figma, component libraries) derive from it._
