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
    const ySpread = await grouped.locator('> *').evaluateAll((els) => {
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

    await context.close();
  });

  // ── Fixture 2: Wrapping grouped controls on narrow screens ─────────
  // Proves: wraps without horizontal overflow, 16px gap between rows

  test('narrow: wraps, no overflow, 16px gap between rows', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: { width: 320, height: 400 },
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
      const items = [...el.children].sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
      // Find first pair on different rows (y differs by > 2px)
      for (let i = 0; i < items.length - 1; i++) {
        const r1 = items[i].getBoundingClientRect();
        const r2 = items[i + 1].getBoundingClientRect();
        if (Math.abs(r2.y - r1.y) > 2) {
          return r2.y - (r1.y + r1.height);
        }
      }
      return null;
    });
    expect(rowGap).toBeGreaterThan(14);
    expect(rowGap).toBeLessThan(18);

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

    await context.close();
  });

  // ── Fixture 4: Mixed input/select/button controls ─────────────────
  // Proves: no horizontal overflow when mixing native form controls.
  // Chota does not define exact heights for native <select>/<input>/<button>;
  // the contract is overflow/wrapping/spacing/borders/radii, not pixel heights.

  test('mixed controls: no horizontal overflow', async ({ browser }) => {
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

    await context.close();
  });

  // ── 480px boundary: .grouped flex-wrap toggles at max-width: 480px ───
  // Proves the @media (max-width: 480px) { .grouped { flex-wrap: wrap } } rule
  // (src/_form.css) actually changes behavior at the 480/481 boundary.
  // At 480px: wrap is on (items span multiple rows inside the 400px container).
  // At 481px: wrap is off (default nowrap; items stay on one row and may overflow).

  test('480px boundary: .grouped flex-wrap toggles at 480/481', async ({ browser }) => {
    // At 480px: media query applies — flex-wrap: wrap, items span multiple rows
    {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: 480, height: 600 },
      });
      const page = await context.newPage();
      await loadFixture(page, server, 'grouped-controls.html');

      const grouped = page.locator('#fixture2');
      const flexWrap = await grouped.evaluate((el) =>
        window.getComputedStyle(el).flexWrap
      );
      expect(flexWrap).toBe('wrap');

      // Items span multiple rows (y positions differ by > 2px)
      const yPositions = await grouped.locator('> *').evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().y)
      );
      expect(Math.max(...yPositions) - Math.min(...yPositions)).toBeGreaterThan(2);

      await context.close();
    }

    // At 481px: media query no longer applies — flex-wrap: nowrap (default)
    {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: 481, height: 600 },
      });
      const page = await context.newPage();
      await loadFixture(page, server, 'grouped-controls.html');

      const grouped = page.locator('#fixture2');
      const flexWrap = await grouped.evaluate((el) =>
        window.getComputedStyle(el).flexWrap
      );
      expect(flexWrap).toBe('nowrap');

      // All items on the same row (y positions match within 2px)
      const yPositions = await grouped.locator('> *').evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().y)
      );
      expect(Math.max(...yPositions) - Math.min(...yPositions)).toBeLessThan(2);

      await context.close();
    }
  });
});
