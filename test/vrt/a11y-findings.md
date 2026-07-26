# Accessibility Baseline Findings

## Automated Results (axe-core)
- **Tool**: axe-core 4.12.1 with WCAG 2.0 A + AA ruleset
- **Viewport**: 1280×720 (desktop)
- **Browser**: Chromium (Playwright 1.62.0)
- **Baseline file**: `test/vrt/a11y-baseline.json` (enforceable contract)

## Violations by Fixture

### Elements Page (index.html): 5 violations, 0 incomplete

| Rule ID | Impact | Affected Nodes | Fixture | Disposition |
|---------|--------|----------------|---------|-------------|
| button-name | critical | `.icon-only` (search buttons) | index.html | fix in v1 → #139 (keyboard focus + button semantics) |
| color-contrast | serious | `cite > a[href="#!"]`, `h4 > code:nth-child(N)`, `kbd`, `p > code`, `pre > code`, `.success.button[href="#"]` | index.html | defer post-v1 (color palette redesign) |
| frame-title | serious | `iframe` | index.html | explicit limitation (external embeds outside Chota's control) |
| image-alt | critical | `.icon-only > img` (search icons) | index.html | fix in v1 → #139 (image alt text) |
| scrollable-region-focusable | serious | `pre:nth-child(5)` | index.html | defer post-v1 (Safari-specific, needs browser test) |

### Components Page (components.html): 4 violations, 0 incomplete

| Rule ID | Impact | Affected Nodes | Fixture | Disposition |
|---------|--------|----------------|---------|-------------|
| button-name | critical | `.icon-only:nth-child(5)`, `.icon-only:nth-child(6)` (search buttons) | components.html | fix in v1 → #139 (keyboard focus + button semantics) |
| color-contrast | serious | `.text-light`, `.text-success`, `.bg-primary`, `.bg-grey`, `.bg-dark`, `.bg-error` | components.html | defer post-v1 (color palette redesign) |
| image-alt | critical | `.icon-only:nth-child(5) > img`, `.icon-only:nth-child(6) > img` (search icons) | components.html | fix in v1 → #139 (image alt text) |
| link-name | serious | `nav:nth-child(12) > .nav-left > .brand[href="#"]` | components.html | fix in v1 → #139 (link text/aria-label) |

## Disposition Key
- **fix in v1**: Linked to implementation card (e.g., #139 for keyboard focus)
- **explicit limitation**: Documented reason why Chota doesn't implement it (CSS-only framework)
- **defer post-v1**: Tracked but not in v1 scope

## Baseline Contract
- **File**: `test/vrt/a11y-baseline.json` (enforceable, checked in)
- **Granularity**: (page, rule ID, impact, affected node)
- **Comparison**: `test/vrt/a11y.spec.js` compares normalized findings against baseline
- **Fails for**: new rules, higher severity, or new affected nodes
- **Passes for**: existing approved findings that match the baseline
- **Deliberate failure**: button-label and html-has-lang tests prove the baseline catches violations (then reverts)

## Implementation Details

### Normalization Pipeline
1. **Target normalization**: axe-core returns `target` as `[selector]` (array of strings); joined to single string
2. **Exact node matching**: baseline node string must exactly match current node string (no pseudo-class stripping)
3. **Node-level granularity**: (page, rule ID, impact, affected node) — every current node must match an approved node

### Comparison Rules
- **New rule**: A violation ID not in baseline → FAIL
- **Severity increase**: Impact level escalated (e.g., minor → moderate) → FAIL
- **New node**: A current node not in the approved nodes for that rule → FAIL
- **Disappearing node**: A baseline node no longer present → no failure (allowed to resolve)
- **Match**: All current nodes for a rule appear in the approved nodes → PASS

### CI Artifacts
- Full findings written to `test/vrt/results/a11y-{pageName}.json`
- No timestamps in artifacts for stable comparison
- `a11y-keyboard.spec.js` documents manual keyboard observations (non-failing)
