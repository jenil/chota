const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');

const DESKTOP = { width: 1280, height: 720 };

// Dark-mode custom property values (matching fixture inline styles)
const DARK_MODE = {
  '--bg-color': '#000',
  '--bg-secondary-color': '#131316',
  '--font-color': '#f5f5f5',
  '--color-grey': '#ccc',
  '--color-darkGrey': '#777',
};

let server;
let PORT;

test.beforeAll(async () => {
  // Use port 3500 to avoid conflicts with other VRT tests (ports 3100-3400)
  server = await startFixtureServer(3500);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

/**
 * Extract all dark-mode custom properties from the body element
 * using getComputedStyle.
 */
async function getDarkModeProperties(page) {
  return await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return {
      '--bg-color': cs.getPropertyValue('--bg-color').trim(),
      '--bg-secondary-color': cs.getPropertyValue('--bg-secondary-color').trim(),
      '--font-color': cs.getPropertyValue('--font-color').trim(),
      '--color-grey': cs.getPropertyValue('--color-grey').trim(),
      '--color-darkGrey': cs.getPropertyValue('--color-darkGrey').trim(),
    };
  });
}

test.describe('Dark-mode custom properties (#177)', () => {
  // Verify that dark-mode custom properties are NOT set before the class is added,
  // then verify they match the fixture's inline styles after body.classList.add('dark').
  test('index.html: body.dark custom properties applied correctly', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'index.html');

    // Before dark mode: custom properties should NOT be #000 (default light theme values)
    const beforeDark = await getDarkModeProperties(page);
    expect(beforeDark['--bg-color']).not.toBe('#000');
    expect(beforeDark['--font-color']).not.toBe('#f5f5f5');

    // Activate dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark');
    });

    // After dark mode: all custom properties should match expected values
    const afterDark = await getDarkModeProperties(page);

    for (const [prop, expected] of Object.entries(DARK_MODE)) {
      expect(afterDark[prop], `${prop} should match expected value`).toBe(expected);
    }
  });

  test('components.html: body.dark custom properties applied correctly', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'components.html');

    // Before dark mode: custom properties should NOT be #000 (default light theme values)
    const beforeDark = await getDarkModeProperties(page);
    expect(beforeDark['--bg-color']).not.toBe('#000');
    expect(beforeDark['--font-color']).not.toBe('#f5f5f5');

    // Activate dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark');
    });

    // After dark mode: all custom properties should match expected values
    const afterDark = await getDarkModeProperties(page);

    for (const [prop, expected] of Object.entries(DARK_MODE)) {
      expect(afterDark[prop], `${prop} should match expected value`).toBe(expected);
    }
  });
});
