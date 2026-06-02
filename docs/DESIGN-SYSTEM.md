# DocuStract Design System

> Implementation guide for DocuStract's visual language. This document complements `docs/BRAND-IDENTITY.md`. Every token, pattern, and component here is derived from the brand book. Engineers implement from this spec.

---

## 1. Design Tokens

Design tokens are the single source of truth for all visual values. They are defined as CSS custom properties and mirrored as TypeScript constants.

### 1.1 Color Tokens

#### Primitive Palette (raw values — do not use directly in components)

```css
/* Primaries */
--color-indigo-50:  #eef2ff;
--color-indigo-100: #e0e7ff;
--color-indigo-400: #818cf8;
--color-indigo-500: #6366f1;
--color-indigo-600: #4f46e5;
--color-indigo-700: #4338ca;

/* Neutrals */
--color-slate-100: #f1f5f9;
--color-slate-200: #e2e8f0;
--color-slate-300: #cbd5e1;
--color-slate-400: #94a3b8;
--color-slate-500: #64748b;
--color-slate-700: #334155;
--color-slate-800: #1e293b;
--color-slate-900: #0f172a;

/* Semantic */
--color-green-400:  #4ade80;
--color-green-500:  #22c55e;
--color-green-600:  #16a34a;
--color-green-700:  #15803d;

--color-amber-400:  #fbbf24;
--color-amber-500:  #f59e0b;
--color-amber-600:  #d97706;

--color-red-400:    #f87171;
--color-red-500:    #ef4444;
--color-red-600:    #dc2626;
```

#### Semantic Tokens (use these in components)

```css
/* Surface */
--color-bg:           var(--is-dark, false) * 1 calc(1 - var(--is-dark, false)) * 1 #f8f7f4;  /* Paper */
--color-surface:      var(--is-dark, false) * 1 calc(1 - var(--is-dark, false)) * 1 #ffffff;
--color-surface-2:   var(--is-dark, false) * 1 calc(1 - var(--is-dark, false)) * 1 #f1f5f9;

/* Dark mode surfaces (applied via [data-theme="dark"]) */
[data-theme="dark"] {
  --color-bg:         #0f0f1a;
  --color-surface:    #1a1a2e;
  --color-surface-2: #252540;
}

/* Text */
--color-text:         var(--is-dark, false) * 1 calc(1 - var(--is-dark, false)) * 1 #1a1a2e;  /* Ink */
--color-text-muted:   #64748b;
--color-text-faint:   #94a3b8;
[data-theme="dark"] { --color-text: #f8f7f4; --color-text-muted: #94a3b8; --color-text-faint: #64748b; }

/* Brand */
--color-brand:        #4f46e5;   /* Signal */
--color-brand-hover:  #4338ca;
--color-brand-light:  #eef2ff;
--color-brand-glow:   #818cf8;
[data-theme="dark"] { --color-brand: #818cf8; --color-brand-hover: #6366f1; --color-brand-light: #1e1b4b; }

/* Borders */
--color-border:       #e2e8f0;
--color-border-strong: #cbd5e1;
[data-theme="dark"] { --color-border: #2d2d4a; --color-border-strong: #3d3d6a; }

/* Semantic */
--color-success:      #22c55e;
--color-success-bg:   #f0fdf4;
--color-warning:      #f59e0b;
--color-warning-bg:   #fffbeb;
--color-error:        #ef4444;
--color-error-bg:      #fef2f2;
[data-theme="dark"] {
  --color-success: #4ade80; --color-success-bg: #052e16;
  --color-warning: #fbbf24; --color-warning-bg: #1c1400;
  --color-error: #f87171; --color-error-bg: #1c0505;
}
```

### 1.2 Typography Tokens

```css
/* Font families */
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;

/* Font sizes */
--text-xs:    0.75rem;    /* 12px */
--text-sm:    0.875rem;   /* 14px */
--text-base:  1rem;       /* 16px */
--text-lg:    1.125rem;   /* 18px */
--text-xl:    1.25rem;    /* 20px */
--text-2xl:   1.5rem;     /* 24px */
--text-3xl:   1.875rem;   /* 30px */
--text-4xl:   2.25rem;    /* 36px */

/* Font weights */
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

/* Line heights */
--leading-tight:  1.2;
--leading-normal: 1.4;
--leading-relaxed: 1.6;

/* Letter spacing */
--tracking-tight:  -0.025em;
--tracking-normal: 0;
--tracking-wide:   0.025em;
```

### 1.3 Spacing Tokens

```css
--space-0:  0;
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 1.4 Border Radius Tokens

```css
--radius-sm:   0.25rem;  /* 4px — badges, chips */
--radius-md:   0.5rem;   /* 8px — buttons, inputs, cards */
--radius-lg:   0.75rem;  /* 12px — modals, panels */
--radius-xl:   1rem;     /* 16px — feature cards */
--radius-full: 9999px;   /* avatars, pills */
```

### 1.5 Shadow Tokens

```css
--shadow-sm:  0 1px 2px rgba(26, 26, 46, 0.05);
--shadow-md:  0 4px 6px -1px rgba(26, 26, 46, 0.07), 0 2px 4px -1px rgba(26, 26, 46, 0.04);
--shadow-lg:  0 10px 15px -3px rgba(26, 26, 46, 0.08), 0 4px 6px -2px rgba(26, 26, 46, 0.04);
--shadow-xl:  0 20px 25px -5px rgba(26, 26, 46, 0.10), 0 10px 10px -5px rgba(26, 26, 46, 0.04);
--shadow-focus: 0 0 0 3px rgba(79, 70, 229, 0.25);  /* Signal ring */
--shadow-focus-error: 0 0 0 3px rgba(239, 68, 68, 0.25);
```

### 1.6 Motion Tokens

```css
--duration-instant: 50ms;
--duration-fast:    150ms;
--duration-normal:  250ms;
--duration-slow:   400ms;

--ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-in:       cubic-bezier(0.4, 0, 1, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 2. TypeScript Token Export

Tokens must be exported as TypeScript constants for use in component code:

```typescript
// src/tokens/index.ts

export const tokens = {
  color: {
    brand: '#4f46e5',
    brandHover: '#4338ca',
    brandLight: '#eef2ff',
    ink: '#1a1a2e',
    paper: '#f8f7f4',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    slate: '#64748b',
    mist: '#e2e8f0',
  },
  font: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  space: {
    1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem',
    5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem',
    12: '3rem', 16: '4rem',
  },
  radius: {
    sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px',
  },
  motion: {
    fast: '150ms', normal: '250ms', slow: '400ms',
  },
} as const;

export type TokenColor = keyof typeof tokens.color;
export type TokenSpace = keyof typeof tokens.space;
```

---

## 3. Component Specifications

### 3.1 Button

**Variants:** `primary` | `secondary` | `ghost` | `destructive`

**Sizes:** `sm` | `md` | `lg`

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
```

**Visual specs:**

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `--color-brand` | white | none | `--color-brand-hover` + scale(0.97) on press |
| Secondary | `--color-bg` | `--color-text` | `--color-border` | `--color-surface-2` bg |
| Ghost | transparent | `--color-brand` | none | `--color-brand-light` bg |
| Destructive | `--color-error` | white | none | `--color-error` at 90% |

**States:**
- `disabled`: opacity 0.5, cursor not-allowed, no hover effect
- `loading`: spinner replaces icons, pointer-events none
- `focus`: `--shadow-focus` ring (3px indigo glow)

**Dimensions:**
- `sm`: padding 6px 12px, font-size 13px, height 32px
- `md`: padding 8px 16px, font-size 14px, height 40px
- `lg`: padding 12px 24px, font-size 16px, height 48px

### 3.2 Input

```tsx
interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  error?: string;          // Error message shown below
  hint?: string;          // Helper text below input
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  size?: 'sm' | 'md' | 'lg';
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

**Visual specs:**
- Background: `--color-bg`
- Border: 1px `--color-border`, focus: 2px `--color-brand`
- Border radius: `--radius-md` (8px)
- Padding: 10px 14px
- Focus ring: `--shadow-focus`

**Error state:**
- Border: `--color-error`
- Error text: `--color-error`, 12px, below input with 4px gap
- Focus ring: `--shadow-focus-error`

### 3.3 Card

```tsx
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;   // Makes it interactive (hover effect)
}
```

**Visual specs:**
- Background: `--color-surface`
- Border: 1px `--color-border` (`bordered` variant)
- Border radius: `--radius-lg` (12px)
- Shadow: `--shadow-sm`, hover `--shadow-md`
- Padding: 24px (`md`), 16px (`sm`), 40px (`lg`)
- Interactive (with onClick): cursor pointer, hover border becomes `--color-brand`

### 3.4 Badge

```tsx
interface BadgeProps {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Visual specs:**

| Variant | Background | Text |
|---------|-----------|------|
| Neutral | `--color-border` | `--color-text-muted` |
| Brand | `--color-brand-light` | `--color-brand` |
| Success | `#f0fdf4` | `--color-success` |
| Warning | `#fffbeb` | `--color-warning` |
| Error | `#fef2f2` | `--color-error` |

Dark mode uses darker variants (see token table).

- Border radius: `--radius-sm` (4px)
- Padding: 2px 8px
- Font: 12px / `--weight-medium`

### 3.5 Modal / Dialog

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;   // Action buttons
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual specs:**
- Overlay: `rgba(15, 15, 26, 0.6)` with `backdrop-filter: blur(4px)`
- Panel: `--color-surface`, border-radius `--radius-lg`, shadow `--shadow-xl`
- Width: 400px (`sm`), 560px (`md`), 720px (`lg`)
- Padding: 32px body, 24px footer
- Enter: opacity 0→1 + scale(0.96→1), 250ms `--ease-out`
- Exit: opacity 1→0, 150ms `--ease-in`

### 3.6 Toast / Notification

```tsx
interface ToastProps {
  id: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  duration?: number;   // ms, default 5000
}
```

**Visual specs:**
- Background: `--color-surface`
- Border-left: 4px solid (color by variant)
- Shadow: `--shadow-lg`
- Border radius: `--radius-md`
- Enter from top-right: translateX(100%→0), 300ms `--ease-out`
- Auto-dismiss with progress bar (150ms shrink for `duration` ms)

---

## 4. Layout & Structure

### 4.1 Page Shell

```
┌──────────────────────────────────────────────────────────┐
│  Header: logo left, nav center, actions right  [h: 64px]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Main content (max-width: 1280px, centered)             │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────────────┐ │
│  │  Sidebar (280px)   │  │  Content area              │ │
│  │  (if applicable)   │  │  max-width: prose 72ch     │ │
│  └────────────────────┘  └────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Footer: links, copyright                    [h: 80px] │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Breakpoints

| Name | Min-width | Usage |
|------|-----------|-------|
| xs | 0px | Extra small (rare) |
| sm | 640px | Large phones, small tablets |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### 4.3 Container

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: var(--space-6);   /* 24px */
}

@media (max-width: 640px) {
  .container { padding-inline: var(--space-4); }
}
```

---

## 5. Accessibility Requirements

All components must meet WCAG 2.1 AA:

| Requirement | Implementation |
|-------------|----------------|
| Color contrast (normal text) | ≥ 4.5:1 against background |
| Color contrast (large text) | ≥ 3:1 against background |
| Focus indicators | Visible on `:focus-visible`, `--shadow-focus` ring |
| Touch targets | Minimum 44×44px on mobile |
| Motion sensitivity | Respect `prefers-reduced-motion` |
| Screen readers | All interactive elements have accessible names |
| Keyboard navigation | Full keyboard operability, logical tab order |
| ARIA roles | Use semantic HTML first; ARIA as enhancement |

---

## 6. Icon Usage

- Source: **Lucide Icons** (MIT licensed, consistent 24px grid)
- Import style: named imports only — `import { Upload, FileText, CheckCircle } from 'lucide-react'`
- Size: 16px (inline), 20px (toolbar), 24px (standard)
- Color: `currentColor` (inherits from text color context)
- Never mix Phosphor and Lucide in the same component group

---

## 7. Responsive Behavior

| Component | Mobile (<768px) | Desktop (≥768px) |
|-----------|----------------|-----------------|
| Navigation | Hamburger menu, slide-in drawer | Horizontal nav bar |
| Tables | Horizontal scroll with sticky first column | Full table |
| Cards | Full-width stacked | 2–3 column grid |
| Forms | Single column | 2 column for label+input pairs |
| Modal | Full-screen | Centered dialog |

---

## 8. Implementation Checklist

Before shipping any UI component, verify:

- [ ] All tokens used are from the token table (no raw hex values in component files)
- [ ] Dark mode renders correctly (`[data-theme="dark"]` or `prefers-color-scheme`)
- [ ] Focus ring visible on keyboard navigation
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] `prefers-reduced-motion` disables non-essential animations
- [ ] Component has `aria-*` attributes where applicable
- [ ] Component exported from the design system library
- [ ] Storybook story added (if using Storybook)

---

_This document is implemented from the brand specifications in `docs/BRAND-IDENTITY.md`. When brand values change, update BRAND-IDENTITY.md first, then update the token values in this document, then notify engineers to regenerate token files._
