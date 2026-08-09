const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// #137 — Root-font scaling proof. After D2 removed `html { font-size: 62.5% }`
// and divided all rem tokens by 1.6, a 16px consumer root renders identically to
// the old 10px-override behavior. This spec proves:
//   1. At a 16px consumer root, rendered pixels match the design intent
//      (consistent with the existing components.spec.js / index.spec.js baselines).
//   2. At a 10px consumer root (simulated by injecting `html { font-size: 62.5% }`),
//      every rem-derived property scales by 0.625 (10/16) proportionally.
//   3. The ratio of the 10px-root value to the 16px-root value is exactly 0.625
//      for every measured property — a single regression gate that fails if any
//      property stops scaling with the root font.
//
// No toMatchSnapshot: the card forbids a second baseline. Asserted values are
// computed-style reads, not screenshots.

const DESKTOP = { width: 1280, height: 720 };

// Deterministic settings for Chromium (matches other specs)
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3700);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

// Read the same set of rem-derived computed properties from components.html.
// Returns the values used by both the 16px-root and 10px-root tests so the
// ratio test can compare like-for-like.
async function readRemProperties(page) {
  const card = await page
    .locator('[data-test-id="section-card"] .card')
    .first();
  const cardPaddingTop = await card.evaluate(
    (el) => window.getComputedStyle(el).paddingTop
  );

  const tag = await page
    .locator('[data-test-id="section-tag"] .tag')
    .first();
  const tagStyles = await tag.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return { fontSize: cs.fontSize, padding: cs.padding };
  });

  const col6 = await page
    .locator('[data-test-id="section-grid"] .col-6')
    .first();
  const col6Width = await col6.evaluate(
    (el) => window.getComputedStyle(el).width
  );

  const button = await page.locator('.button').first();
  const buttonHeight = await button.evaluate(
    (el) => window.getComputedStyle(el).height
  );

  return {
    cardPaddingTop,
    tagFontSize: tagStyles.fontSize,
    tagPadding: tagStyles.padding,
    col6Width,
    buttonHeight,
  };
}

test.describe('Root-font scaling — 16px vs 10px consumer root (#137)', () => {
  // ── Test 1: 16px consumer root matches design intent ─────────────────
  // Consolidates the 16px-root baseline assertions already present in
  // components.spec.js and index.spec.js. No injection — the converted
  // dist/chota.css has no 62.5% override, so 1rem = 16px.
  test('16px root: rendered pixels match design intent', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    const card = await page
      .locator('[data-test-id="section-card"] .card')
      .first();
    const cardPadding = await card.evaluate(
      (el) => window.getComputedStyle(el).padding
    );
    expect(cardPadding).toBe('10px 20px');

    const tag = await page
      .locator('[data-test-id="section-tag"] .tag')
      .first();
    const tagStyles = await tag.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { fontSize: cs.fontSize, padding: cs.padding };
    });
    expect(tagStyles.fontSize).toBe('16px');
    expect(tagStyles.padding).toBe('5px');

    const col6 = await page
      .locator('[data-test-id="section-grid"] .col-6')
      .first();
    const col6Width = await col6.evaluate(
      (el) => window.getComputedStyle(el).width
    );
    expect(col6Width).toBe('580px');

    const button = await page.locator('.button').first();
    const buttonHeight = await button.evaluate(
      (el) => window.getComputedStyle(el).height
    );
    expect(buttonHeight).toBe('38px');

    await context.close();
  });

  // ── Test 2: 10px consumer root scales proportionally by 0.625 ────────
  // Injects `html { font-size: 62.5% !important; }` to simulate a 10px
  // consumer root. Every rem-derived value should be 0.625× of the 16px-root
  // value (10/16 = 0.625).
  test('10px root: design scales proportionally by 0.625', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'components.html');

    await page.addStyleTag({
      content: 'html { font-size: 62.5% !important; }',
    });

    const card = await page
      .locator('[data-test-id="section-card"] .card')
      .first();
    const cardPadding = await card.evaluate(
      (el) => window.getComputedStyle(el).padding
    );
    expect(cardPadding).toBe('6.25px 12.5px');

    const tag = await page
      .locator('[data-test-id="section-tag"] .tag')
      .first();
    const tagStyles = await tag.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { fontSize: cs.fontSize, padding: cs.padding };
    });
    expect(tagStyles.fontSize).toBe('10px');
    expect(tagStyles.padding).toBe('3.125px');

    const col6 = await page
      .locator('[data-test-id="section-grid"] .col-6')
      .first();
    const col6Width = await col6.evaluate(
      (el) => window.getComputedStyle(el).width
    );
    expect(col6Width).toBe('362.5px');

    const button = await page.locator('.button').first();
    const buttonHeight = await button.evaluate(
      (el) => window.getComputedStyle(el).height
    );
    // 38px × 0.625 = 23.75px would be the pure-rem scaling, but `.button`'s
    // `border: 1px solid transparent` is a fixed pixel value that does not
    // scale with the root font. Actual: padding 6.25px × 2 = 12.5px,
    // line-height 10px, border 1px × 2 = 2px → 12.5 + 10 + 2 = 24.5px.
    // The ratio test (Test 3) excludes .button height for this reason.
    expect(buttonHeight).toBe('24.5px');

    await context.close();
  });

  // ── Test 3: explicit proportional-scaling proof ──────────────────────
  // Loads components.html twice — once at the 16px default root, once with
  // `html { font-size: 62.5% !important; }` injected — and asserts the ratio
  // of the 10px-root value to the 16px-root value is ≈ 0.625 for every
  // pure-rem property. A single gate that fails if any rem-derived property
  // stops scaling with the root font.
  //
  // `.button` height is intentionally excluded from the ratio check: its
  // `border: 1px solid transparent` is a fixed pixel value (not rem), so the
  // 2px border does not scale with the root font. 16px root → 38px
  // (10+10 padding + 16 line-height + 2 border); 10px root → 24.5px
  // (6.25+6.25 padding + 10 line-height + 2 border); ratio 24.5/38 ≈ 0.645,
  // not 0.625. The absolute 10px-root value is asserted in Test 2; the
  // non-scaling border is the design intent, not a regression.
  test('10px root is 0.625× of 16px root for rem-derived properties', async ({ browser }) => {
    // 16px root
    const context16 = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page16 = await context16.newPage();
    await loadFixture(page16, server, 'components.html');
    const v16 = await readRemProperties(page16);
    await context16.close();

    // 10px root (injected)
    const context10 = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page10 = await context10.newPage();
    await loadFixture(page10, server, 'components.html');
    await page10.addStyleTag({
      content: 'html { font-size: 62.5% !important; }',
    });
    const v10 = await readRemProperties(page10);
    await context10.close();

    // Each 10px-root value should be 0.625× the 16px-root value for
    // pure-rem properties. (.button height is excluded — see comment above;
    // its 1px border is a fixed pixel value and does not scale with the root.)
    expect(parseFloat(v10.cardPaddingTop) / parseFloat(v16.cardPaddingTop)).toBeCloseTo(
      0.625,
      2
    );
    expect(parseFloat(v10.tagFontSize) / parseFloat(v16.tagFontSize)).toBeCloseTo(
      0.625,
      2
    );
    expect(parseFloat(v10.tagPadding) / parseFloat(v16.tagPadding)).toBeCloseTo(
      0.625,
      2
    );
    expect(parseFloat(v10.col6Width) / parseFloat(v16.col6Width)).toBeCloseTo(
      0.625,
      2
    );
  });
});
