const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// Card #139 — keyboard-focus spec.
//
// This spec proves that Chota's :focus-visible contract is honored on
// keyboard Tab navigation: after a real Tab keypress, the focused
// interactive element must show a visible outline (outline-style set,
// non-zero width, non-transparent color). Assertions are real
// (getComputedStyle), not observation-only.
//
// Chromium-pinned per the project's test contract (test:vrt / test:a11y
// must remain Chromium-pinned; Firefox/WebKit belong only to the smoke
// spec). Run via:
//   npx playwright test test/vrt/keyboard-focus.spec.js --project=chromium
//
// The focus-state VRT baselines (focus-input / focus-button / focus-link)
// are darwin-only at this time and must be regenerated after D2's
// :focus-visible CSS lands in dist/.

// Viewport matching VRT baseline
const DESKTOP = { width: 1280, height: 720 };

// Deterministic settings for Chromium (matches playwright.config.js)
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

let server;

test.beforeAll(async () => {
  // Dedicated port to avoid collisions with other VRT specs.
  server = await startFixtureServer(3301);
});

test.afterAll(async () => {
  if (server) await server.stop();
});

/**
 * Read the resolved outline of an element via getComputedStyle.
 * Returns { outlineStyle, outlineWidth, outlineColor, matchesFocusVisible }.
 */
async function readOutline(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      matchesFocusVisible: el.matches(':focus-visible'),
    };
  }, selector);
}

/**
 * Tab_forward until the element matching `selector` becomes
 * document.activeElement. Returns true if focused within maxTabs presses.
 * Uses real keyboard Tab — not focus() — so :focus-visible is matched.
 *
 * index.html contains a recursive <iframe src="index.html"> and several
 * embedded iframes that trap keyboard focus (each Tab into an iframe cycles
 * the iframe's internal focus chain). To keep this a real keyboard test of
 * Chota's own controls (not the embedded content, which is outside Chota's
 * contract — see the #embedded determinism note in README), we neutralize
 * iframe tab order for the duration of the test by setting tabindex="-1".
 * This mirrors the test-only #embedded handling in index.spec.js.
 */
async function tabUntilFocused(page, selector, maxTabs = 120) {
  // Test-only: remove iframes from tab order so Tab reaches Chota's controls.
  await page.evaluate(() => {
    document.querySelectorAll('iframe').forEach((f) => f.setAttribute('tabindex', '-1'));
  });
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el && document.activeElement === el;
    }, selector);
    if (focused) return true;
  }
  return false;
}

/**
 * Assert a visible outline on the currently-focused element matching `selector`.
 * Visible = outlineStyle is not 'none', outlineWidth is not '0px',
 * outlineColor is not transparent / rgba(0,0,0,0).
 */
async function assertVisibleFocusOutline(page, selector, label) {
  const outline = await readOutline(page, selector);
  expect(outline, `${label}: focused element must exist at ${selector}`).not.toBeNull();
  expect(
    outline.matchesFocusVisible,
    `${label}: element must match :focus-visible after Tab (got ${outline.matchesFocusVisible})`
  ).toBe(true);
  expect(
    outline.outlineStyle,
    `${label}: outlineStyle must not be 'none' (got ${outline.outlineStyle})`
  ).not.toBe('none');
  expect(
    outline.outlineWidth,
    `${label}: outlineWidth must not be '0px' (got ${outline.outlineWidth})`
  ).not.toBe('0px');
  expect(
    outline.outlineColor,
    `${label}: outlineColor must not be transparent (got ${outline.outlineColor})`
  ).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    outline.outlineColor,
    `${label}: outlineColor must not be 'transparent' (got ${outline.outlineColor})`
  ).not.toBe('transparent');
}

test.describe('Keyboard focus — :focus-visible contract (#139)', () => {
  // ── index.html ────────────────────────────────────────────────────────
  // Proves: after Tab, focused input / button / textarea / select / checkbox
  // each show a visible outline via :focus-visible.

  test('index.html: focused text input shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__input input';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html #forms__input input');

    await context.close();
  });

  test('index.html: focused .button shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    // #forms__action contains native <button> elements (submit/reset).
    const selector = '#forms__action button';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html #forms__action button');

    await context.close();
  });

  test('index.html: focused textarea shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__textareas textarea';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html #forms__textareas textarea');

    await context.close();
  });

  test('index.html: focused select shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__select select';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html #forms__select select');

    await context.close();
  });

  test('index.html: focused checkbox shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__checkbox input[type="checkbox"]';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html checkbox');

    await context.close();
  });

  test('index.html: focused plain link <a> shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    // #text__tables footer has a plain <a href="#top">[Top]</a> link.
    const selector = '#text__tables a';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'index.html plain <a>');

    await context.close();
  });

  // ── components.html ────────────────────────────────────────────────────
  // Proves the same contract on the components page for a .nav link and a
  // .button, plus asserts the .icon-only button (now aria-labelled) is
  // keyboard-focusable.

  test('components.html: focused .nav link shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    const selector = '[data-test-id="section-nav"] .nav a';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'components.html .nav a');

    await context.close();
  });

  test('components.html: focused .button shows visible outline after Tab', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    // First .button in the card section. (.button on this page is an <a>.)
    const selector = '[data-test-id="section-card"] .button';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'components.html .button');

    await context.close();
  });

  test('components.html: aria-labelled .icon-only button is keyboard-focusable', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    // The icon-only buttons live in the icons section.
    const selector = '[data-test-id="section-icons"] .button.icon-only';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus the aria-labelled .icon-only button`).toBe(true);
    await assertVisibleFocusOutline(page, selector, 'components.html .icon-only.button');

    await context.close();
  });
});

test.describe('Keyboard focus — VRT baselines (#139)', () => {
  // Focus-state VRT baselines (darwin). These prove the focus ring visually.
  // Baselines are generated via:
  //   npx playwright test test/vrt/keyboard-focus.spec.js --project=chromium --update-snapshots
  // and committed. They must be regenerated after D2's :focus-visible CSS
  // lands in dist/.

  test('index.html: focused text input — focus-input baseline', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__input input';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);

    // Clip a small region around the focused input so the baseline is stable
    // and isolates the focus ring (not the whole page).
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `bounding box for ${selector}`).not.toBeNull();
    const padding = 8;
    const clip = {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    };
    const screenshot = await page.screenshot({ clip });
    expect(screenshot).toMatchSnapshot('focus-input.png');

    await context.close();
  });

  test('index.html: focused .button — focus-button baseline', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'index.html');

    const selector = '#forms__action button';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);

    const box = await page.locator(selector).first().boundingBox();
    expect(box, `bounding box for ${selector}`).not.toBeNull();
    const padding = 8;
    const clip = {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    };
    const screenshot = await page.screenshot({ clip });
    expect(screenshot).toMatchSnapshot('focus-button.png');

    await context.close();
  });

  test('components.html: focused .nav link — focus-link baseline', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    const selector = '[data-test-id="section-nav"] .nav a';
    const focused = await tabUntilFocused(page, selector);
    expect(focused, `Tab should focus ${selector}`).toBe(true);

    // Use .first() — section-nav contains one .nav, but the page has
    // multiple .nav sections; the assertion targets the first link in the
    // first .nav (Link 1), which is what tabUntilFocused focused.
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `bounding box for ${selector}`).not.toBeNull();
    const padding = 8;
    const clip = {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    };
    const screenshot = await page.screenshot({ clip });
    expect(screenshot).toMatchSnapshot('focus-link.png');

    await context.close();
  });
});
