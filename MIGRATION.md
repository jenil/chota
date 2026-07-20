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
