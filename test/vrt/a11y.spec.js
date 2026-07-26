const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('./vrt-helpers');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

// Viewport matching VRT baseline
const DESKTOP = { width: 1280, height: 720 };

// Load the approved baseline for comparison
const BASELINE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'a11y-baseline.json'), 'utf8')
);

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
 * Normalize a node target to a string: axe-core returns target as [selector].
 */
function normalizeTarget(target) {
  if (Array.isArray(target)) return target.join(', ');
  if (typeof target === 'string') return target;
  return '';
}

/**
 * Compare normalized findings against the approved baseline.
 * Returns errors for: new rules, higher severity, or changed affected nodes.
 *
 * Granularity: (page, rule ID, impact, affected node).
 * - A new rule (ID not in baseline) → FAIL
 * - Severity increase for an existing rule → FAIL
 * - A new node under an existing rule (current node not in approved nodes) → FAIL
 * - A resolved (disappearing) baseline node → no failure (allowed to disappear)
 */
function impactLevel(impact) {
  const levels = { none: 0, minor: 1, moderate: 2, serious: 3, critical: 4 };
  return levels[impact] || 0;
}

function compareFindings(currentViolations, baselinePage) {
  const baselineById = new Map(baselinePage.violations.map(v => [v.id, v]));
  const errors = [];

  for (const violation of currentViolations) {
    const baseline = baselineById.get(violation.id);

    if (!baseline) {
      errors.push(`NEW violation: ${violation.id} [${violation.impact}] not in baseline`);
      continue;
    }

    // Check severity increase
    if (impactLevel(violation.impact) > impactLevel(baseline.impact)) {
      errors.push(`SEVERITY INCREASE: ${violation.id} went from ${baseline.impact} to ${violation.impact}`);
    }

    // Check affected nodes: every current node must appear in the approved nodes.
    // A new node under an existing rule is a failure.
    // Disappearing (resolved) baseline nodes are allowed — no failure.
    const approvedTargets = new Set(baseline.nodes);
    const currentTargets = violation.nodes.map(n => normalizeTarget(n.target));

    for (const target of currentTargets) {
      if (!approvedTargets.has(target)) {
        errors.push(`NEW node for ${violation.id}: "${target}" not in approved nodes [${baseline.nodes.join(', ')}]`);
      }
    }
  }

  return errors;
}

/**
 * Run axe-core audit on the given page and compare against the approved baseline.
 * Fails for: new rules, higher severity, or changed affected nodes.
 * Passes for existing approved findings that match the baseline.
 */
async function runAxeAudit(page, pageName) {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));

  const baselinePage = BASELINE.pages[pageName];
  if (!baselinePage) {
    throw new Error(`No baseline for page: ${pageName}`);
  }

  // Compare against baseline
  const comparisonErrors = compareFindings(results.violations, baselinePage);

  // Write full findings to results directory (for CI artifacts, without timestamps)
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  const findings = {
    page: pageName,
    viewport: 'desktop',
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map(n => ({
        target: normalizeTarget(n.target),
        html: n.html?.substring(0, 200),
        any: n.any.map(a => ({ id: a.id, impact: a.impact })),
      })),
    })),
    incomplete: results.incomplete.map(i => ({
      id: i.id,
      impact: i.impact,
      description: i.description,
      nodes: i.nodes.map(n => ({ target: normalizeTarget(n.target), html: n.html?.substring(0, 200) })),
    })),
    comparisonErrors,
  };

  fs.writeFileSync(
    path.join(resultsDir, `a11y-${pageName}.json`),
    JSON.stringify(findings, null, 2)
  );

  console.log(`${pageName}: ${results.violations.length} violations, ${results.incomplete.length} incomplete`);
  results.violations.forEach(v => {
    console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
  });

  // Fail if comparison found issues
  expect(comparisonErrors, `Baseline comparison errors for ${pageName}:`).toEqual([]);
}

test.describe('Accessibility baseline (axe-core)', () => {
  test('Deliberate failure demonstration: axe catches missing button label', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'index.html');
    await page.addScriptTag({ path: require.resolve('axe-core') });

    // Introduce a deliberate violation: remove text content from a submit button
    // that is NOT in the baseline (submit buttons currently have visible text).
    // This creates a new node (button[type=submit]) with button-name violation.
    await page.evaluate(() => {
      const submitButtons = document.querySelectorAll('button[type="submit"]');
      if (submitButtons.length > 0) {
        submitButtons[0].textContent = '';
      }
    });

    // Use the same comparison function as the normal audit
    const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    const baselinePage = BASELINE.pages['index.html'];
    const comparisonErrors = compareFindings(results.violations, baselinePage);

    // Verify the deliberate failure was caught (errors are non-empty)
    expect(comparisonErrors.length, 'Deliberate violation should produce non-empty comparison errors').toBeGreaterThan(0);
    console.log(`Deliberate failure test: caught ${comparisonErrors.length} comparison error(s):`);
    comparisonErrors.forEach(e => console.log(`  ${e}`));

    // Revert: restore text content to the submit button
    await page.evaluate(() => {
      const submitButtons = document.querySelectorAll('button[type="submit"]');
      if (submitButtons.length > 0) {
        submitButtons[0].textContent = '<button type=submit>';
      }
    });

    // Verify the violation is gone after revert (comparison passes)
    const postRevertResults = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    const postRevertErrors = compareFindings(postRevertResults.violations, baselinePage);
    expect(postRevertErrors, 'Baseline comparison should pass after revert').toEqual([]);
    console.log('Deliberate failure test: reverted successfully, baseline restored');
  });

  test('Temporary new violation triggers baseline failure, then restores', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loadFixture(page, server, 'index.html');
    await page.addScriptTag({ path: require.resolve('axe-core') });

    // Introduce a new violation: remove lang attribute from <html>
    // This introduces a new rule (html-has-lang) not in the baseline
    await page.evaluate(() => {
      document.documentElement.removeAttribute('lang');
    });

    // Use the same comparison function as the normal audit
    const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    const comparisonErrors = compareFindings(results.violations, BASELINE.pages['index.html']);

    // Verify a new violation produced non-empty comparison errors
    expect(comparisonErrors.length, 'Should produce non-empty comparison errors for a new rule').toBeGreaterThan(0);
    console.log(`New violation detected: ${comparisonErrors.join('; ')} — baseline comparison would FAIL`);

    // Restore the lang attribute
    await page.evaluate(() => {
      document.documentElement.setAttribute('lang', 'en');
    });

    // Verify the violation is gone after restore (comparison passes)
    const postRestoreResults = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }));
    const postRestoreErrors = compareFindings(postRestoreResults.violations, BASELINE.pages['index.html']);
    expect(postRestoreErrors, 'No comparison errors after restore').toEqual([]);
    console.log('Temporary violation restored — baseline comparison would PASS');
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
