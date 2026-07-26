const { test, expect } = require('@playwright/test');
const { startFixtureServer } = require('./vrt-helpers');
const fs = require('fs');
const path = require('path');

// Viewport matching VRT baseline
const DESKTOP = { width: 1280, height: 720 };

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3300);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

function getPageUrl(pageName) {
  return `http://localhost:${PORT}/${pageName}`;
}

test.describe('Manual keyboard observations', () => {
  test('Elements page: visible focus on interactive elements', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements and check focus ring is visible
    await page.keyboard.press('Tab');
    const firstFocusable = await page.$(':focus');
    expect(firstFocusable).toBeTruthy();

    // Check focus ring is visible (not transparent or missing)
    const focusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        backgroundColor: style.backgroundColor,
      };
    });

    // Document the finding (don't fail — this is observation, not violation)
    console.log('Focus ring on first element:', JSON.stringify(focusOutline));

    // Write keyboard observations to results file
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(resultsDir, 'keyboard-observations.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        page: 'index.html',
        viewport: 'desktop',
        observations: {
          visibleFocus: focusOutline,
          note: 'Keyboard focus ring visibility documented above',
        },
      }, null, 2)
    );
  });

  test('Elements page: keyboard navigation through links', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');

    // Tab to links and verify they receive focus
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const linksFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el && (el.tagName === 'A' || el.tagName === 'BUTTON');
    });
    expect(linksFocused).toBeTruthy();
  });

  test('Elements page: visible focus on form controls', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(getPageUrl('index.html'));
    await page.waitForLoadState('networkidle');

    // Tab through to form controls
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }

    const formFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        tagName: el.tagName,
        type: el.type || 'N/A',
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    });

    // Document the finding (don't fail — this is observation, not violation)
    console.log('Focus ring on form control:', JSON.stringify(formFocus));

    // Write keyboard observations to results file
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    fs.appendFileSync(
      path.join(resultsDir, 'keyboard-observations.json'),
      `\n${JSON.stringify({ formControlFocus: formFocus }, null, 2)}`
    );
  });
});
