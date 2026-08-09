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
