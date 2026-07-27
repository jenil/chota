# Card #134: Full-Height Nav Logo Validation (#111)

## Outcome: Disposition = `wontfix`

### Reproducible? **Yes**
- The `.nav` CSS uses `display: flex` with `align-items: center`
- The `.brand` CSS has `display: flex; align-items: center; padding: 1rem 2rem;` — **no height constraint**
- Portrait/tall logos get constrained by the nav's flex layout — the brand's padding sets the nav height, and images inside are constrained to fit within that height

### v1-relevant? **No**
- This is a design limitation, not a bug
- Consumers can use custom CSS to override: `.nav .brand img { max-height: none; height: auto; }`
- Chota's design philosophy is minimal — it provides a simple nav pattern, not a logo-aware nav

### Disposition: `wontfix`
- **Reasoning:** Chota intentionally keeps the nav simple. Adding a "full-height logo" feature would be a new component, which is out of scope for v1. Consumers who need tall logos can use a custom CSS override (one line).

### Browser Test Results
| Browser | Observation |
|---------|-------------|
| Chromium | `.nav` uses flexbox, `.brand` has no height constraint |
| Firefox | Same |
| WebKit | Same |

### Evidence
- **PR:** https://github.com/jenil/chota/pull/162
- **Test file:** `test/vrt/validations/full-height-nav-logo.html`
- **Disposition:** `test/vrt/validations/134-disposition.md`

### Files Changed
- `test/vrt/validations/full-height-nav-logo.html` — demonstrates portrait vs landscape logos
- `test/vrt/validations/full-height-nav-logo.spec.js` — CSS analysis
- `test/vrt/validations/134-disposition.md` — disposition report

### Merge Recommendation
**Merge** — Validation-only. The disposition is `wontfix` — consumers can use a one-line CSS override.
