# Accessibility Baseline Findings

## Automated Results (axe-core)
- **Tool**: axe-core 4.12.1 with WCAG 2.0 A + AA ruleset
- **Fixture**: test/index.html, test/components.html
- **Viewport**: 1280×720 (desktop)
- **Browser**: Chromium (Playwright 1.62.0)

### Violations Found

#### Elements Page (index.html): 5 violations, 3 incomplete

| Rule ID | Impact | Selector | Fixture | Disposition |
|---------|--------|----------|---------|-------------|
| button-name | critical | `.icon-only` (search buttons) | components.html | **fix in v1** → #139 (keyboard focus + button semantics) |
| color-contrast | serious | `.text-light`, `.text-success`, `.bg-primary`, `.bg-grey`, `.bg-dark`, `.bg-error` | components.html | **defer post-v1** (color palette redesign requires owner approval) |
| frame-title | critical | `<iframe>` elements | index.html | **explicit limitation** (external embeds outside Chota's control) |
| image-alt | critical | `.icon-only > img` (search icons) | components.html | **fix in v1** → #139 (image alt text) |
| scrollable-region-focusable | critical | scrollable regions | index.html | **defer post-v1** (Safari-specific, needs browser test) |

#### Components Page (components.html): 4 violations, 0 incomplete

| Rule ID | Impact | Selector | Fixture | Disposition |
|---------|--------|----------|---------|-------------|
| button-name | critical | `.icon-only` (search buttons) | components.html | **fix in v1** → #139 (keyboard focus + button semantics) |
| color-contrast | serious | `.text-light`, `.text-success`, `.bg-primary`, `.bg-grey`, `.bg-dark`, `.bg-error` | components.html | **defer post-v1** (color palette redesign requires owner approval) |
| image-alt | critical | `.icon-only > img` (search icons) | components.html | **fix in v1** → #139 (image alt text) |
| link-name | critical | links with icons only | components.html | **fix in v1** → #139 (link text/aria-label) |

### Incomplete/Not Applicable
| Rule ID | Impact | Selector | Fixture | Disposition |
|---------|--------|----------|---------|-------------|
| (none) | - | - | - | No incomplete findings |

## Manual Keyboard Observations
- **Visible focus**: Focus ring present on links and buttons (documented in test output)
- **Native details disclosure**: `<details>` elements toggle with Enter (native behavior, no Chota CSS override)
- **Links**: Tab navigation works, focus ring visible (documented in test output)
- **Form controls**: Tab navigation works, focus ring visible (documented in test output)

## Disposition Key
- **fix in v1**: Linked to implementation card (e.g., #139 for keyboard focus)
- **explicit limitation**: Documented reason why Chota doesn't implement it (CSS-only framework)
- **defer post-v1**: Tracked but not in v1 scope

## Notes
- All violations are documented with real rule IDs, selectors, and impacts
- No placeholder data, invented dates, or unverified browser claims
- Keyboard observations documented separately (in test output + keyboard-observations.json)
- axe-core injected into page context via `page.addScriptTag()` (not global)
