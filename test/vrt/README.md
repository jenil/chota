# Visual Regression Testing (VRT)

## Overview

This directory contains Playwright-based visual regression tests for Chota's fixture pages. Tests run on Chromium only (Firefox/WebKit are smoke coverage only per card #124).

## Quick Start

```bash
# Ensure you've built the project first
yarn build

# Run the VRT suite
yarn test:vrt
```

## Test Structure

```
test/vrt/
├── index.spec.js          # Elements page screenshots
├── components.spec.js     # Components page screenshots
├── vrt-helpers.js         # Fixture server startup logic
├── snapshots/             # Reference screenshots (git-tracked)
│   ├── index.spec.js-snapshots/
│   └── components.spec.js-snapshots/
└── results/               # Test output (git-ignored)
    └── html/              # HTML report (git-ignored)
```

## Coverage

| Page | Viewports |
|------|-----------|
| `index.html` (Elements) | Desktop (1280×720), Mobile (375×667) |
| `components.html` (Components) | Desktop (1280×720), Mobile (375×667) |

## Deterministic Settings

- Browser: Chromium (Chrome for Testing 151.0.7922.34)
- Locale: `en-US`
- Color scheme: `light`
- Reduced motion: `reduce`
- Animations: disabled

## Snapshot Updates

To update baselines (e.g., after approved CSS changes):

```bash
npx playwright test --update-snapshots
```

**Important**: Only update snapshots after owner review of the visual changes. The CI workflow uploads diff artifacts on failure for review.

## CI Integration

The CI workflow (`.github/workflows/ci.yml`) includes:
1. Chromium installation (cached)
2. VRT execution (with `continue-on-error: true` for non-blocking feedback)
3. Artifact upload on failure (screenshots retained 30 days)

## Troubleshooting

- **Port conflicts**: Tests use dynamic ports (3100, 3200) to avoid conflicts.
- **Missing snapshots**: Run with `--update-snapshots` to generate initial baselines.
- **Slow tests**: First run downloads Chromium (~180MB); subsequent runs use cached browser.
