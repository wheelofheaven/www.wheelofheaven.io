# Styling Conventions

## Architecture: 7-1 SCSS Pattern

```
sass/
├── main.scss           # Entry point with @use statements
├── abstracts/          # No CSS output - variables, mixins, functions
│   ├── _colors.scss    # Color palette
│   ├── _variables.scss # Spacing, radii, z-index, etc.
│   ├── _functions.scss # SCSS functions
│   └── _mixins.scss    # Reusable mixins
├── base/               # Reset and base styles
│   ├── _reset.scss     # CSS reset
│   ├── _base.scss      # Base element styles
│   └── _typography.scss # Font definitions
├── layout/             # Major structural elements
│   ├── _navbar.scss
│   ├── _footer.scss
│   ├── _grid.scss
│   └── _header.scss
├── components/         # Reusable UI components
│   ├── _button.scss
│   ├── _card.scss
│   ├── _breadcrumbs.scss
│   └── ...
├── pages/              # Page-specific styles
│   ├── _wiki.scss
│   ├── _timeline.scss
│   └── ...
├── themes/             # Theme definitions
│   ├── _init.scss
│   ├── _light.scss
│   └── _dark.scss
└── vendors/            # Third-party styles
    └── _highlight.scss
```

## BEM Naming Convention

**Block:** `.component-name`
**Element:** `.component-name__element`
**Modifier:** `.component-name--modifier` or `.component-name__element--modifier`

```scss
.wiki {
    // Block styles

    &__header {
        // Element
    }

    &__title {
        // Element
    }

    &__content {
        // Element

        &--featured {
            // Element modifier
        }
    }

    &--compact {
        // Block modifier
    }
}
```

## Design Tokens

### Spacing Scale

```scss
$spacing-2xs: 0.25rem;   // 4px
$spacing-xs: 0.5rem;     // 8px
$spacing-sm: 0.75rem;    // 12px
$spacing-md: 1rem;       // 16px
$spacing-lg: 1.5rem;     // 24px
$spacing-xl: 2rem;       // 32px
$spacing-2xl: 3rem;      // 48px
$spacing-3xl: 4rem;      // 64px
```

### Border Radius

```scss
$border-radius-xs: 0.25rem;    // 4px
$border-radius-sm: 0.375rem;   // 6px
$border-radius-md: 0.5rem;     // 8px
$border-radius-lg: 0.75rem;    // 12px
$border-radius-xl: 1rem;       // 16px
$border-radius-full: 50px;     // Pill shape
```

### Transitions

```scss
$transition-fast: 0.1s;
$transition-base: 0.2s;
$transition-slow: 0.3s;
$transition-slower: 0.5s;
$transition-default: all 0.3s ease;
$transition-transform: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Z-Index Scale

```scss
$z-dropdown: 55;
$z-navbar: 50;
$z-modal: 60;
$z-tooltip: 70;
$z-toast: 80;
```

### Font Sizes

```scss
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px
```

## Color Usage

### Theme-Aware Colors (CSS Custom Properties)

Always use CSS custom properties for colors that change between themes:

```scss
.component {
    color: var(--color-text);
    background: var(--color-background);
    border-color: var(--color-border);

    &:hover {
        background: var(--color-hover);
    }
}
```

### Static Colors (SCSS Variables)

For colors that don't change with theme, use SCSS variables:

```scss
@use "../abstracts/colors" as c;

.accent {
    color: c.$yellow;      // Default yellow shade
    color: c.$yellow-500;  // Specific shade
}
```

### Bifrost Palette

Primary colors available: `$yellow`, `$pink`, `$lavender`, `$mauve`, `$blue`, `$cyan`, `$teal`, `$mint`, `$green`

Each has shades from `100` to `900` (e.g., `$yellow-100`, `$yellow-500`, `$yellow-900`).

## Responsive Design

### Breakpoints

```scss
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
```

### Media Query Pattern

```scss
.component {
    padding: $spacing-lg;

    // Mobile-first: default is mobile
    // Add breakpoints for larger screens

    @media (min-width: 768px) {
        padding: $spacing-xl;
    }

    // Or max-width for mobile overrides
    @media (max-width: 767px) {
        padding: $spacing-md;
    }
}
```

## Component Pattern

```scss
// components/_card.scss
@use "../abstracts/variables" as v;
@use "../abstracts/colors" as c;

.card {
    padding: v.$spacing-lg;
    border-radius: v.$border-radius-md;
    background: var(--color-surface);
    transition: v.$transition-default;

    &__header {
        margin-bottom: v.$spacing-md;
    }

    &__title {
        font-size: v.$font-size-xl;
        font-weight: 600;
        color: var(--color-text);
    }

    &__content {
        color: var(--color-text-muted);
        line-height: 1.6;
    }

    &__footer {
        margin-top: v.$spacing-lg;
        padding-top: v.$spacing-md;
        border-top: 1px solid var(--color-border);
    }

    &:hover {
        box-shadow: var(--shadow-md);
    }

    &--featured {
        border: 2px solid c.$yellow;
    }
}
```

## Adding New Styles

### For a New Component

1. Create `sass/components/_component-name.scss`
2. Add `@use "components/component-name";` to `main.scss`
3. Use BEM naming
4. Reference design tokens from `abstracts/`

### For a New Page

1. Create `sass/pages/_page-name.scss`
2. Add `@use "pages/page-name";` to `main.scss`
3. Scope all styles under `.page-name` block

## Don'ts

- Don't use magic numbers - use spacing/size variables
- Don't hardcode colors - use CSS custom properties or color variables
- Don't nest more than 3 levels deep
- Don't use `!important` except for utilities
- Don't duplicate styles - extract to components
- Don't use IDs for styling - use classes
- Don't use inline styles in templates
