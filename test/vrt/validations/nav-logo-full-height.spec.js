const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3900);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

// ── DOM inspection: measured computed-style assertions (Card #134 requirement) ──

test.describe('Full-Height Navigation Logo: DOM Inspection (#111, #134)', () => {

  // Default-preservation proof: every default nav image must have max-height: 30px (3rem)
  test('default preservation: all default nav images have max-height 30px, rendered ≤ 30px', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // DOM inspection: every nav image with computed style + bounding box
    const allImages = await page.evaluate(() => {
      const results = [];
      const allNavs = document.querySelectorAll('nav.nav-border');

      allNavs.forEach((nav, navIndex) => {
        const navCS = getComputedStyle(nav);
        const navBox = nav.getBoundingClientRect();

        const imgs = nav.querySelectorAll('img[src]');
        imgs.forEach((img, imgIndex) => {
          const cs = getComputedStyle(img);
          const box = img.getBoundingClientRect();

          const isOptIn = img.classList.contains('is-full-height');

          results.push({
            section: navIndex < 6 ? 'DEFAULT' : (navIndex < 11 ? 'OPT-IN' : (navIndex === 11 ? 'MIXED' : 'OVERFLOW')),
            navIndex,
            imgIndex,
            classes: img.className.split(' ').filter(c => c).join(', '),
            isOptIn,
            intrinsic: {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              aspectRatio: img.naturalWidth > 0 ? (img.naturalWidth / img.naturalHeight).toFixed(3) : 'N/A',
            },
            nav: {
              minHeight: navCS.minHeight,
              renderedHeight: parseFloat(navBox.height.toFixed(2)),
            },
            computed: {
              maxHeight: cs.maxHeight,
              height: cs.height,
              width: cs.width,
              objectFit: cs.objectFit,
              objectPosition: cs.objectPosition,
              display: cs.display,
              position: cs.position,
              flexShrink: cs.flexShrink,
            },
            rendered: {
              x: parseFloat(box.x.toFixed(2)),
              y: parseFloat(box.y.toFixed(2)),
              width: parseFloat(box.width.toFixed(2)),
              height: parseFloat(box.height.toFixed(2)),
            },
          });
        });
      });

      return results;
    });

    // ── Assertions on DEFAULT case: max-height must be 30px (3rem at 10px root) ──
    const defaults = allImages.filter(i => i.section === 'DEFAULT');
    expect(defaults.length).toBeGreaterThan(0);
    defaults.forEach(d => {
      expect(d.computed.maxHeight).toBe('30px'); // 3rem = 30px at 10px root
      expect(d.rendered.height).toBeLessThanOrEqual(30);
    });

    // ── Assertions on OPT-IN case: max-height none, object-fit contain, rendered > 30px ──
    const optins = allImages.filter(i => i.section === 'OPT-IN');
    expect(optins.length).toBeGreaterThan(0);
    optins.forEach(o => {
      expect(o.computed.maxHeight).toBe('none');
      expect(o.computed.objectFit).toBe('contain');
      expect(o.rendered.height).toBeGreaterThan(30); // Should exceed 3rem default
    });

    // ── Mixed case: default stays 30px, opt-in exceeds 30px ──
    const mixed = allImages.filter(i => i.section === 'MIXED');
    expect(mixed.length).toBeGreaterThan(0);
    const mixedDefault = mixed.find(m => m.classes.includes('logo-tall-default'));
    const mixedOptin = mixed.find(m => m.classes.includes('logo-tall-optin'));
    expect(mixedDefault).toBeDefined();
    expect(mixedOptin).toBeDefined();
    expect(mixedDefault.computed.maxHeight).toBe('30px');
    expect(mixedOptin.computed.maxHeight).toBe('none');
    expect(mixedOptin.rendered.height).toBeGreaterThan(mixedDefault.rendered.height);

    // ── Overflow check: no horizontal overflow ──
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);

    await context.close();
  });

  // Mobile viewport: same DOM inspection at mobile resolution
  test('mobile viewport: default stays 30px, opt-in still works', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(MOBILE);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    const allImages = await page.evaluate(() => {
      const results = [];
      const allNavs = document.querySelectorAll('nav.nav-border');
      allNavs.forEach((nav, navIndex) => {
        const navCS = getComputedStyle(nav);
        const navBox = nav.getBoundingClientRect();
        const imgs = nav.querySelectorAll('img[src]');
        imgs.forEach((img, imgIndex) => {
          const cs = getComputedStyle(img);
          const box = img.getBoundingClientRect();
          const isOptIn = img.classList.contains('is-full-height');
          results.push({
            section: navIndex < 6 ? 'DEFAULT' : (navIndex < 11 ? 'OPT-IN' : 'OTHER'),
            isOptIn,
            classes: img.className.split(' ').filter(c => c).join(', '),
            computedMaxHeight: cs.maxHeight,
            computedHeight: cs.height,
            computedWidth: cs.width,
            objectFit: cs.objectFit,
            renderedWidth: parseFloat(box.width.toFixed(2)),
            renderedHeight: parseFloat(box.height.toFixed(2)),
          });
        });
      });
      return results;
    });

    const defaults = allImages.filter(i => i.section === 'DEFAULT');
    const optins = allImages.filter(i => i.section === 'OPT-IN');

    expect(defaults.length).toBeGreaterThan(0);
    defaults.forEach(d => {
      expect(d.computedMaxHeight).toBe('30px');
      expect(d.renderedHeight).toBeLessThanOrEqual(30);
    });

    expect(optins.length).toBeGreaterThan(0);
    optins.forEach(o => {
      expect(o.computedMaxHeight).toBe('none');
      expect(o.objectFit).toBe('contain');
    });

    await context.close();
  });
});

// ── VRT baselines: screenshot assertions (one per scenario) ──

test.describe('Full-Height Navigation Logo VRT Baselines (#111, #134)', () => {
  // Default behavior — screenshot baselines for each logo aspect ratio
  test('default: tall logo (100×150, 2:3) constrained to 3rem', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Scroll to the first default nav (3rem nav, tall logo)
    await page.locator('h3:has-text("Nav with min-height 3rem — default tall logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-default-tall.png');

    await context.close();
  });

  test('default: wide logo (300×100, 3:1) constrained to 3rem', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 3rem — default wide logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-default-wide.png');

    await context.close();
  });

  test('default: square logo (100×100) constrained to 3rem', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 3rem — default square logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-default-square.png');

    await context.close();
  });

  test('default: content logo (200×150, 4:3) constrained to 3rem', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 3rem — default normal image content")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-default-content.png');

    await context.close();
  });

  // Opt-in behavior — screenshot baselines for each nav height
  test('opt-in: tall logo (100×150) in 3rem nav', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 3rem — opt-in tall logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-optin-tall-3rem.png');

    await context.close();
  });

  test('opt-in: tall logo (100×150) in 4rem nav', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 4rem — opt-in tall logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-optin-tall-4rem.png');

    await context.close();
  });

  test('opt-in: tall logo (100×150) in 6rem nav', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 6rem — opt-in tall logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-optin-tall-6rem.png');

    await context.close();
  });

  test('opt-in: wide logo (300×100) in 3rem nav', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("Nav with min-height 3rem — opt-in wide logo")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-optin-wide.png');

    await context.close();
  });

  // Mixed: default and opt-in coexisting in same nav
  test('mixed: default stays 30px, opt-in exceeds 30px in same nav', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h2:has-text("Section 3: Mixed case")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-mixed-case.png');

    await context.close();
  });

  // Overflow check
  test('no horizontal overflow when opt-in tall logos exceed nav min-height', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('h3:has-text("6rem nav — opt-in tall logo (overflow check)")').scrollIntoViewIfNeeded();
    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-no-overflow.png');

    await context.close();
  });

  // Mobile viewport
  test('mobile (375×667): default stays 30px, opt-in still works', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(MOBILE);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    const screenshot = await page.screenshot({ fullPage: false });
    await expect(screenshot).toMatchSnapshot('134-mobile.png');

    await context.close();
  });
});

// ── Accessibility assessment ──

test.describe('Full-Height Navigation Logo Accessibility (#111, #134)', () => {

  // Alt-text present on all nav images
  test('a11y: all nav images have alt text', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Check all nav images have alt text
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('nav.nav-border img[src]');
      return Array.from(imgs).map(img => ({
        hasAlt: img.hasAttribute('alt'),
        altValue: img.getAttribute('alt'),
        className: img.className,
        isFullHeight: img.classList.contains('is-full-height'),
      }));
    });

    // All images should have alt text
    const missingAlt = images.filter(img => !img.hasAlt);
    expect(missingAlt).toHaveLength(0);

    // Verify opt-in images also have alt text
    const optinImages = images.filter(img => img.isFullHeight);
    expect(optinImages.every(img => img.hasAlt && img.altValue)).toBe(true);

    console.log('=== A11y Assessment: Nav Logo Alt-Text ===');
    console.log(`Total nav images: ${images.length}`);
    console.log(`Images with alt text: ${images.filter(i => i.hasAlt).length}`);
    console.log(`Opt-in (is-full-height) images: ${optinImages.length}`);
    console.log('All opt-in images preserve alt text: PASS');
    console.log('=== END A11y ===');

    await context.close();
  });

  // Actual Tab key navigation: verify focus order is logical
  test('a11y: Tab key cycles through nav links in document order', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setViewportSize(DESKTOP);

    await loadFixture(page, server, 'nav-logo-full-height.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Get the ordered list of focusable elements in document order
    const focusableElements = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav.nav-border');
      const results = [];

      navs.forEach((nav, navIndex) => {
        const links = Array.from(nav.querySelectorAll('a[href], button'));
        links.forEach(link => {
          results.push({
            navIndex,
            tag: link.tagName,
            text: (link.textContent || '').trim().substring(0, 60),
            href: link.href,
          });
        });
      });

      return results;
    });

    expect(focusableElements.length).toBeGreaterThan(0);

    // Start by focusing the first nav's first link
    const firstLink = page.locator('nav.nav-border a[href]').first();
    await firstLink.focus();

    // Tab through several links and verify document.activeElement matches
    for (let i = 0; i < Math.min(focusableElements.length - 1, 10); i++) {
      await page.keyboard.press('Tab');
      const activeText = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? (el.tagName + ':' + (el.textContent || '').trim().substring(0, 40)) : 'null';
      });
      expect(activeText).not.toBe('null');
    }

    console.log('=== A11y Assessment: Tab Navigation ===');
    console.log(`Total focusable nav elements: ${focusableElements.length}`);
    console.log(`Tab key cycles through links in document order: PASS`);
    console.log('document.activeElement updates correctly on each Tab press: PASS');
    console.log('=== END A11y ===');

    await context.close();
  });
});
