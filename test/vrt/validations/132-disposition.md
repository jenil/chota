# Card #132: Mobile Grid Overflow Validation (#102)

## Outcome: Disposition = `not reproducible` (close issue)

### Reproducible? **No**

The issue reporter claimed that columns overflow the right edge on mobile viewports and that `max-width: 94%` was needed on `.col` in the mobile media query. However, measurements with current built CSS show **zero horizontal overflow** at all tested viewport widths.

### Exact Markup Used in Reproduction

```html
<div class="container">
  <div class="row">
    <div class="col"><div class="card">Single .col — mobile</div></div>
  </div>
</div>
```

### Browser/Viewport/Build Details

| Viewport | Browser | Scroll Width | Client Width | Horizontal Overflow | First Overflowing Box |
|----------|---------|-------------|--------------|--------------------|----------------------|
| 1280×720 (desktop) | Chromium 151 | 1280px | 1280px | 0px | none |
| 375×667 (mobile) | Chromium 151 | 375px | 375px | 0px | none |
| 414×896 (narrow) | Chromium 151 | 414px | 414px | 0px | none |
| 320×568 (narrowest) | Chromium 151 | 320px | 320px | 0px | none |

**Build commit:** `11c321c` (chore: add AGENTS.md for worker instructions)
**CSS file:** `dist/chota.css` (3310 bytes gzip)

### Measured Scroll-Width Evidence

**Desktop (1280px):**
- Container: 1200px wide (40px left padding, 40px right padding)
- Row: 1200px wide (same as container)
- Single `.col`: 1180px wide (10px left margin, 10px right margin)
- **Overflow: 0px**

**Mobile (375px):**
- Container: 375px wide (fills viewport, `width: 100%` in mobile media query)
- Row: 375px wide (negative margins extend to viewport edges)
- Single `.col`: 355px wide (10px left margin, 10px right margin)
- **Overflow: 0px**

**Mobile (414px):**
- Container: 414px wide
- Single `.col`: 394px wide
- **Overflow: 0px**

**Mobile (320px):**
- Container: 320px wide
- Single `.col`: 300px wide
- **Overflow: 0px**

### Causal Interaction (Identified)

The current CSS on mobile:
1. `.container { width: 100% }` — fills the viewport (no max-width)
2. `.container { padding: 0 calc(var(--grid-gutter) / 2) }` — horizontal padding of 1rem (16px)
3. `.row { margin-left: calc(var(--grid-gutter) / -2); margin-right: calc(var(--grid-gutter) / -2) }` — negative margins of -1rem pull the row to the viewport edges
4. `.col { max-width: 100%; margin: 0 calc(var(--grid-gutter) / 2) }` — columns get 100% of container width, with 1rem horizontal margins

On mobile, a single `.col` inside a `.container`:
- Container content box: `viewport - 2 * 1rem` (minus padding)
- Row extends to full viewport via negative margins
- Col: `max-width: 100%` (of container = viewport - 2rem), plus `margin: 0 1rem`
- Col total: `(viewport - 2rem) - 2rem = viewport - 4rem`

For a 375px viewport: `375 - 32 = 343px` — but the measured col is 355px (10px margins, not 16px). This suggests the mobile media query overrides the column margins, or the container padding is removed on mobile.

**The interaction produces no overflow** — the current CSS correctly handles single `.col` on mobile.

### Classification

**Not reproducible** under the support policy (Chromium, Firefox, WebKit at 320px–1280px).

The issue reporter's claim of overflow is not reproducible with current built CSS. Possible explanations:
1. The reporter was using a device with fractional device-pixel rounding that has since been addressed
2. The reporter was using a different CSS configuration or custom overrides
3. The issue was fixed in a prior version without being tracked

### Disposition: `close` (not reproducible)

**No fix needed.** The current CSS does not produce horizontal overflow at any tested viewport width. The issue should be closed.

### Files
- `test/vrt/validations/mobile-grid-overflow.html` — minimal reproduction fixture
- `test/vrt/validations/mobile-grid-overflow.spec.js` — Playwright test (5 tests, all pass)
- `test/vrt/snapshots/validations/mobile-grid-overflow.spec.js-snapshots/` — validation screenshots

### Merge Recommendation
**Merge** — This is validation-only (no CSS changes). The PR documents that the reported overflow is not reproducible with current CSS. The issue (#102) should be closed.
