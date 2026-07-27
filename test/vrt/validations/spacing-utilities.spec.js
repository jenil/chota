const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3800);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('Spacing Utilities Validation (#61)', () => {
  test('CSS analysis: no margin/padding utility classes exist', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await loadFixture(page, server, 'spacing-utilities.html');

    // Read the full CSS
    const css = fs.readFileSync(path.resolve(__dirname, '../../../dist/chota.css'), 'utf-8');

    // Check for spacing utility classes: .mt-1, .mb-2, .pt-3, .p-4, .m-5, etc.
    // Use word boundary to avoid matching partial class names like .pull-right
    const hasSpacingClasses = /(?:^|\s|,)\.(mt|mb|ml|mr|pt|pb|pl|pr|p-|m-)[\d.]+/.test(css);
    console.log('Has spacing utility classes:', hasSpacingClasses);

    // Also check for responsive spacing utilities
    const hasResponsiveSpacing = /@media.*\.(mt|mb|ml|mr|pt|pb|pl|pr|m-|p-)[\d.]+/.test(css);
    console.log('Has responsive spacing utilities:', hasResponsiveSpacing);

    expect(hasSpacingClasses).toBe(false);
    expect(hasResponsiveSpacing).toBe(false);

    // Verify no margin or padding shorthand classes exist
    const shorthandClasses = /(?:^|\s)\.(m|p)[\d.]+/.test(css);
    console.log('Has margin/padding shorthand classes:', shorthandClasses);
    expect(shorthandClasses).toBe(false);

    await context.close();
  });
});
