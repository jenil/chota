# Visual Regression Testing (VRT)

## Overview

This directory contains Playwright-based visual regression tests for Chota's fixture pages. Tests run on Chromium only (Firefox/WebKit are smoke coverage only per card #124).

## Quick Start

```bash
# Ensure you've built the project first
yarn build

# Run the VRT suite (Chromium only)
yarn test:vrt

# Run accessibility baseline (Chromium only)
yarn test:a11y

# Run CSS API contract (Chromium only)
yarn test:api

# Run browser smoke coverage (Firefox + WebKit)
npx playwright test test/vrt/browser-smoke.spec.js --project=firefox --project=webkit
```

## Test Structure

```
test/vrt/
├── index.spec.js              # Elements page screenshots (Chromium)
├── components.spec.js         # Components page screenshots (Chromium)
├── grouped-controls.spec.js   # Grouped controls — computed-style assertions, no screenshots (Chromium)
├── browser-smoke.spec.js      # Firefox/WebKit smoke tests (no screenshots)
├── a11y.spec.js               # Accessibility baseline (Chromium)
├── a11y-keyboard.spec.js      # Keyboard focus observations (Chromium)
├── api.spec.js                # CSS public API contract (Chromium)
├── dark-mode.spec.js          # Dark-mode custom properties (Chromium)
├── breakpoints.spec.js        # Responsive breakpoint boundaries (Chromium)
├── vrt-helpers.js             # Fixture server startup logic
├── snapshots/                 # Reference screenshots (git-tracked, Playwright-managed)
│   ├── index.spec.js-snapshots/              # toMatchSnapshot baselines (index.html)
│   ├── components.spec.js-snapshots/         # toMatchSnapshot baselines (components.html)
│   └── validations/                          # Validation test specs
│       └── nav-logo-full-height.spec.js-snapshots/  # toMatchSnapshot baselines (nav-logo-full-height.html)
├── report/                    # HTML report (git-ignored, generated on each run)
└── results/                   # Screenshot/a11y/smoke artifacts (uploaded on failure)
```

## Coverage

| Test type | Browsers | Pages | Viewports |
|-----------|----------|-------|-----------|
| VRT (toMatchSnapshot) | Chromium | index.html, components.html, nav-logo-full-height.html | Desktop (1280×720), Mobile (375×667) |
| Computed-style (no screenshots) | Chromium | mobile-grid-overflow.html, grouped-controls.html, dark-mode, breakpoints | Desktop (1280×720), Mobile (375×667), narrow (320×568/414×896) |
| A11y (axe-core) | Chromium | index.html | Desktop (1280×720) |
| API (selectors) | Chromium | dist/chota.css | N/A |
| Smoke (functional) | Firefox, WebKit | index.html, components.html | Desktop (1280×720), Mobile (375×667) |

## Snapshot Layout and Platform Policy

### How Playwright resolves snapshots

`toMatchSnapshot('<arg>')` resolves to a platform-specific path under
`test/vrt/snapshots/<spec-filename>-snapshots/`:

- **macOS Chromium**: `<arg>-chromium-darwin.png`
- **Linux CI**: `<arg>-chromium-linux.png`

The spec filename (e.g., `index.spec.js`) determines the snapshot subdirectory.
No fallback lookup occurs — if a file does not exist at the resolved path,
the test fails. An unsuffixed `*-chromium.png` (no platform suffix) is never
resolved by any supported execution path.

### Platform policy

- **Linux Chromium** (`ubuntu-latest`): required merge evidence. Every
  `toMatchSnapshot` assertion must have a corresponding `-chromium-linux.png`
  baseline committed to the repository. CI runs on this platform and is the
  sole authority for merge approval.
- **macOS Chromium** (`darwin`): supported for local validation. Baselines
  exist at `-chromium-darwin.png` so developers can run `yarn test:vrt` locally.
  macOS baselines are **not** a substitute for Linux CI evidence.

### Snapshot naming convention

| Spec | Example matcher arg | Resolved path (macOS) | Resolved path (Linux) |
|---|---|---|---|
| index.html | `index-desktop.png` | `index.spec.js-snapshots/index-desktop-chromium-darwin.png` | `index.spec.js-snapshots/index-desktop-chromium-linux.png` |
| components.html | `components-mobile.png` | `components.spec.js-snapshots/components-mobile-chromium-darwin.png` | `components.spec.js-snapshots/components-mobile-chromium-linux.png` |
| nav-logo-full-height.html | `134-default-tall.png` | `validations/nav-logo-full-height.spec.js-snapshots/134-default-tall-chromium-darwin.png` | `validations/nav-logo-full-height.spec.js-snapshots/134-default-tall-chromium-linux.png` |

## Deterministic Settings

- Browser: Chromium (Chrome for Testing 151.0.7922.34)
- Locale: `en-US`
- Color scheme: `light`
- Reduced motion: `reduce`
- Animations: disabled (via `bypassCSP`)

## Snapshot Updates

To update Chromium baselines (e.g., after approved CSS changes):

```bash
npx playwright test --project=chromium --update-snapshots
```

**Important**: Only update snapshots after owner review of the visual changes. The CI workflow uploads diff artifacts on failure for review.

## Smoke Tests

The smoke spec (`browser-smoke.spec.js`) validates that Firefox and WebKit can load and render Chota's fixture pages. It does NOT produce screenshots — it asserts:
- Navigation returns HTTP 200
- `.container` element is visible
- Page-specific elements (h1, .tag) are visible
- Mobile viewport rendering works

Run manually:
```bash
npx playwright test test/vrt/browser-smoke.spec.js --project=firefox --project=webkit
```

## CI Integration

The CI workflow (`.github/workflows/ci.yml`) runs the following quality gates in order:
1. Install dependencies (`yarn install --frozen-lockfile`)
2. Lint CSS (`yarn test`)
3. Build + size gate (`yarn build`)
4. Install Chromium (cached)
5. CSS Public API Contract (`yarn test:api`) — requires Chromium
6. Visual Regression Tests (Chromium) (`yarn test:vrt`)
7. Upload VRT artifacts on failure
8. Install Firefox and WebKit (cached)
9. Accessibility baseline (Chromium) (`yarn test:a11y`)
10. Upload a11y artifacts on failure
11. Browser smoke coverage (Firefox + WebKit) — fail-closed (no `continue-on-error`)
12. Upload smoke coverage artifacts on failure

All gates fail closed. No gate uses `continue-on-error`.

## Troubleshooting

- **Port conflicts**: Tests use dynamic ports (3100, 3200, 3500) to avoid conflicts.
- **Missing snapshots**: Run with `--project=chromium --update-snapshots` to generate Chromium baselines.
- **Slow tests**: First run downloads Chromium (~180MB); subsequent runs use cached browser.
- **Smoke test fails**: Ensure Firefox and WebKit are installed (`npx playwright install firefox webkit`).
