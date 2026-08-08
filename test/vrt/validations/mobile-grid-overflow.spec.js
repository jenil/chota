const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

// Card #177 — Mobile-grid overflow behavioral assertions.
// Computed-style overflow checks only; no screenshot assertions.

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };
const NARROW_414 = { width: 414, height: 896 };
const NARROW_320 = { width: 320, height: 568 };

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3800);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('Mobile Grid Overflow Validation (#102)', () => {
  test('desktop viewport — no overflow', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'mobile-grid-overflow.html');
    await page.waitForLoadState('networkidle');

    // Prove /dist/chota.css loaded successfully (200), not a 404.
    const cssStatus = await page.evaluate(async () => {
      const r = await fetch('/dist/chota.css');
      return r.status;
    });
    expect(cssStatus).toBe(200);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => window.innerWidth);
    const overflow = scrollWidth - clientWidth;

    console.log(`Desktop: viewport=${clientWidth}px, scrollWidth=${scrollWidth}px, overflow=${overflow}px`);

    expect(overflow).toBe(0);
    await context.close();
  });

  test('mobile viewport 375px — no overflow', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(MOBILE);

    await loadFixture(page, server, 'mobile-grid-overflow.html');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => window.innerWidth);
    const overflow = scrollWidth - clientWidth;

    console.log(`Mobile 375px: viewport=${clientWidth}px, scrollWidth=${scrollWidth}px, overflow=${overflow}px`);

    expect(overflow).toBe(0);
    await context.close();
  });

  test('narrow viewport 414px — no overflow', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(NARROW_414);

    await loadFixture(page, server, 'mobile-grid-overflow.html');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => window.innerWidth);
    const overflow = scrollWidth - clientWidth;

    console.log(`Narrow 414px: viewport=${clientWidth}px, scrollWidth=${scrollWidth}px, overflow=${overflow}px`);

    expect(overflow).toBe(0);
    await context.close();
  });

  test('narrowest viewport 320px — no overflow', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(NARROW_320);

    await loadFixture(page, server, 'mobile-grid-overflow.html');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => window.innerWidth);
    const overflow = scrollWidth - clientWidth;

    console.log(`Narrowest 320px: viewport=${clientWidth}px, scrollWidth=${scrollWidth}px, overflow=${overflow}px`);

    expect(overflow).toBe(0);
    await context.close();
  });
});
