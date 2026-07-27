# Card #135: Grouped Controls Validation (#114)

## Outcome: Disposition = `wontfix`

### Reproducible? **Yes**
- The `.grouped` CSS rule is just `display: flex` — **no margin, no responsive behavior**
- There are no responsive media queries for `.grouped`
- On mobile, flex items overflow if they don't fit — this is expected flexbox behavior

### v1-relevant? **No**
- This is the expected behavior of a flexbox container
- Consumers can wrap grouped controls in a `.container` or use custom CSS for responsive behavior
- Adding responsive behavior to `.grouped` would be a new feature, not a bug fix

### Disposition: `wontfix`
- **Reasoning:** Chota's `.grouped` is intentionally simple — just `display: flex`. Adding responsive behavior (wrapping, stacking) would be a new feature. Consumers who need responsive grouped controls can use a custom CSS override or wrap in a responsive container.

### Browser Test Results
| Browser | Observation |
|---------|-------------|
| Chromium | `.grouped` is `display: flex`, no responsive behavior |
| Firefox | Same |
| WebKit | Same |

### Evidence
- **PR:** https://github.com/jenil/chota/pull/163
- **Test file:** `test/vrt/validations/grouped-controls.html`
- **Disposition:** `test/vrt/validations/135-disposition.md`

### Files Changed
- `test/vrt/validations/grouped-controls.html` — demonstrates grouped controls at various widths
- `test/vrt/validations/grouped-controls.spec.js` — CSS analysis
- `test/vrt/validations/135-disposition.md` — disposition report

### Merge Recommendation
**Merge** — Validation-only. The disposition is `wontfix` — `.grouped` is intentionally simple flexbox.
