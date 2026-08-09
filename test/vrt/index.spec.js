const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// Viewports as specified in card #124
const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };

// Deterministic settings for Chromium
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3100);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

test.describe('Elements page (index.html)', () => {
  test('desktop viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('index-desktop.png');

    await context.close();
  });

  test('mobile viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('index-mobile.png');

    await context.close();
  });

  // #180 — Full-page captures supplement the first-fold baselines above.
  // These scroll-stitch the entire document so #137 (root-font migration)
  // and #138 (token normalization) cannot silently regress off-fold sections.
  //
  // index.html's #embedded section contains native <audio>/<video> controls,
  // <canvas>, <meter>, <progress>, and a recursive <iframe src="index.html">
  // whose native chrome renders non-deterministically run-to-run when
  // scroll-stitched (verified: 3 consecutive raw captures all differ). None of
  // these elements carry a Chota CSS contract (.card/.tag/.button/.col-*), so
  // we hide #embedded via runtime CSS injection (test-only; the fixture file is
  // not modified) to produce a deterministic baseline. The section's box is
  // preserved (visibility:hidden, not display:none) so page layout is unchanged.
  test('desktop full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');
    await page.addStyleTag({
      content: '#embedded { visibility: hidden !important; }',
    });

    const screenshot = await page.screenshot({ fullPage: true });
    await expect(screenshot).toMatchSnapshot('index-fullpage-desktop.png');

    await context.close();
  });

  test('mobile full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');
    await page.addStyleTag({
      content: '#embedded { visibility: hidden !important; }',
    });

    const screenshot = await page.screenshot({ fullPage: true });
    await expect(screenshot).toMatchSnapshot('index-fullpage-mobile.png');

    await context.close();
  });

  // #180 — Per-section element screenshots (desktop only). index.html already
  // has stable `id` attributes on every <article>/<fieldset>, so we target
  // those directly (no fixture markup change required for this page).
  test('desktop: forms input section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const screenshot = await page.locator('#forms__input').screenshot();
    await expect(screenshot).toMatchSnapshot('index-section-forms-input.png');

    await context.close();
  });

  test('desktop: forms action section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const screenshot = await page.locator('#forms__action').screenshot();
    await expect(screenshot).toMatchSnapshot('index-section-forms-action.png');

    await context.close();
  });

  test('desktop: tables section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const screenshot = await page.locator('#text__tables').screenshot();
    await expect(screenshot).toMatchSnapshot('index-section-tables.png');

    await context.close();
  });

  // #180 — Focused computed-style assertions on rem-derived properties.
  // Screenshots supplement these; they do not replace them (test/AGENTS.md).
  // Values are derived from dist/chota.css and verified against Chromium:
  //   .button { padding: 0.625rem 1.5625rem; font-size: var(--font-size); line-height: 1;
  //            border: 1px solid transparent; border-radius: 4px }
  //   Consumer root is 16px (no 62.5% override after #137): 1rem = 16px,
  //   --font-size: 1rem = 16px
  //   height = padding-top(10) + padding-bottom(10) + line-height(16) + border(2) = 38px
  test('desktop: .button height in #forms__action is 38px', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'index.html');

    const height = await page
      .locator('#forms__action .button')
      .first()
      .evaluate((el) => window.getComputedStyle(el).height);
    expect(height).toBe('38px');

    await context.close();
  });
});
