# ChatGPT Widget CSS Variables Reference

## Complete Design Token System

This reference provides the complete CSS variable system for building widgets that match ChatGPT's design language.

## Color Tokens

### Text Colors

```css
:root {
    /* Primary text - headings, important content */
    --text-default: #000000;

    /* Secondary text - supporting info, labels */
    --text-secondary: #666666;

    /* Subtle text - timestamps, tertiary info */
    --text-subtle: #999999;

    /* Disabled text */
    --text-disabled: #cccccc;

    /* Inverted text - on dark backgrounds */
    --text-inverted: #ffffff;
}

.dark {
    --text-default: #ffffff;
    --text-secondary: #a0a0a0;
    --text-subtle: #707070;
    --text-disabled: #505050;
    --text-inverted: #000000;
}
```

### Surface Colors

```css
:root {
    /* Primary surface - card backgrounds */
    --surface-primary: #ffffff;

    /* Secondary surface - nested sections, code blocks */
    --surface-secondary: #f5f5f5;

    /* Tertiary surface - hover states */
    --surface-tertiary: #ebebeb;

    /* Elevated surface - modals, dropdowns */
    --surface-elevated: #ffffff;
}

.dark {
    --surface-primary: #1a1a1a;
    --surface-secondary: #2d2d2d;
    --surface-tertiary: #3d3d3d;
    --surface-elevated: #2d2d2d;
}
```

### Action Colors

```css
:root {
    /* Primary action - main CTA buttons */
    --action-primary: #0066cc;
    --action-primary-hover: #0052a3;
    --action-primary-active: #003d7a;

    /* Secondary action - secondary buttons */
    --action-secondary: #e0e0e0;
    --action-secondary-hover: #d0d0d0;
    --action-secondary-active: #c0c0c0;

    /* Destructive action - delete, cancel */
    --action-destructive: #dc2626;
    --action-destructive-hover: #b91c1c;
}

.dark {
    --action-primary: #4da6ff;
    --action-primary-hover: #3d96ef;
    --action-secondary: #404040;
    --action-secondary-hover: #505050;
}
```

### Status Colors

```css
:root {
    /* Success - confirmations, positive states */
    --status-success: #22c55e;
    --status-success-bg: #dcfce7;
    --status-success-text: #166534;

    /* Warning - cautions, pending states */
    --status-warning: #f59e0b;
    --status-warning-bg: #fef3c7;
    --status-warning-text: #92400e;

    /* Error - errors, failed states */
    --status-error: #ef4444;
    --status-error-bg: #fee2e2;
    --status-error-text: #991b1b;

    /* Info - informational states */
    --status-info: #3b82f6;
    --status-info-bg: #dbeafe;
    --status-info-text: #1e40af;
}

.dark {
    --status-success-bg: #14532d;
    --status-success-text: #86efac;
    --status-warning-bg: #78350f;
    --status-warning-text: #fcd34d;
    --status-error-bg: #7f1d1d;
    --status-error-text: #fca5a5;
    --status-info-bg: #1e3a8a;
    --status-info-text: #93c5fd;
}
```

### Border Colors

```css
:root {
    /* Default border - cards, inputs */
    --border-default: #e0e0e0;

    /* Subtle border - dividers, separators */
    --border-subtle: #f0f0f0;

    /* Strong border - focus states */
    --border-strong: #999999;

    /* Focus border - accessibility */
    --border-focus: #0066cc;
}

.dark {
    --border-default: #404040;
    --border-subtle: #303030;
    --border-strong: #606060;
    --border-focus: #4da6ff;
}
```

## Typography Tokens

### Font Families

```css
:root {
    --font-sans: system-ui, -apple-system, BlinkMacSystemFont,
                 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

    --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo,
                 Consolas, 'Liberation Mono', monospace;
}
```

### Font Sizes

```css
:root {
    --text-xs: 11px;
    --text-sm: 12px;
    --text-base: 14px;
    --text-lg: 16px;
    --text-xl: 18px;
    --text-2xl: 20px;
    --text-3xl: 24px;
}
```

### Font Weights

```css
:root {
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;
}
```

### Line Heights

```css
:root {
    --leading-tight: 1.25;
    --leading-normal: 1.5;
    --leading-relaxed: 1.75;
}
```

### Typography Classes

```css
.heading-xl {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
}

.heading-lg {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
}

.heading-md {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
}

.heading-sm {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
}

.body {
    font-size: var(--text-base);
    font-weight: var(--font-normal);
    line-height: var(--leading-normal);
}

.body-small {
    font-size: var(--text-sm);
    font-weight: var(--font-normal);
    line-height: var(--leading-normal);
}

.caption {
    font-size: var(--text-xs);
    font-weight: var(--font-normal);
    line-height: var(--leading-normal);
    color: var(--text-secondary);
}

.code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
}
```

## Spacing Tokens

```css
:root {
    --space-0: 0;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;
}
```

## Border Radius Tokens

```css
:root {
    --radius-none: 0;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
}
```

## Shadow Tokens

```css
:root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.dark {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
                 0 2px 4px -2px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5),
                 0 4px 6px -4px rgba(0, 0, 0, 0.5);
}
```

## Animation Tokens

```css
:root {
    /* Durations */
    --duration-fast: 150ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;

    /* Easings */
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

## Z-Index Scale

```css
:root {
    --z-base: 0;
    --z-dropdown: 10;
    --z-sticky: 20;
    --z-fixed: 30;
    --z-overlay: 40;
    --z-modal: 50;
    --z-popover: 60;
    --z-tooltip: 70;
}
```

## Usage Example

```css
.card {
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
}

.card-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-default);
    margin-bottom: var(--space-2);
}

.card-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
}

.btn-primary {
    background: var(--action-primary);
    color: var(--text-inverted);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-weight: var(--font-medium);
    transition: background var(--duration-fast) var(--ease-in-out);
}

.btn-primary:hover {
    background: var(--action-primary-hover);
}
```
