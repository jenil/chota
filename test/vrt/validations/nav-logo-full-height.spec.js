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

test.describe('Full-Height Navigation Logo DOM Inspection (#111, #134)', () => {
  test('measure ALL nav images: computed styles + bounding box + intrinsic dimensions', async ({ browser }) => {
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

    // Full DOM inspection: every nav image with every measurement
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
          const parentAnchor = img.closest('a');
          const parentCS = parentAnchor ? getComputedStyle(parentAnchor) : null;
          const parentBox = parentAnchor ? parentAnchor.getBoundingClientRect() : null;

          results.push({
            section: navIndex < 6 ? 'DEFAULT' : (navIndex < 11 ? 'OPT-IN' : (navIndex === 11 ? 'MIXED' : 'OVERFLOW')),
            navIndex,
            imgIndex,
            classes: img.className.split(' ').filter(c => c).join(', '),
            alt: img.alt,
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
              marginTop: cs.marginTop,
              marginBottom: cs.marginBottom,
            },
            rendered: {
              x: parseFloat(box.x.toFixed(2)),
              y: parseFloat(box.y.toFixed(2)),
              width: parseFloat(box.width.toFixed(2)),
              height: parseFloat(box.height.toFixed(2)),
            },
            parentAnchor: parentCS ? {
              display: parentCS.display,
              alignItems: parentCS.alignItems,
              padding: `${parentCS.paddingTop} ${parentCS.paddingRight} ${parentCS.paddingBottom} ${parentCS.paddingLeft}`,
            } : null,
            parentBox: parentBox ? {
              width: parseFloat(parentBox.width.toFixed(2)),
              height: parseFloat(parentBox.height.toFixed(2)),
            } : null,
          });
        });
      });
      
      return results;
    });

    console.log('=== DOM INSPECTION: ALL NAV IMAGES ===');
    console.log(JSON.stringify(allImages, null, 2));
    console.log('=== END INSPECTION ===');

    // Assertions on default case
    const defaults = allImages.filter(i => i.section === 'DEFAULT');
    expect(defaults.length).toBeGreaterThan(0);
    defaults.forEach(d => {
      expect(d.computed.maxHeight).toBe('30px'); // 3rem = 30px at 10px root
      expect(d.rendered.height).toBeLessThanOrEqual(30);
    });

    // Assertions on opt-in case
    const optins = allImages.filter(i => i.section === 'OPT-IN');
    expect(optins.length).toBeGreaterThan(0);
    optins.forEach(o => {
      expect(o.computed.maxHeight).toBe('none');
      expect(o.computed.objectFit).toBe('contain');
      expect(o.rendered.height).toBeGreaterThan(30); // Should exceed 3rem default
    });

    // Mixed case: default stays 30px, opt-in exceeds 30px
    const mixed = allImages.filter(i => i.section === 'MIXED');
    expect(mixed.length).toBeGreaterThan(0);
    const mixedDefault = mixed.find(m => m.classes.includes('logo-tall-default'));
    const mixedOptin = mixed.find(m => m.classes.includes('logo-tall-optin'));
    expect(mixedDefault).toBeDefined();
    expect(mixedOptin).toBeDefined();
    expect(mixedDefault.computed.maxHeight).toBe('30px');
    expect(mixedOptin.computed.maxHeight).toBe('none');
    expect(mixedOptin.rendered.height).toBeGreaterThan(mixedDefault.rendered.height);

    // Overflow check: no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);

    await context.close();
  });

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
          results.push({
            section: navIndex < 6 ? 'DEFAULT' : (navIndex < 11 ? 'OPT-IN' : 'OTHER'),
            classes: img.className.split(' ').filter(c => c).join(', '),
            alt: img.alt,
            navMinHeight: navCS.minHeight,
            navRenderedHeight: parseFloat(navBox.height.toFixed(2)),
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

    console.log('=== MOBILE DOM INSPECTION ===');
    console.log(JSON.stringify(allImages, null, 2));
    console.log('=== END MOBILE ===');

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
