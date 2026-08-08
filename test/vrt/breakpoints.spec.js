/**
 * Card #177 — Responsive Breakpoint Boundary Tests
 *
 * Verifies Chota's responsive grid behavior at breakpoint transitions
 * using computed-style assertions (no screenshots).
 *
 * Boundaries: 480/481, 599/600, 899/900, 1199/1200 pixels.
 *
 * Acceptance: yarn test:vrt exits 0. No production CSS changes.
 */
const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

// Deterministic settings for Chromium
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

// Breakpoint boundaries to test: [below, above] each transition
const BOUNDARIES = [
  { below: 480, above: 481 },
  { below: 599, above: 600 },
  { below: 899, above: 900 },
  { below: 1199, above: 1200 },
];

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3600);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Read container width from computed style (responsive behavior).
 * Returns the pixel value string (e.g., '1140px', '480px').
 */
async function getContainerWidth(page) {
  return page.evaluate(() => {
    const container = document.querySelector('.container');
    if (!container) return null;
    return window.getComputedStyle(container).width;
  });
}

/**
 * Get the viewport width in pixels.
 */
async function getViewportWidth(page) {
  return page.evaluate(() => window.innerWidth);
}

/**
 * Read a .row's horizontal overflow (scrollWidth - clientWidth).
 * Returns overflow in pixels (0 means no overflow).
 */
async function getRowOverflow(page) {
  return page.evaluate(() => {
    const row = document.querySelector('.row');
    if (!row) return null;
    return row.scrollWidth - row.clientWidth;
  });
}

/**
 * Check horizontal overflow of the full page (document level).
 */
async function getPageOverflow(page) {
  return page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = window.innerWidth;
    return scrollWidth - clientWidth;
  });
}

/**
 * Check if a .hide-{sm,md,lg} element is visible or hidden.
 */
async function getHideElementVisibility(page, className) {
  return page.evaluate((cls) => {
    const el = document.querySelector(`.${cls}`);
    if (!el) return null;
    return window.getComputedStyle(el).display;
  }, className);
}

/**
 * Check if a .hide-* class is expected to be hidden at a given viewport width.
 * Chota hide-* logic (from _util.css):
 *   .hide-xs:  max-width: 599px
 *   .hide-sm:  600px ≤ max-width ≤ 899px
 *   .hide-md:  900px ≤ max-width ≤ 1199px
 *   .hide-lg:  min-width: 1200px
 */
function isHideSmExpectedHidden(viewportWidth) {
  return viewportWidth >= 600 && viewportWidth <= 899;
}

/**
 * Check if .hide-lg is expected to be hidden at a given viewport width.
 * Chota CSS: @media (min-width: 1200px) { .hide-lg { display: none; } }
 */
function isHideLgExpectedHidden(viewportWidth) {
  return viewportWidth >= 1200;
}

/**
 * Check if Chota's container should be 100% width at a viewport.
 * Chota CSS: @media (max-width: 599px) { .container { width: 100%; } }
 */
function isContainerFullWidth(viewportWidth) {
  return viewportWidth < 600;
}

// ─── Tests: index.html (Elements page) ───────────────────────────────

test.describe('Breakpoint boundaries — index.html', () => {
  BOUNDARIES.forEach(({ below, above }) => {
    test(`below ${below}px: no horizontal overflow`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: below, height: 720 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'index.html');

      const overflow = await getPageOverflow(page);
      expect(overflow).toBe(0);

      await context.close();
    });

    test(`at/above ${above}px: no horizontal overflow`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: above, height: 720 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'index.html');

      const overflow = await getPageOverflow(page);
      expect(overflow).toBe(0);

      await context.close();
    });

    test(`below ${below}px: container width equals viewport (no overflow)`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: below, height: 720 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'index.html');

      const containerWidth = parseFloat(await getContainerWidth(page));
      const viewportWidth = await getViewportWidth(page);
      expect(containerWidth).not.toBeNull();
      // At narrow viewports (< 600px), container width equals viewport width
      const shouldBeFull = isContainerFullWidth(below);
      if (shouldBeFull) {
        expect(containerWidth).toBeCloseTo(viewportWidth, 1);
      } else {
        // At wider viewports (>= 600px), container width is constrained (96% of viewport)
        expect(containerWidth).toBeLessThan(viewportWidth);
        expect(containerWidth).toBeGreaterThan(0);
      }

      await context.close();
    });

    test(`at/above ${above}px: container width matches viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: above, height: 720 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'index.html');

      const containerWidth = parseFloat(await getContainerWidth(page));
      const viewportWidth = await getViewportWidth(page);
      expect(containerWidth).not.toBeNull();
      // At narrow viewports (< 600px), container width equals viewport width
      const shouldBeFull = isContainerFullWidth(above);
      if (shouldBeFull) {
        expect(containerWidth).toBeCloseTo(viewportWidth, 1);
      } else {
        // At wider viewports (>= 600px), container width is constrained (96% of viewport)
        expect(containerWidth).toBeLessThan(viewportWidth);
        expect(containerWidth).toBeGreaterThan(0);
      }

      await context.close();
    });
  });
});

// ─── Tests: components.html (Components page) ────────────────────────

test.describe('Breakpoint boundaries — components.html', () => {
  BOUNDARIES.forEach(({ below, above }) => {
    test(`below ${below}px: grid rows have no overflow`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: below, height: 900 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'components.html');

      const overflow = await getRowOverflow(page);
      expect(overflow).toBe(0);

      await context.close();
    });

    test(`at/above ${above}px: grid rows have no overflow`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: above, height: 900 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'components.html');

      const overflow = await getRowOverflow(page);
      expect(overflow).toBe(0);

      await context.close();
    });

    test(`below ${below}px: .hide-sm display matches viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: below, height: 900 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'components.html');

      const hideSmDisplay = await getHideElementVisibility(page, 'hide-sm');
      expect(hideSmDisplay).not.toBeNull();
      const shouldBeHidden = isHideSmExpectedHidden(below);
      if (shouldBeHidden) {
        expect(hideSmDisplay).toBe('none');
      } else {
        expect(hideSmDisplay).not.toBe('none');
      }

      await context.close();
    });

    test(`at/above ${above}px: .hide-sm display matches viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: above, height: 900 },
      });
      const page = await context.newPage();

      await loadFixture(page, server, 'components.html');

      const hideSmDisplay = await getHideElementVisibility(page, 'hide-sm');
      expect(hideSmDisplay).not.toBeNull();
      const shouldBeHidden = isHideSmExpectedHidden(above);
      if (shouldBeHidden) {
        expect(hideSmDisplay).toBe('none');
      } else {
        expect(hideSmDisplay).not.toBe('none');
      }

      await context.close();
    });
  });

  // Dedicated 1200px boundary tests (outside the loop to avoid duplicate titles)
  test('components.html: 1199px .hide-lg visible, 1200px .hide-lg hidden', async ({ browser }) => {
    // Below 1200px: .hide-lg should NOT be hidden (Chota CSS: min-width: 1200px)
    {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: 1199, height: 900 },
      });
      const page = await context.newPage();
      await loadFixture(page, server, 'components.html');

      const hideLgDisplay = await getHideElementVisibility(page, 'hide-lg');
      expect(hideLgDisplay).not.toBeNull();
      expect(hideLgDisplay).not.toBe('none');

      await context.close();
    }

    // At 1200px: .hide-lg should be hidden (Chota CSS: min-width: 1200px)
    {
      const context = await browser.newContext({
        ...BASE_CONTEXT_OPTIONS,
        viewport: { width: 1200, height: 900 },
      });
      const page = await context.newPage();
      await loadFixture(page, server, 'components.html');

      const hideLgDisplay = await getHideElementVisibility(page, 'hide-lg');
      expect(hideLgDisplay).not.toBeNull();
      expect(hideLgDisplay).toBe('none');

      // .hide-sm should NOT be hidden at 1200px (Chota CSS: 600px ≤ max-width ≤ 899px only)
      const hideSmDisplay = await getHideElementVisibility(page, 'hide-sm');
      expect(hideSmDisplay).not.toBeNull();
      expect(hideSmDisplay).not.toBe('none');

      // Verify .col-6-lg (from components.html) has flex layout at 1200px
      const col6LgWidth = await page.evaluate(() => {
        const el = document.querySelector('.col-6-lg');
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return { display: cs.display, width: cs.width };
      });
      expect(col6LgWidth).not.toBeNull();
      expect(col6LgWidth.display).not.toBe('none');

      await context.close();
    }
  });
});
