const { test, expect } = require('@playwright/test');
const { startFixtureServer } = require('./vrt-helpers');

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
  server = await startFixtureServer(3100);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

test.describe('Elements page (index.html)', () => {
  test('desktop viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();
    
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('index-desktop.png');
    
    await context.close();
  });

  test('mobile viewport screenshot', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();
    
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('index-mobile.png');
    
    await context.close();
  });
});
