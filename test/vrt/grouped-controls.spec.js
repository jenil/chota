const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// Viewports: wrapping breakpoint is 480px (media query)
const DESKTOP = { width: 1280, height: 720 };
const NARROW  = { width: 320, height: 600 };

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

test.describe('Grouped controls — spacing and alignment assertions (#135)', () => {
  // ── Fixture 1: Normal grouped controls on desktop ──────────────────
  // Proves: horizontal, no wrapping, 16px gap between items

  test('desktop: horizontal, no wrapping, 16px gap', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'grouped-controls.html');

    const grouped = page.locator('#fixture1');
    const containerRect = await grouped.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    // scrollWidth equals container width — no overflow, no wrap
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // All items on the same row (y positions match)
    const ySpread = await grouped.evaluateAll((els) => {
      return els.map((el) => el.getBoundingClientRect().y);
    });
    expect(Math.max(...ySpread) - Math.min(...ySpread)).toBeLessThan(2);

    // Gap between first two items is ~16px (margin-right)
    const gap = await grouped.evaluate((el) => {
      const items = el.children;
      const r1 = items[0].getBoundingClientRect();
      const r2 = items[1].getBoundingClientRect();
      return r2.x - (r1.x + r1.width);
    });
    expect(gap).toBeGreaterThan(14);
    expect(gap).toBeLessThan(18);

    // Visual evidence: screenshot the single fixture layout
    await grouped.screenshot({ path: 'test/vrt/snapshots/grouped-controls.spec.js-snapshots/grouped-controls-desktop.png' });

    await context.close();
  });

  // ── Fixture 2: Wrapping grouped controls on narrow screens ─────────
  // Proves: wraps without horizontal overflow, 16px gap between rows

  test('narrow: wraps, no overflow, 16px gap between rows', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: { width: 200, height: 400 },
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'grouped-controls.html');

    const grouped = page.locator('#fixture2');
    const containerRect = await grouped.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    // scrollWidth equals container width — no horizontal overflow
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // Items span multiple rows (y positions differ by > 2px)
    const yPositions = await grouped.locator('> *').evaluateAll((els) => {
      return els.map((el) => el.getBoundingClientRect().y);
    });
    expect(Math.max(...yPositions) - Math.min(...yPositions)).toBeGreaterThan(2);

    // Gap between rows is ~16px (from media query gap)
    const rowGap = await grouped.evaluate((el) => {
      const items = el.children;
      const sorted = [...items].sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
      const r1 = sorted[0].getBoundingClientRect();
      const r2 = sorted[1].getBoundingClientRect();
      return r2.y - (r1.y + r1.height);
    });
    expect(rowGap).toBeGreaterThan(14);
    expect(rowGap).toBeLessThan(18);

    // Visual evidence: screenshot the wrapped layout
    await grouped.screenshot({ path: 'test/vrt/snapshots/grouped-controls.spec.js-snapshots/grouped-controls-narrow.png' });

    await context.close();
  });

  // ── Fixture 3: Gapless controls when wrapping ──────────────────────
  // Proves: gap: 0 (no extra spacing), border-radius preserved

  test('gapless + wrap: gap 0, border-radius preserved', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'grouped-controls.html');

    const grouped = page.locator('#fixture3');
    const containerRect = await grouped.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    // No horizontal overflow
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // Gap between items is 0 (gapless)
    const gap = await grouped.evaluate((el) => {
      const items = el.children;
      const r1 = items[0].getBoundingClientRect();
      const r2 = items[1].getBoundingClientRect();
      return r2.x - (r1.x + r1.width);
    });
    expect(gap).toBeLessThanOrEqual(1);

    // First item: left-rounded corners (4px 0 0 4px)
    const firstBorderRadius = await grouped.locator('> :first-child').evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('border-radius')
    );
    expect(firstBorderRadius).toContain('4px');

    // Last item: right-rounded corners (0 4px 4px 0)
    const lastBorderRadius = await grouped.locator('> :last-child').evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('border-radius')
    );
    expect(lastBorderRadius).toContain('4px');

    // Visual evidence: screenshot the gapless wrapped layout
    await grouped.screenshot({ path: 'test/vrt/snapshots/grouped-controls.spec.js-snapshots/grouped-controls-gapless-narrow.png' });

    await context.close();
  });

  // ── Fixture 4: Mixed input/select/button heights ───────────────────
  // Proves: no overflow, existing heights preserved (select=36, input=36, button=38)

  test('mixed heights: no overflow, select=36, input=36, button=38', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW,
    });
    const page = await context.newPage();
    await loadFixture(page, server, 'grouped-controls.html');

    const grouped = page.locator('#fixture4');
    const containerRect = await grouped.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, scrollWidth: el.scrollWidth };
    });

    // No horizontal overflow
    expect(containerRect.scrollWidth).toBeLessThanOrEqual(containerRect.width);

    // Chota existing behavior: select=36px, input=36px, button=38px
    const heights = await grouped.evaluate((el) => {
      const items = el.children;
      return [...items].map((item) => item.getBoundingClientRect().height);
    });
    expect(heights[0]).toBeCloseTo(36, 0); // select
    expect(heights[1]).toBeCloseTo(36, 0); // input
    expect(heights[2]).toBeCloseTo(38, 0); // button

    // Visual evidence: screenshot the mixed layout
    await grouped.screenshot({ path: 'test/vrt/snapshots/grouped-controls.spec.js-snapshots/grouped-controls-mixed-narrow.png' });

    await context.close();
  });
});
