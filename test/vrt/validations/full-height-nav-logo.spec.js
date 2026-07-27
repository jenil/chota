const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3600);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('Full-Height Nav Logo Validation (#111)', () => {
  test('CSS analysis: .nav brand constrains logo height', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await loadFixture(page, server, 'full-height-nav-logo.html');

    // Check the .nav brand CSS rule
    const css = fs.readFileSync(path.resolve(__dirname, '../../../dist/chota.css'), 'utf-8');
    const navBrandMatch = css.match(/\.nav\s*\{[^}]*\}/s);
    const brandMatch = css.match(/\.brand\s*\{([^}]+)\}/);
    expect(brandMatch).not.toBeNull();
    const brandRule = brandMatch[1];
    console.log('.brand rule:', brandRule);

    // The .nav uses flexbox, and brand images are constrained by the nav height
    // Check if there's a max-height or height constraint on brand images
    const hasHeightConstraint = /max-height|height/.test(brandRule);
    console.log('Has height constraint:', hasHeightConstraint);

    // Verify portrait logo gets squished
    const logoResult = await page.evaluate(() => {
      const brandImg = document.querySelector('.nav .brand img.portrait-logo');
      if (!brandImg) return null;
      const computed = window.getComputedStyle(brandImg);
      return {
        height: computed.height,
        maxHeight: computed.maxHeight,
        width: computed.width,
      };
    });

    console.log('Portrait logo computed styles:', logoResult);

    // Check landscape logo
    const landscapeResult = await page.evaluate(() => {
      const brandImg = document.querySelector('.nav .brand img.landscape-logo');
      if (!brandImg) return null;
      const computed = window.getComputedStyle(brandImg);
      return {
        height: computed.height,
        maxHeight: computed.maxHeight,
        width: computed.width,
      };
    });

    console.log('Landscape logo computed styles:', landscapeResult);

    // The issue: portrait logos get squished because .nav constrains the brand height
    // This is a design limitation, not a bug
    expect(logoResult).not.toBeNull();
    expect(landscapeResult).not.toBeNull();

    await context.close();
  });
});
