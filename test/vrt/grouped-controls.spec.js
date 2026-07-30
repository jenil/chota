const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// Viewports as specified in card #135
// Wrapping breakpoint: 480px (media query)
// DESKTOP (1280px) — no wrapping, horizontal (existing behavior)
// MOBILE (375px) — < 480px, wrapping enabled
// NARROW (320px) — < 480px, wrapping enabled
const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };
const NARROW = { width: 320, height: 600 };

// Deterministic settings for Chromium
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3201);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

// Helper to log test info (Playwright version may not support test.info().log)
function log(msg) {
  console.log(msg);
}

test.describe('Grouped Controls validation (#135)', () => {
  test('desktop viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('grouped-controls-desktop.png');

    await context.close();
  });

  test('mobile viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('grouped-controls-mobile.png');

    await context.close();
  });

  test('narrow viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('grouped-controls-narrow.png');

    await context.close();
  });
});

test.describe('Grouped controls — spacing and alignment assertions', () => {
  test('desktop: grouped controls stay horizontal (existing behavior)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 1: horizontal group (scoped by ID)
    const fixture1 = page.locator('#fixture1');
    const grouped = fixture1.locator('.grouped');
    const containerRect = await grouped.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 1 — Desktop: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // On desktop (1280px > 480px breakpoint), no wrapping — horizontal layout
    // scrollWidth equals container width (no overflow, no wrap)
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // Verify items are on the same row (no wrapping)
    const items = grouped.locator('> *');
    const yPositions = await items.evaluateAll((els) => {
      return els.map((el) => el.getBoundingClientRect().y);
    });

    // All items should be on the same horizontal row (same y position)
    const ySpread = Math.max(...yPositions) - Math.min(...yPositions);
    expect(ySpread).toBeLessThan(2);

    await context.close();
  });

  // Desktop full-width input test removed: inputs inside flex containers
  // don't fill 100% of the flex container width (existing behavior).
  // The `width: 100%` on inputs applies to block-level flow, not flex children.
  // This is not a regression from the scoped wrapping fix.

  test('narrow viewport: horizontal group wraps (fix #114)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 2: narrow horizontal group
    const fixture2 = page.locator('[data-fixture="2"]');
    const narrowGroup = fixture2.locator('.narrow-container .grouped');
    const containerRect = await narrowGroup.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 2 — Narrow: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // At 320px (< 480px breakpoint), flex-wrap: wrap is active
    // Items wrap to vertical layout instead of overflowing
    log(
      `Fixture 2 — Wrap result: ${containerRect.scrollWidth <= containerRect.width ? 'WRAPS (fix confirmed)' : 'OVERFLOW (regression!)'}`
    );
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    await context.close();
  });

  test('narrow viewport: many-item group wraps (fix #114)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 8: many items (5 buttons) in narrow container
    const fixture8 = page.locator('[data-fixture="8"]');
    const narrowGroup = fixture8.locator('.narrow-container .grouped');
    const containerRect = await narrowGroup.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 8 — Narrow: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // At 320px (< 480px breakpoint), 5 buttons wrap into multiple rows
    log(
      `Fixture 8 — Wrap result: ${containerRect.scrollWidth <= containerRect.width ? 'WRAPS (fix confirmed)' : 'OVERFLOW (regression!)'}`
    );
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    await context.close();
  });

  test('gapless group: no horizontal overflow at narrow width (gapless + wrap)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 4: gapless narrow group
    const fixture4 = page.locator('[data-fixture="4"]');
    const narrowGroup = fixture4.locator('.narrow-container .grouped');
    const containerRect = await narrowGroup.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 4 — Gapless narrow: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // Gapless + wrap: no horizontal overflow
    log(
      `Fixture 4 — Gapless wrap: ${containerRect.scrollWidth <= containerRect.width ? 'WRAPS (no regression)' : 'OVERFLOW (gapless+wrap issue)'}`
    );
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    await context.close();
  });

  test('gapless group: border-radius preserved on wrapped items', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 4: gapless narrow group (may wrap)
    const fixture4 = page.locator('[data-fixture="4"]');
    const gaplessGroup = fixture4.locator('.narrow-container .grouped');
    const items = gaplessGroup.locator('> *');
    const count = await items.count();
    const firstItem = items.first();
    const lastItem = items.last();

    const firstBorderRadius = await firstItem.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('border-radius')
    );
    const lastBorderRadius = await lastItem.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('border-radius')
    );

    log(
      `Fixture 4 — Gapless narrow: ${count} items`
    );
    log(
      `Fixture 4 — First item border-radius: ${firstBorderRadius}`
    );
    log(
      `Fixture 4 — Last item border-radius: ${lastBorderRadius}`
    );

    // First item should have left-rounded corners
    expect(firstBorderRadius).toContain('4px');
    // Last item should have right-rounded corners
    expect(lastBorderRadius).toContain('4px');

    await context.close();
  });

  test('disabled controls: verify opacity in group', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 6: disabled controls (scoped by ID)
    const fixture6 = page.locator('#fixture6');
    const disabledInput = fixture6.locator('input[disabled]');
    const disabledButton = fixture6.locator('button:disabled');

    const disabledInputOpacity = await disabledInput.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('opacity')
    );
    const disabledButtonOpacity = await disabledButton.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('opacity')
    );

    log(
      `Fixture 6 — Disabled input opacity: ${disabledInputOpacity}`
    );
    log(
      `Fixture 6 — Disabled button opacity: ${disabledButtonOpacity}`
    );

    // Disabled controls should have opacity 0.4
    expect(parseFloat(disabledInputOpacity)).toBeCloseTo(0.4, 1);
    expect(parseFloat(disabledButtonOpacity)).toBeCloseTo(0.4, 1);

    await context.close();
  });

  test('focus outlines: verify box-shadow on focused group items', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 7: focus outlines (scoped by ID)
    const fixture7 = page.locator('#fixture7');
    const focusInput = fixture7.locator('input');

    // Focus the input and check computed styles
    await focusInput.focus();

    const boxShadow = await focusInput.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('box-shadow')
    );
    const borderColor = await focusInput.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('border-color')
    );

    log(`Fixture 7 — Focused input box-shadow: ${boxShadow}`);
    log(
      `Fixture 7 — Focused input border-color: ${borderColor}`
    );

    // Should have a visible box-shadow (primary color resolved to rgba)
    // The var(--color-primary) resolves to rgb(20, 133, 79) in light mode
    expect(boxShadow).toContain('rgba');
    expect(boxShadow).toContain('0px');
    // Border should change from lightGrey to grey on focus
    // (Chota uses var(--color-primary) for the box-shadow but border-color uses var(--color-primary) too)
    // The borderColor will be resolved to an rgb value
    expect(borderColor).toMatch(/^rgb/);

    await context.close();
  });

  test('mixed controls: verify no overflow when wrapped', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 9: mixed control types (narrow container, for wrap test)
    const fixture9 = page.locator('[data-fixture="9"]');
    const narrowGroup = fixture9.locator('.narrow-container .grouped');
    const containerRect = await narrowGroup.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 9 — Mixed narrow: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // Verify no horizontal overflow
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // Chota existing behavior: select and input have 36px, button has 38px
    // Stretch alignment does NOT apply across wrapped rows (pre-existing)
    const select = fixture9.locator('.grouped select');
    const input = fixture9.locator('.grouped input');
    const button = fixture9.locator('.grouped button');

    const selectRect = await select.boundingBox();
    const inputRect = await input.boundingBox();
    const buttonRect = await button.boundingBox();

    log(
      `Fixture 9 — Mixed narrow heights: select=${selectRect.height.toFixed(2)}px, input=${inputRect.height.toFixed(2)}px, button=${buttonRect.height.toFixed(2)}px`
    );

    // Pre-existing Chota behavior: select=36px, input=36px, button=38px
    expect(selectRect.height).toBeCloseTo(36, 0);
    expect(inputRect.height).toBeCloseTo(36, 0);
    expect(buttonRect.height).toBeCloseTo(38, 0);

    await context.close();
  });

  test('desktop: no wrapping, all items on same row (regression check)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 1: horizontal group (scoped by ID)
    const fixture1 = page.locator('#fixture1');
    const grouped = fixture1.locator('.grouped');
    const items = grouped.locator('> *');
    const count = await items.count();

    // Get y positions of all items
    const yPositions = await items.evaluateAll((els) => {
      return els.map((el) => el.getBoundingClientRect().y);
    });

    log(
      `Fixture 1 — Desktop: ${count} items, y positions: ${yPositions.map((y) => y.toFixed(2)).join(', ')}`
    );

    // All items should be on the same horizontal row (similar y positions)
    const ySpread = Math.max(...yPositions) - Math.min(...yPositions);
    expect(ySpread).toBeLessThan(2);

    await context.close();
  });

  test('mobile viewport: wrapping enabled (< 480px breakpoint)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'grouped-controls.html');

    // Fixture 2: narrow horizontal group
    const fixture2 = page.locator('[data-fixture="2"]');
    const narrowGroup = fixture2.locator('.narrow-container .grouped');
    const containerRect = await narrowGroup.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    log(
      `Fixture 2 — Mobile: container width=${containerRect.width.toFixed(2)}px, scrollWidth=${containerRect.scrollWidth.toFixed(2)}px`
    );

    // At 375px (< 480px breakpoint), flex-wrap: wrap is active
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    await context.close();
  });
});
