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

  test('index.html navigates to OK and renders fixture-specific content (desktop)', async ({ page }) => {
    const response = await page.goto(`http://localhost:${PORT}/index.html`);
    expect(response.status()).toBe(200);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('components.html navigates to OK and renders fixture-specific content (desktop)', async ({ page }) => {
    const response = await page.goto(`http://localhost:${PORT}/components.html`);
    expect(response.status()).toBe(200);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.tag')).toBeVisible();
  });

  test('index.html mobile viewport renders', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    const response = await page.goto(`http://localhost:${PORT}/index.html`);
    expect(response.status()).toBe(200);
    await expect(page.locator('.container')).toBeVisible();
  });

  test('components.html mobile viewport renders', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    const response = await page.goto(`http://localhost:${PORT}/components.html`);
    expect(response.status()).toBe(200);
    await expect(page.locator('.container')).toBeVisible();
  });
});
