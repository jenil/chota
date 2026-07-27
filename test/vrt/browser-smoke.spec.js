const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };

test.describe('Browser smoke coverage (Firefox + WebKit)', () => {
  let server;
  let PORT;

  test.beforeAll(async () => {
    server = await startFixtureServer(3500);
    PORT = server.port;
  });

  test.afterAll(async () => {
    if (server) await server.stop();
  });

  test('index.html loads and renders (desktop)', async ({ page }) => {
    await loadFixture(page, server, 'index.html');
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('body')).toBeVisible();
  });

  test('components.html loads and renders (desktop)', async ({ page }) => {
    await loadFixture(page, server, 'components.html');
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('body')).toBeVisible();
  });

  test('index.html renders (mobile viewport)', async ({ page }) => {
    await loadFixture(page, server, 'index.html');
    await page.setViewportSize(MOBILE);
    await expect(page.locator('body')).toBeVisible();
  });

  test('components.html renders (mobile viewport)', async ({ page }) => {
    await loadFixture(page, server, 'components.html');
    await page.setViewportSize(MOBILE);
    await expect(page.locator('body')).toBeVisible();
  });
});
