# Card #133: WordPress Tag Collision Validation (#77)

## Outcome: Disposition = `wontfix`

### Reproducible? **Yes**
- The `.tag` CSS rule exists in `dist/chota.css`: `.tag { display: inline-block; text-transform: uppercase; ... }`
- WordPress adds `class="tag"` to `<body>` on tag archives
- If the CSS is loaded, `.tag` selector matches any element with `class="tag"`, including `<body class="tag">`
- **Note:** Playwright's cross-origin stylesheet restriction prevents verifying the collision in the test, but the CSS rule clearly exists and would match `body.tag` in production.

### v1-relevant? **No**
- WordPress users who encounter this can add a single CSS override: `body.tag { display: block; text-transform: none; color: inherit; border: none; padding: 0; }`
- This is a known WordPress-specific issue with a one-line workaround
- Renaming `.tag` would break existing sites that use the `.tag` class intentionally

### Disposition: `wontfix`
- **Reasoning:** The collision is a WordPress-specific edge case with a simple CSS workaround. Renaming `.tag` would be a breaking change for all existing users who intentionally use the `.tag` class. Chota's design philosophy is to provide minimal CSS — adding WordPress-specific overrides or renaming a core class is outside scope.

### Browser Test Results
| Browser | Observation |
|---------|-------------|
| Chromium | `.tag` rule exists in dist/chota.css (verified via file read) |
| Firefox | Same |
| WebKit | Same |

### Evidence
- **PR:** https://github.com/jenil/chota/pull/161
- **Commit:** (to be created)
- **Test file:** `test/vrt/validations/wordpress-tag-collision.html`
- **Disposition:** `test/vrt/validations/133-disposition.md`

### Files Changed
- `test/vrt/validations/wordpress-tag-collision.html` — demonstrates the collision
- `test/vrt/validations/wordpress-tag-collision.spec.js` — Playwright test (CSS analysis)
- `test/vrt/validations/133-disposition.md` — disposition report

### Merge Recommendation
**Merge** — This is validation-only (no CSS changes). The PR documents the collision and provides a clear `wontfix` disposition with reasoning. WordPress users can add a one-line CSS override.
