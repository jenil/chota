const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3700);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('Grouped Controls Validation (#114)', () => {
  test('CSS analysis: .grouped has no responsive behavior', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await loadFixture(page, server, 'grouped-controls.html');

    // Check the .grouped CSS rule
    const css = fs.readFileSync(path.resolve(__dirname, '../../../dist/chota.css'), 'utf-8');
    const groupedMatch = css.match(/\.grouped\s*\{([^}]+)\}/);
    expect(groupedMatch).not.toBeNull();
    const groupedRule = groupedMatch[1];
    console.log('.grouped rule:', groupedRule);

    // Check for responsive media queries for .grouped
    const hasResponsiveGrouped = /@media.*\.grouped/.test(css);
    console.log('Has responsive .grouped:', hasResponsiveGrouped);

    // Verify .grouped is just flexbox with no responsive behavior
    expect(groupedRule).toContain('display: flex');
    expect(hasResponsiveGrouped).toBe(false);

    // Check if .grouped has any width constraints
    const hasWidthConstraint = /width|max-width/.test(groupedRule);
    console.log('Has width constraint:', hasWidthConstraint);
    expect(hasWidthConstraint).toBe(false);

    await context.close();
  });
});
