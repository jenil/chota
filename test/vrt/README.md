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

## How the VRT gate is wired (#190)

`test:vrt` no longer lists spec files. It runs `npx playwright test --project=chromium`, and Playwright discovers every `*.spec.js` under `test/vrt/` (via `testDir` + `testMatch` in `playwright.config.js`).

The `chromium` project carries a per-project `testIgnore` that excludes the four specs which are **not** part of the VRT gate:

| Excluded spec | Own gate |
|---|---|
| `a11y.spec.js` | `yarn test:a11y` (Chromium) |
| `api.spec.js` | `yarn test:api` (Chromium) |
| `browser-smoke.spec.js` | CI smoke step (Firefox + WebKit) |
| `root-font-scaling.spec.js` | manual-run |

Why per-project `testIgnore` instead of a top-level one: Playwright applies `testIgnore` even to files passed explicitly on the command line, so a top-level ignore would silently zero-out `test:a11y`, `test:api`, and the smoke step. The ignore therefore lives only on the `chromium` project; `test:a11y` / `test:api` run on the dedicated `chromium-a11y-api` project (no `testIgnore`, explicit paths) and the smoke step runs on `firefox` / `webkit`. The VRT project keeps the name `chromium` because Playwright embeds the project name in the snapshot suffix — renaming it would break every `-chromium-<platform>.png` baseline. All four gates stay Chromium-pinned (or Firefox/WebKit-only for smoke) and the CI gate order is unchanged.

### Adding a VRT spec

1. Drop a new `*.spec.js` under `test/vrt/` (validation specs go in `test/vrt/validations/`).
2. That's it — no `package.json` or `playwright.config.js` edit. The spec is picked up by `chromium` discovery automatically and runs in `yarn test:vrt`.
3. If the new spec produces screenshots, add the matching `-chromium-linux.png` (and `-chromium-darwin.png` for local runs) baselines under `test/vrt/snapshots/` — see [Snapshot Layout and Platform Policy](#snapshot-layout-and-platform-policy).

Adding a non-VRT spec (e.g. a new a11y or API contract file) is the exception: add it to the `NON_VRT_SPECS` array in `playwright.config.js` and give it its own dedicated gate, mirroring `a11y.spec.js` / `api.spec.js`.

## Test Structure

```
test/vrt/
├── index.spec.js              # Elements page screenshots (Chromium)
├── components.spec.js         # Components page screenshots (Chromium)
├── grouped-controls.spec.js   # Grouped controls — computed-style assertions, no screenshots (Chromium)
├── root-font-scaling.spec.js  # Root-font scaling proof — 16px vs 10px consumer root, computed-style only, no screenshots (Chromium; not wired into test:vrt — run manually)
├── browser-smoke.spec.js      # Firefox/WebKit smoke tests (no screenshots)
├── a11y.spec.js               # Accessibility baseline (Chromium)
├── keyboard-focus.spec.js     # Keyboard focus — :focus-visible assertions + focus-state VRT baselines (Chromium)
├── api.spec.js                # CSS public API contract (Chromium)
├── dark-mode.spec.js          # Dark-mode custom properties (Chromium)
├── breakpoints.spec.js        # Responsive breakpoint boundaries (Chromium)
├── vrt-helpers.js             # Fixture server startup logic
├── snapshots/                 # Reference screenshots (git-tracked, Playwright-managed)
│   ├── index.spec.js-snapshots/              # toMatchSnapshot baselines (index.html)
│   ├── components.spec.js-snapshots/         # toMatchSnapshot baselines (components.html)
│   ├── keyboard-focus.spec.js-snapshots/     # toMatchSnapshot baselines (keyboard-focus, focus-state)
│   └── validations/                          # Validation test specs
│       └── nav-logo-full-height.spec.js-snapshots/  # toMatchSnapshot baselines (nav-logo-full-height.html)
├── report/                    # HTML report (git-ignored, generated on each run)
└── results/                   # Screenshot/a11y/smoke artifacts (uploaded on failure)
```

## Coverage

| Test type | Browsers | Pages | Viewports |
|-----------|----------|-------|-----------|
| VRT — first-fold (toMatchSnapshot, `fullPage: false`) | Chromium | index.html, components.html, nav-logo-full-height.html | Desktop (1280×720), Mobile (375×667) |
| VRT — full-page (toMatchSnapshot, `fullPage: true`) | Chromium | index.html, components.html | Desktop (1280×720), Mobile (375×667) |
| VRT — per-section element (locator screenshot) | Chromium | index.html, components.html | Desktop (1280×720) only |
| Computed-style (no screenshots) | Chromium | index.html, components.html, mobile-grid-overflow.html, grouped-controls.html, dark-mode, breakpoints | Desktop (1280×720), Mobile (375×667), narrow (320×568/414×896) |
| A11y (axe-core) | Chromium | index.html | Desktop (1280×720) |
| Keyboard focus (computed-style + VRT) | Chromium | index.html, components.html | Desktop (1280×720) |
| API (selectors) | Chromium | dist/chota.css | N/A |
| Smoke (functional) | Firefox, WebKit | index.html, components.html | Desktop (1280×720), Mobile (375×667) |

### Section-locator strategy (#180)

Per-section element screenshots target a stable section root:

- **`index.html`** — uses the existing `id` attributes on every `<article>` / `<fieldset>` (e.g. `#forms__input`, `#forms__action`, `#text__tables`). No fixture markup change was required.
- **`components.html`** — sections had no IDs, so a `data-test-id` attribute was added to each of the 7 `<section>` opening tags (`section-nav`, `section-tabs`, `section-card`, `section-tag`, `section-grid`, `section-helpers`, `section-icons`). The attribute is additive only — no visible or behavioral change.

The full-page and per-section captures supplement (do not replace) the first-fold baselines `index-desktop.png`, `index-mobile.png`, `components-desktop.png`, and `components-mobile.png`, which are preserved unchanged.

### Keyboard focus (#139)

`keyboard-focus.spec.js` replaces the former observation-only `a11y-keyboard.spec.js` (which logged focus data but never failed). The new spec uses real keyboard interactions (`page.keyboard.press('Tab')`) and asserts the resulting focus target plus its computed outline:

- Real `Tab` navigation until the target selector is `document.activeElement` (not `el.focus()`), so Chromium matches `:focus-visible`.
- For each focused element, `getComputedStyle` assertions: `outlineStyle` is not `none`, `outlineWidth` is not `0px`, `outlineColor` is not `transparent` / `rgba(0, 0, 0, 0)`, and `el.matches(':focus-visible')` is `true`.
- Coverage: on `index.html` — text input, native `<button>`, `<textarea>`, `<select>`, checkbox, plain `<a>`; on `components.html` — `.nav a`, `.button`, and the aria-labelled `.icon-only` button.
- Three focus-state VRT baselines (`focus-input.png`, `focus-button.png`, `focus-link.png`) clipped around the focused element prove the focus ring visually. Baselines are darwin-only at this time and must be (re)generated after the `:focus-visible` CSS lands in `dist/`:
  ```bash
  npx playwright test test/vrt/keyboard-focus.spec.js --project=chromium --update-snapshots
  ```

The spec is Chromium-pinned per the project's test contract and wired into `yarn test:vrt` via the `test:vrt` script in `package.json`.

### Full-page determinism: `index.html` `#embedded` (#180)

`index.html`'s `#embedded` section contains native `<audio controls>` / `<video controls>`, `<canvas>`, `<meter>`, `<progress>`, and a recursive `<iframe src="index.html">`. When scroll-stitched via `fullPage: true`, these elements render non-deterministically run-to-run (verified: 3 consecutive raw captures all differ byte-for-byte). None of them carry a Chota CSS contract (`.card` / `.tag` / `.button` / `.col-*`), so the index.html full-page tests inject `#embedded { visibility: hidden !important; }` via `page.addStyleTag` before the screenshot. This is a test-only runtime injection — `test/index.html` is not modified. The section's box is preserved (`visibility:hidden`, not `display:none`) so the page layout is unchanged. `components.html` has no such section and needs no injection.

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

(`--project=chromium` targets the VRT gate only — the `chromium` project's `testIgnore` keeps the non-VRT specs out, so this updates VRT baselines without running `test:a11y` / `test:api` / smoke / manual specs.)

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
