const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3300);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('WordPress Tag Collision (#77)', () => {
  test('CSS analysis: .tag rule exists in dist/chota.css', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await loadFixture(page, server, 'wordpress-tag-collision.html');

    // Verify the .tag CSS rule exists in the stylesheet
    const css = fs.readFileSync(path.resolve(__dirname, '../../../dist/chota.css'), 'utf-8');
    const hasTagRule = /\.tag\s*\{/.test(css);
    expect(hasTagRule).toBe(true);

    // Check the .tag rule content
    const tagRuleMatch = css.match(/\.tag\s*\{([^}]+)\}/);
    expect(tagRuleMatch).not.toBeNull();
    const tagRule = tagRuleMatch[1];
    expect(tagRule).toContain('display: inline-block');
    expect(tagRule).toContain('text-transform: uppercase');
    expect(tagRule).toContain('border: 1px solid');

    // Verify that .tag selector matches any element with class="tag"
    const matchesBody = await page.evaluate(() => {
      const tempBody = document.createElement('body');
      tempBody.className = 'tag';
      document.body.appendChild(tempBody);
      const matches = tempBody.matches('.tag');
      document.body.removeChild(tempBody);
      return matches;
    });
    expect(matchesBody).toBe(true);

    // Verify that a div with class="tag" would get .tag styles
    const styles = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.className = 'tag';
      testEl.textContent = 'test';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const result = {
        display: computed.display,
        textTransform: computed.textTransform,
        color: computed.color,
        border: computed.border,
        padding: computed.padding,
      };
      document.body.removeChild(testEl);
      return result;
    });

    // Collision confirmed: element with class="tag" gets .tag styles
    expect(styles.display).toContain('inline');
    expect(styles.textTransform).toBe('uppercase');
    expect(styles.border).toContain('1px');

    await context.close();
  });
});
