/**
 * Issue #136 — Spacing Utilities Regression (Candidate: Issue #61)
 *
 * Validates that .is-marginless and .is-paddingless properly override
 * baked-in spacing on .container, .row, and .col variants.
 *
 * Base SHA: 32e0c7ef4c4f2a2d72feb43cebdb37dd9591bc02
 * Built from: npm run build (from base SHA)
 */
const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

const HALF_GUTTER = '10px'; // --grid-gutter / 2 = 1rem
const NEG_HALF_GUTTER = '-10px'; // --grid-gutter / -2 = -1rem

async function getComputedSpacing(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      marginLeft: cs.marginLeft,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
    };
  }, selector);
}

test.describe('Spacing Utilities — Issue #61 Regression', () => {
  let server;
  let PORT;

  test.beforeAll(async () => {
    server = await startFixtureServer(3700);
    PORT = server.port;
  });

  test.afterAll(async () => {
    if (server) await server.stop();
  });

  test.beforeEach(async ({ page }) => {
    await loadFixture(page, server, 'spacing-utilities.html');
  });

  // ─── .container ───────────────────────────────────────────────────

  test('baseline .container has 10px horizontal padding', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="container-baseline"]');
    expect(spacing).not.toBeNull();
    expect(spacing.paddingTop).toBe('0px');
    expect(spacing.paddingRight).toBe(HALF_GUTTER);
    expect(spacing.paddingBottom).toBe('0px');
    expect(spacing.paddingLeft).toBe(HALF_GUTTER);
  });

  test('.container.is-marginless has all margins 0px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="container-marginless"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginTop).toBe('0px');
    expect(spacing.marginRight).toBe('0px');
    expect(spacing.marginBottom).toBe('0px');
    expect(spacing.marginLeft).toBe('0px');
  });

  test('.container.is-paddingless has all padding 0px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="container-paddingless"]');
    expect(spacing).not.toBeNull();
    expect(spacing.paddingTop).toBe('0px');
    expect(spacing.paddingRight).toBe('0px');
    expect(spacing.paddingBottom).toBe('0px');
    expect(spacing.paddingLeft).toBe('0px');
  });

  // ─── .row ─────────────────────────────────────────────────────────

  test('baseline .row has horizontal margins -10px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="row-baseline"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginLeft).toBe(NEG_HALF_GUTTER);
    expect(spacing.marginRight).toBe(NEG_HALF_GUTTER);
  });

  test('.row.is-marginless has horizontal margins 0px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="row-marginless"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginLeft).toBe('0px');
    expect(spacing.marginRight).toBe('0px');
  });

  // ─── .col ─────────────────────────────────────────────────────────

  test('baseline .col has side and bottom margins 10px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="col-baseline"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginTop).toBe('0px');
    expect(spacing.marginRight).toBe(HALF_GUTTER);
    expect(spacing.marginBottom).toBe(HALF_GUTTER);
    expect(spacing.marginLeft).toBe(HALF_GUTTER);
  });

  test('.col.is-marginless has all margins 0px', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="col-marginless"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginTop).toBe('0px');
    expect(spacing.marginRight).toBe('0px');
    expect(spacing.marginBottom).toBe('0px');
    expect(spacing.marginLeft).toBe('0px');
  });

  // ─── Numbered column utility override ──────────────────────────────

  test('.col-6.is-marginless receives utility override', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="col6-marginless"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginRight).toBe('0px');
    expect(spacing.marginLeft).toBe('0px');
  });

  // ─── Full nesting ─────────────────────────────────────────────────

  test('nested .container > .row > .col remains correct', async ({ page }) => {
    const spacing = await getComputedSpacing(page, '[data-test-id="nested-col"]');
    expect(spacing).not.toBeNull();
    expect(spacing.marginRight).toBe(HALF_GUTTER);
    expect(spacing.marginLeft).toBe(HALF_GUTTER);
  });
});
