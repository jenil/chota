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
  server = await startFixtureServer(3200);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

test.describe('Components page (components.html)', () => {
  test('desktop viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('components-desktop.png');

    await context.close();
  });

  test('mobile viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('components-mobile.png');

    await context.close();
  });

  // #180 — Full-page captures supplement the first-fold baselines above.
  test('desktop full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page.screenshot({ fullPage: true });
    await expect(screenshot).toMatchSnapshot('components-fullpage-desktop.png');

    await context.close();
  });

  test('mobile full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page.screenshot({ fullPage: true });
    await expect(screenshot).toMatchSnapshot('components-fullpage-mobile.png');

    await context.close();
  });

  // #180 — Per-section element screenshots (desktop only). components.html
  // sections are targeted via `data-test-id` attributes added to each
  // <section> opening tag (additive, no visible/behavior change).
  test('desktop: grid section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page
      .locator('[data-test-id="section-grid"]')
      .screenshot();
    await expect(screenshot).toMatchSnapshot('components-section-grid.png');

    await context.close();
  });

  test('desktop: card section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page
      .locator('[data-test-id="section-card"]')
      .screenshot();
    await expect(screenshot).toMatchSnapshot('components-section-card.png');

    await context.close();
  });

  test('desktop: tag section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page
      .locator('[data-test-id="section-tag"]')
      .screenshot();
    await expect(screenshot).toMatchSnapshot('components-section-tag.png');

    await context.close();
  });

  test('desktop: tabs section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page
      .locator('[data-test-id="section-tabs"]')
      .screenshot();
    await expect(screenshot).toMatchSnapshot('components-section-tabs.png');

    await context.close();
  });

  test('desktop: helpers section screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const screenshot = await page
      .locator('[data-test-id="section-helpers"]')
      .screenshot();
    await expect(screenshot).toMatchSnapshot('components-section-helpers.png');

    await context.close();
  });

  // #180 — Focused computed-style assertions on rem-derived properties.
  // Screenshots supplement these; they do not replace them (test/AGENTS.md).
  // Values are derived from dist/chota.css and verified against Chromium:
  //   .card { padding: 1rem 2rem; border-radius: 4px } → 10px 20px, 4px
  //   .tag  { padding: 0.5rem; font-size: <inherited --font-size> } → 5px, 16px
  //   .col-6 { flex: 0 0 calc(50% - var(--grid-gutter)); max-width: same }
  //     --grid-gutter: 2rem = 20px; container content-box = 1180px at 1280px
  //     viewport (max-width 120rem caps .container; row bleeds ±10px each
  //     side → row content 1200px); .col-6 width = 50% of 1200 − 20 = 580px
  test('desktop: .card padding and border-radius in Card section', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const card = await page
      .locator('[data-test-id="section-card"] .card')
      .first();
    const styles = await card.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { padding: cs.padding, borderRadius: cs.borderRadius };
    });
    expect(styles.padding).toBe('10px 20px');
    expect(styles.borderRadius).toBe('4px');

    await context.close();
  });

  test('desktop: .tag font-size and padding in Tag section', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const tag = await page
      .locator('[data-test-id="section-tag"] .tag')
      .first();
    const styles = await tag.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { fontSize: cs.fontSize, padding: cs.padding };
    });
    expect(styles.fontSize).toBe('16px');
    expect(styles.padding).toBe('5px');

    await context.close();
  });

  test('desktop: .col-6 rendered width in Grid section is 580px', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'components.html');

    const width = await page
      .locator('[data-test-id="section-grid"] .col-6')
      .first()
      .evaluate((el) => window.getComputedStyle(el).width);
    expect(width).toBe('580px');

    await context.close();
  });
});
