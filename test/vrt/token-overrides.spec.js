const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

const DESKTOP = { width: 1280, height: 720 };

let server;
let PORT;

test.beforeAll(async () => {
  // Use port 3601 to avoid conflicts with other VRT tests.
  // (breakpoints.spec.js already uses 3600; 3100/3200/3201/3301/3400/3500/3700/3800 also taken.)
  server = await startFixtureServer(3601);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

/**
 * Computed-style spec for the three design tokens added in card #138
 * (--color-placeholder, --border-radius, --transition-duration).
 *
 * The fixture (test/token-overrides.html) overrides all three tokens on
 * :root; this spec proves the override propagates to every consumer:
 * .card, .button, inputs, ::placeholder, and .grouped.gapless outer corners.
 */
test.describe('Design token overrides (#138)', () => {
  test('token overrides propagate to all consumers', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'token-overrides.html');

    // 1. .card border-radius === 0px (--border-radius: 0px)
    const cardRadius = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="card"]');
      return window.getComputedStyle(el).borderRadius;
    });
    expect(cardRadius).toBe('0px');

    // 2. .button border-radius === 0px
    const buttonRadius = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="button"]');
      return window.getComputedStyle(el).borderRadius;
    });
    expect(buttonRadius).toBe('0px');

    // 3. .button transition-duration === 0.5s (--transition-duration: 0.5s)
    const buttonDuration = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="button"]');
      return window.getComputedStyle(el).transitionDuration;
    });
    expect(buttonDuration).toBe('0.5s');

    // 4. input ::placeholder color === rgb(255, 0, 0) (--color-placeholder: #ff0000)
    const placeholderColor = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="input"]');
      return window.getComputedStyle(el, '::placeholder').color;
    });
    expect(placeholderColor).toBe('rgb(255, 0, 0)');

    // 5. .grouped.gapless > *:first-child border-radius === 0px
    //    (all corners squared because --border-radius: 0px;
    //    Chromium serializes four equal longhands to a single value per CSSOM)
    const groupedFirstRadius = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="grouped-first"]');
      return window.getComputedStyle(el).borderRadius;
    });
    expect(groupedFirstRadius).toBe('0px');

    // 6. .grouped.gapless > *:last-child border-radius === 0px
    const groupedLastRadius = await page.evaluate(() => {
      const el = document.querySelector('[data-test-id="grouped-last"]');
      return window.getComputedStyle(el).borderRadius;
    });
    expect(groupedLastRadius).toBe('0px');
  });
});
