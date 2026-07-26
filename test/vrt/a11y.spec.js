const { test, expect } = require('@playwright/test');
const { startFixtureServer } = require('./vrt-helpers');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

// Viewport matching VRT baseline
const DESKTOP = { width: 1280, height: 720 };

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3200);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

test.describe('Accessibility baseline (axe-core)', () => {
  test('Elements page (index.html) accessibility audit', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Inject axe-core into the page context
    await page.addScriptTag({ path: require.resolve('axe-core') });

    const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));

    // Write findings to results directory for documentation
    const findings = {
      page: 'index.html',
      viewport: 'desktop',
      timestamp: new Date().toISOString(),
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html?.substring(0, 200),
          any: n.any.map(a => ({ id: a.id, impact: a.impact })),
        })),
      })),
      incomplete: results.incomplete.map(i => ({
        id: i.id,
        impact: i.impact,
        description: i.description,
        help: i.help,
        nodes: i.nodes.map(n => ({ target: n.target, html: n.html?.substring(0, 200) })),
      })),
    };

    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    const fileName = `a11y-index.html-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(resultsDir, fileName),
      JSON.stringify(findings, null, 2)
    );

    // Document findings for handoff
    console.log(`index.html: ${results.violations.length} violations, ${results.incomplete.length} incomplete`);
    results.violations.forEach(v => {
      console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
    });

    // Fail if any violations found (baseline requires zero violations)
    expect(results.violations.length, `Found ${results.violations.length} violations`).toBe(0);
  });

  test('Components page (components.html) accessibility audit', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(getPageUrl('components.html'));
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Inject axe-core into the page context
    await page.addScriptTag({ path: require.resolve('axe-core') });

    const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));

    const findings = {
      page: 'components.html',
      viewport: 'desktop',
      timestamp: new Date().toISOString(),
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html?.substring(0, 200),
          any: n.any.map(a => ({ id: a.id, impact: a.impact })),
        })),
      })),
      incomplete: results.incomplete.map(i => ({
        id: i.id,
        impact: i.impact,
        description: i.description,
        help: i.help,
        nodes: i.nodes.map(n => ({ target: n.target, html: n.html?.substring(0, 200) })),
      })),
    };

    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    const fileName = `a11y-components.html-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(resultsDir, fileName),
      JSON.stringify(findings, null, 2)
    );

    console.log(`components.html: ${results.violations.length} violations, ${results.incomplete.length} incomplete`);
    results.violations.forEach(v => {
      console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
    });

    expect(results.violations.length, `Found ${results.violations.length} violations`).toBe(0);
  });
});
