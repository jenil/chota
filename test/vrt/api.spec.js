const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'api-manifest.json'), 'utf8')
);
const DIST_FILE = path.join(__dirname, '..', '..', 'dist', 'chota.css');
const DIST_CSS = fs.readFileSync(DIST_FILE, 'utf8');
const MIN_DIST_FILE = path.join(__dirname, '..', '..', 'dist', 'chota.min.css');
const MIN_DIST_CSS = fs.readFileSync(MIN_DIST_FILE, 'utf8');

/**
 * Normalize selector formatting without changing selector meaning.
 * This keeps the contract insensitive to whitespace around combinators and commas.
 */
function normalizeSelector(selector) {
  let normalized = '';
  let pendingSpace = false;
  let quote = null;

  for (const character of selector.trim()) {
    if (quote) {
      normalized += character;
      if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      if (pendingSpace) normalized += ' ';
      pendingSpace = false;
      quote = character;
      normalized += character;
      continue;
    }

    if (/\s/.test(character)) {
      pendingSpace = true;
      continue;
    }

    if (',>+~'.includes(character)) {
      normalized = normalized.trimEnd();
      normalized += character;
      pendingSpace = false;
      continue;
    }

    if (
      pendingSpace &&
      normalized &&
      !(character === ':' && normalized.endsWith('*')) &&
      !'[,>+~('.includes(normalized.at(-1))
    ) {
      normalized += ' ';
    }
    pendingSpace = false;
    normalized += character;
  }

  return normalized
    .trim()
    .replace(/\*:/g, ':')
    .replace(/(\[[^\]=~|^$*!\s]+\s*[~|^$*!]?=\s*)["']([a-zA-Z_][\w-]*)["'](?=\s*\])/g, '$1$2');
}

function splitSelectors(selectorText) {
  const selectors = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = null;

  for (let index = 0; index < selectorText.length; index += 1) {
    const character = selectorText[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      parentheses += 1;
    } else if (character === ')') {
      parentheses -= 1;
    } else if (character === '[') {
      brackets += 1;
    } else if (character === ']') {
      brackets -= 1;
    } else if (character === ',' && parentheses === 0 && brackets === 0) {
      selectors.push(selectorText.slice(start, index));
      start = index + 1;
    }
  }

  selectors.push(selectorText.slice(start));
  return selectors;
}

/**
 * Parse the built stylesheet into exact selectors and declarations.
 * Declaration order, whitespace, grouping, and minifier formatting are ignored.
 */
function collectPublicApi(css) {
  const root = postcss.parse(css);
  const selectors = new Set();
  const customProperties = new Set();

  root.walkRules((rule) => {
    const ruleSelectors = splitSelectors(rule.selector || '');
    for (const selector of ruleSelectors) {
      selectors.add(normalizeSelector(selector));
    }

    if (ruleSelectors.some((selector) => normalizeSelector(selector) === ':root')) {
      rule.walkDecls((declaration) => {
        if (declaration.prop.startsWith('--')) customProperties.add(declaration.prop);
      });
    }
  });

  return { selectors, customProperties };
}

function findMissingApiEntries(css) {
  const parsed = collectPublicApi(css);
  return {
    selectors: MANIFEST.selectors.filter(
      (selector) => !parsed.selectors.has(normalizeSelector(selector))
    ),
    customProperties: MANIFEST.customProperties.filter(
      (property) => !parsed.customProperties.has(property)
    ),
  };
}

function assertPublicApi(css) {
  const missing = findMissingApiEntries(css);
  expect(missing.customProperties, `Custom properties missing from :root: ${missing.customProperties.join(', ')}`).toEqual([]);
  expect(missing.selectors, `Selectors missing from dist/chota.css: ${missing.selectors.join(', ')}`).toEqual([]);
}

function removeSelector(css, selectorToRemove) {
  const root = postcss.parse(css);
  const normalizedTarget = normalizeSelector(selectorToRemove);
  let removed = false;

  root.walkRules((rule) => {
    const selectors = splitSelectors(rule.selector || '').map(normalizeSelector);
    if (!selectors.includes(normalizedTarget)) return;

    const remaining = selectors.filter((selector) => selector !== normalizedTarget);
    if (remaining.length === 0) rule.remove();
    else rule.selectors = remaining;
    removed = true;
  });

  expect(removed, `Expected to remove selector ${selectorToRemove}`).toBe(true);
  return root.toString();
}

function removeCustomProperty(css, propertyToRemove) {
  const root = postcss.parse(css);
  let removed = false;

  root.walkRules((rule) => {
    const selectors = splitSelectors(rule.selector || '');
    if (!selectors.some((selector) => normalizeSelector(selector) === ':root')) return;
    rule.walkDecls(propertyToRemove, (declaration) => {
      declaration.remove();
      removed = true;
    });
  });

  expect(removed, `Expected to remove custom property ${propertyToRemove}`).toBe(true);
  return root.toString();
}

test.describe('CSS Public API Contract', () => {
  test('all documented custom properties exist in :root', () => {
    assertPublicApi(DIST_CSS);
  });

  test('all documented selectors exist in dist/chota.css', () => {
    assertPublicApi(DIST_CSS);
  });

  test('the contract accepts minified built CSS', () => {
    assertPublicApi(MIN_DIST_CSS);
  });
});

/**
 * Deliberate failure demonstration: the same contract assertion must reject a
 * built stylesheet with an approved selector removed.
 */
test('Deliberate failure: removing .card rule causes test failure', async () => {
  const modifiedCss = removeSelector(DIST_CSS, '.card');
  let assertionError;

  try {
    assertPublicApi(modifiedCss);
  } catch (error) {
    assertionError = error;
  }

  expect(assertionError, 'Removing .card should fail the public API contract').toBeDefined();
  expect(assertionError.message).toContain('.card');
});

/**
 * Deliberate failure demonstration: the same contract assertion must reject a
 * :root block with an approved custom property removed.
 */
test('Deliberate failure: removing --grid-maxWidth causes test failure', async () => {
  const modifiedCss = removeCustomProperty(DIST_CSS, '--grid-maxWidth');
  let assertionError;

  try {
    assertPublicApi(modifiedCss);
  } catch (error) {
    assertionError = error;
  }

  expect(assertionError, 'Removing --grid-maxWidth should fail the public API contract').toBeDefined();
  expect(assertionError.message).toContain('--grid-maxWidth');
});
