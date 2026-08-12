# Migration Guide — Chota 0.9.x → 1.0.0

## Breaking Changes

### Internet Explorer 11 No Longer Supported

Chota 1.0.0 drops Internet Explorer 11 support. The `browserslist` policy was updated from `["last 2 versions"]` (which included IE11) to:

```json
"browserslist": [
  "last 2 Chrome versions",
  "last 2 Firefox versions",
  "last 2 Edge versions",
  "Safari >= 15.4",
  "iOS Safari >= 15.4"
]
```

**Impact:** IE11 users will see a degraded experience. Modern CSS features used by Chota (flexbox, CSS custom properties) are not available in IE11. The `browserslist` in `package.json` was updated to explicit queries: `"last 2 Chrome versions", "last 2 Firefox versions", "last 2 Edge versions", "Safari >= 15.4", "ios >= 15.4"`.

**Migration:** If you must support IE11, continue using Chota 0.9.x. There is no legacy build for v1.

## Non-Breaking Changes

- All public CSS class names remain compatible: `.container`, `.row`, `.col-*`, `.tag`, `body.dark`.
- No changes to utility classes or component markup.
- `!important` usage in utilities is preserved.

## Root Font-Size Migration

### What changed

Chota no longer sets `html { font-size: 62.5% }`. The root font-size is the consumer's responsibility and defaults to the browser's 16px. Every Chota-owned `rem` value was divided by 1.6 so that rendered pixels are unchanged at a 16px consumer root.

### Why

Previously Chota forced `1rem = 10px`, which overrode the consumer's root font-size and broke accessibility zoom and consumer overrides. Removing the override lets Chota respect the consumer's root font-size — including accessibility zoom and consumer overrides — while preserving the rendered design at a 16px root.

### Consumer impact

- **Consumers who did NOT override the root:** no visual change. The body font-size is still 16px — `--font-size: 1rem` at a 16px root = 16px, the same as the old `1.6rem` at a 10px root = 16px.
- **Consumers who set `html { font-size: 62.5% }`:** Chota now renders at 0.625× its 16px-root size. This is proportional scaling against the consumer's chosen root, not a second baseline.
- **Consumers who set a different root (e.g. 20px):** Chota scales proportionally to that root.

### Reference table

| Property | Before | After | Rendered px (16px root) |
|---|---|---|---|
| `--grid-maxWidth` | `120rem` | `75rem` | 1200px (unchanged) |
| `--grid-gutter` | `2rem` | `1.25rem` | 20px (unchanged) |
| `--font-size` | `1.6rem` | `1rem` | 16px (unchanged) |

### Note on em-based typography

Em-based typography (`h1`–`h6`, `.tag.is-small`/`.is-large`, `.nav .brand`, `code`/`kbd`) is unchanged — it was always relative to the body font-size, which remains 16px.

## Design Tokens

### What changed

Chota now exposes three component-level design tokens as CSS custom properties, replacing previously hardcoded values:

| Property | Before | After | Default |
|---|---|---|---|
| `--color-placeholder` | `#bdbfc4` (hardcoded in `::placeholder`) | `var(--color-placeholder)` | `#bdbfc4` |
| `--border-radius` | `4px` (hardcoded on `.card`, inputs, buttons, `code`/`kbd`, `.grouped.gapless` outer corners) | `var(--border-radius)` | `4px` |
| `--transition-duration` | `0.2s` (hardcoded on input/button transitions) | `var(--transition-duration)` | `0.2s` |

### Why

Consumers previously had to override these values with specificity battles against Chota's selectors. Exposing them as custom properties lets consumers override once on `:root` (or any selector) and have the change propagate to every affected component.

### Consumer impact

- **Consumers who do not override:** no visual change. Every token resolves to its previous hardcoded value.
- **Consumers who override:** set the token on `:root` after importing `chota.css`:

```css
@import url(chota.css);

:root {
  --border-radius: 8px; /* rounder corners on cards, inputs, buttons */
}
```

### Note on `.grouped.gapless`

The `.grouped.gapless` first/last child rules use `var(--border-radius)` for their outer corners (preserving `!important`); the inner corners stay `0` because they are joined-border geometry, not a theming knob. Overriding `--border-radius` to `0` squares both standalone buttons and gapless group outer corners consistently.
