const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

// Viewport matching VRT baseline
const DESKTOP = { width: 1280, height: 720 };

let server;
let PORT;

test.beforeAll(async () => {
  // Use port 3400 to avoid conflicts with VRT tests (ports 3100/3200)
  server = await startFixtureServer(3400);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

/**
 * Run axe-core audit on the given page and write structured findings to results.
 * This is a baseline audit — known violations are documented in a11y-findings.md
 * and will be addressed by implementation cards (e.g., #139 for keyboard focus).
 */
async function runAxeAudit(page, pageName) {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));

  const findings = {
    page: pageName,
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
  const fileName = `a11y-${pageName}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(resultsDir, fileName),
    JSON.stringify(findings, null, 2)
  );

  console.log(`${pageName}: ${results.violations.length} violations, ${results.incomplete.length} incomplete`);
  results.violations.forEach(v => {
    console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
  });
}

test.describe('Accessibility baseline (axe-core)', () => {
  test('Deliberate failure demonstration: axe catches missing button label', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'index.html');
    await page.addScriptTag({ path: require.resolve('axe-core') });

    // Introduce a deliberate violation: remove aria-label from a button with an icon
    await page.evaluate(() => {
      const iconButtons = document.querySelectorAll('.icon-only');
      if (iconButtons.length > 0) {
        iconButtons[0].removeAttribute('aria-label');
        iconButtons[0].textContent = '';
      }
    });

    const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));

    // Verify the deliberate violation was caught
    const buttonNameViolations = results.violations.filter(v => v.id === 'button-name');
    expect(buttonNameViolations.length, 'Deliberate violation (button-name) should be caught').toBeGreaterThan(0);
    console.log(`Deliberate failure test: caught ${buttonNameViolations.length} button-name violation(s)`);

    // Revert: restore aria-label to the button
    await page.evaluate(() => {
      const iconButtons = document.querySelectorAll('.icon-only');
      if (iconButtons.length > 0) {
        iconButtons[0].setAttribute('aria-label', 'Search');
      }
    });

    // Verify the violation is gone after revert
    const postRevertResults = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    const postRevertButtonName = postRevertResults.violations.filter(v => v.id === 'button-name');
    expect(postRevertButtonName.length, 'button-name violations should be gone after revert').toBe(0);
    console.log('Deliberate failure test: reverted successfully, baseline restored');
  });

  test('Elements page (index.html) accessibility audit', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'index.html');
    await runAxeAudit(page, 'index.html');
  });

  test('Components page (components.html) accessibility audit', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'components.html');
    await runAxeAudit(page, 'components.html');
  });
});
