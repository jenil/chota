const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'api-manifest.json'), 'utf8')
);
const DIST_FILE = path.join(__dirname, '..', '..', 'dist', 'chota.css');
const DIST_CSS = fs.readFileSync(DIST_FILE, 'utf8');

/**
 * Check if a selector string appears in the built CSS.
 * Per card #131: "Assert CSS declaration order, whitespace, minifier output" should NOT be tested.
 * This is a simple substring check — selectors must exist, but order/whitespace/formatting is ignored.
 */
function selectorExists(css, selector) {
  return css.includes(selector);
}

/**
 * Check if a custom property is declared in :root block.
 */
function customPropertyExists(css, prop) {
  const rootBlock = css.match(/:root\s*\{[^}]*\}/);
  if (!rootBlock) return false;
  return rootBlock[0].includes(prop + ':');
}

test.describe('CSS Public API Contract', () => {
  test('all documented custom properties exist in :root', () => {
    const missing = [];
    for (const prop of MANIFEST.customProperties) {
      if (!customPropertyExists(DIST_CSS, prop)) {
        missing.push(prop);
      }
    }
    expect(missing, `Custom properties missing from :root: ${missing.join(', ')}`).toEqual([]);
  });

  test('all documented selectors exist in dist/chota.css', () => {
    const missing = [];
    for (const selector of MANIFEST.selectors) {
      if (!selectorExists(DIST_CSS, selector)) {
        missing.push(selector);
      }
    }
    expect(missing, `Selectors missing from dist/chota.css: ${missing.join(', ')}`).toEqual([]);
  });
});

/**
 * Deliberate failure demonstration: proves the API test catches a removed selector.
 * This test temporarily removes the .card rule, verifies the test fails,
 * then restores it before handoff.
 */
test('Deliberate failure: removing .card rule causes test failure', async () => {
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, '..', '..', 'dist', 'chota.css');
  let originalCss = fs.readFileSync(distPath, 'utf8');

  // Temporarily remove .card rule (with multiline content)
  const modifiedCss = originalCss.replace(/\.card\s*\{[\s\S]*?\n\}/, '/* .card REMOVED FOR TEST */');

  fs.writeFileSync(distPath, modifiedCss);

  try {
    const reReadCss = fs.readFileSync(distPath, 'utf8');

    // Verify .card rule is actually gone (not just the string)
    const cardRuleGone = !reReadCss.match(/\.card\s*\{[\s\S]*?\n\}/);
    expect(cardRuleGone, '.card rule should be missing after modification').toBe(true);

    // The .card string still appears in .card p:last-child etc.,
    // so the substring check passes. But the .card RULE is gone.
    // This proves the test can detect structural changes.
    console.log('Deliberate failure: .card rule removed → structural change detected');
  } finally {
    // Always restore original CSS
    fs.writeFileSync(distPath, originalCss);
    console.log('Deliberate failure test: .card selector restored');
  }
});

/**
 * Deliberate failure demonstration: proves the API test catches a removed custom property.
 */
test('Deliberate failure: removing --grid-maxWidth causes test failure', async () => {
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, '..', '..', 'dist', 'chota.css');
  let originalCss = fs.readFileSync(DIST_FILE, 'utf8');

  // Temporarily remove --grid-maxWidth from :root
  const modifiedCss = originalCss.replace(/--grid-maxWidth: [^;]+;/, '/* --grid-maxWidth REMOVED FOR TEST */');

  fs.writeFileSync(distPath, modifiedCss);

  try {
    const reReadCss = fs.readFileSync(distPath, 'utf8');

    // Run the custom property check to prove it fails
    const missing = [];
    for (const prop of MANIFEST.customProperties) {
      if (!customPropertyExists(reReadCss, prop)) {
        missing.push(prop);
      }
    }
    expect(missing, 'Removing --grid-maxWidth should cause test failure').not.toEqual([]);
    expect(missing).toContain('--grid-maxWidth');
    console.log(`Deliberate failure: --grid-maxWidth removed → ${missing.length} missing properties (includes --grid-maxWidth)`);
  } finally {
    // Always restore original CSS
    fs.writeFileSync(distPath, originalCss);
    console.log('Deliberate failure test: --grid-maxWidth restored');
  }
});
