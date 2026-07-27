# Card #136: Spacing Utilities Validation (#61)

## Outcome: Disposition = `wontfix`

### Reproducible? **Yes**
- Chota provides **no** margin/padding utility classes (no `.mt-*`, `.mb-*`, `.pt-*`, `.p-*`, etc.)
- Unlike Bootstrap, consumers must define their own spacing utilities or use inline styles
- The gap is real: rapid development workflows expect spacing utilities

### v1-relevant? **No**
- Adding spacing utilities would be a **new feature**, not a bug fix
- Chota's design philosophy is minimal CSS — adding a full spacing utility system would significantly increase the bundle size
- Consumers who need spacing utilities can define them in a custom stylesheet (common pattern for CSS frameworks)

### Disposition: `wontfix`
- **Reasoning:** Adding spacing utilities (`.mt-1` through `.mt-5`, `.p-1` through `.p-5`, etc.) would be a new feature that significantly increases the CSS bundle size. Chota intentionally stays minimal. Consumers who need spacing utilities can define them in a custom stylesheet. This is a known limitation, not a bug.

### Browser Test Results
| Browser | Observation |
|---------|-------------|
| Chromium | No spacing utility classes in dist/chota.css |
| Firefox | Same |
| WebKit | Same |

### Evidence
- **PR:** https://github.com/jenil/chota/pull/164
- **Test file:** `test/vrt/validations/spacing-utilities.html`
- **Disposition:** `test/vrt/validations/136-disposition.md`

### Files Changed
- `test/vrt/validations/spacing-utilities.html` — demonstrates the spacing gap
- `test/vrt/validations/spacing-utilities.spec.js` — CSS analysis (passes)
- `test/vrt/validations/136-disposition.md` — disposition report

### Merge Recommendation
**Merge** — Validation-only. The disposition is `wontfix` — adding spacing utilities would be a new feature, not a bug fix.

### Cross-reference
This validation feeds into Week 3 card #137 (root font migration) and #138 (token normalization). If spacing utilities are added in Week 3, they should be designed as design tokens (CSS custom properties), not hardcoded values.
