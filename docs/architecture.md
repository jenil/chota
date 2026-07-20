# Chota Architecture

## Source Structure

Chota is a single-file CSS framework composed of modular source files assembled via PostCSS `@import`.

### Source Import Order

`src/chota.css` imports modules in cascade order:

```
_base.css    → Reset, CSS variables, root styles
_grid.css    → 12-column flexbox grid
_form.css    → Form controls, inputs, labels
_nav.css     → Navigation, breadcrumbs
_card.css    → Card component
_tab.css     → Tabs component
_tag.css     → Tag/badge component
_dropdown.css → Dropdown component
_util.css    → Utilities (margins, paddings, visibility, etc.)
```

Files prefixed with `_` are partial modules. Only `chota.css` is the entry point.

### Generated Artifacts

| File | Description |
|---|---|
| `dist/chota.css` | Development build (unminified, with banner) |
| `dist/chota.min.css` | Production build (minified via cssnano) |

Both files are generated from `src/chota.css` via PostCSS.

### Build Pipeline

```
src/chota.css
  ↓ postcss-import (resolves @import, runs stylelint lint-only)
  ↓ autoprefixer (adds vendor prefixes per browserslist)
  ↓ postcss-reporter (build stats)
  ↓ cssnano (production only: minification)
  ↓ output to dist/
```

**PostCSS config** (`postcss.config.js`):
- `postcss-banner`: Adds version/license banner
- `postcss-import`: Resolves imports, runs stylelint **lint-only** (no `--fix`)
- `autoprefixer`: Browserslist-driven prefix injection
- `postcss-reporter`: Build statistics
- `cssnano`: Production minification (only when `NODE_ENV=production`)

**Note:** Linting is separate from transformation. The build pipeline does **not** rewrite source CSS — stylelint runs without `--fix`.

## Public CSS API

### CSS Variables

Chota exposes CSS custom properties for theming. Override on `:root` or any selector:

- Color tokens: `--color-primary`, `--color-success`, `--color-error`, `--color-darkGrey`, `--color-grey`, `--color-lightGrey`, `--bg-color`, `--bg-secondary-color`, `--font-color`
- Spacing tokens: `--grid-gutter`, `--grid-maxWidth`
- Typography tokens: `--font-size`, `--font-family-sans`, `--font-family-mono`

**Note:** Border radius (hardcoded as `4px`) and transition duration (hardcoded as `0.2s`) are **not** exposed as CSS variables.

### Grid System

- `.container` — centered, max-width wrapper
- `.row` — flexbox row with negative margins for gutters
- `.col-*` — 12-column flexbox grid (`.col-1` through `.col-12`, `.col` for auto)
- `.is-half` / `.is-full` — column width modifiers

### Components

| Component | Classes | Notes |
|---|---|---|
| Navigation | `.nav`, `.nav img` | Logo, links, responsive; `.nav` wraps `.container` |
| Buttons | `.button`, `.button.primary`, `.button.secondary`, `.button.dark`, `.button.error`, `.button.success` | Various states |
| Forms | `<input>`, `<select>`, `<textarea>` (native elements, no classes) | Styled form controls; `.error` and `.success` modifier classes on inputs |
| Cards | `.card` | Container with header/body/footer |
| Tabs | `.tabs` | Visual navigation links (not ARIA Tabs widget) |
| Tags | `.tag`, `.tag.is-small`, `.tag.is-large` | Badge/label component |
| Dropdown | `.dropdown` | Disclosure widget |

### Utilities

Common helper classes: `.is-hidden`, `.is-marginless`, `.is-paddingless`, text alignment, etc.

## Release Flow

1. **Build**: `yarn build` — lint, process CSS, minify, report size
2. **Verify**: Check `dist/` output, size under 4KB gzip ceiling
3. **Publish**: `npm publish` — publishes `chota@1.0.0` to npm

The repository publishes a single package: `chota`. The `main` field in `package.json` points to `dist/chota.min.css`.
