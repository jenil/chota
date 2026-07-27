const { test, expect } = require('@playwright/test');
const { startFixtureServer, loadFixture } = require('../vrt-helpers');

// Viewports as specified in card #124
const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };
const NARROW_414 = { width: 414, height: 896 };
const NARROW_320 = { width: 320, height: 568 };

// Deterministic settings for Chromium
const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

let server;
let PORT;

test.beforeAll(async () => {
  server = await startFixtureServer(3800);
  PORT = server.port;
});

test.afterAll(async () => {
  if (server) await server.stop();
});

test.describe('Mobile Grid Overflow Validation (#102)', () => {
  test('Desktop: no horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'mobile-grid-overflow.html');

    const overflowInfo = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const innerWidth = window.innerWidth;
      const container = document.querySelector('.container');
      const containerRect = container.getBoundingClientRect();
      const row = document.querySelector('.row');
      const rowRect = row.getBoundingClientRect();
      const singleCol = document.querySelector('.row .col');
      const colRect = singleCol ? singleCol.getBoundingClientRect() : null;

      return {
        scrollWidth,
        clientWidth,
        innerWidth,
        horizontalOverflow: scrollWidth - clientWidth,
        containerLeft: containerRect.left,
        containerRight: containerRect.right,
        containerWidth: containerRect.width,
        rowLeft: rowRect.left,
        rowRight: rowRect.right,
        rowWidth: rowRect.width,
        singleColLeft: colRect ? colRect.left : null,
        singleColRight: colRect ? colRect.right : null,
        singleColWidth: colRect ? colRect.width : null,
      };
    });

    console.log('Desktop overflow info:', JSON.stringify(overflowInfo, null, 2));
    expect(overflowInfo.horizontalOverflow).toBe(0);

    await context.close();
  });

  test('Mobile (375px): measure scroll width and identify overflowing box', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'mobile-grid-overflow.html');

    const overflowInfo = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const innerWidth = window.innerWidth;
      const container = document.querySelector('.container');
      const containerRect = container.getBoundingClientRect();
      const row = document.querySelector('.row');
      const rowRect = row.getBoundingClientRect();
      const singleCol = document.querySelector('.row .col');
      const colRect = singleCol ? singleCol.getBoundingClientRect() : null;

      // Find the first box that overflows (right edge > clientWidth)
      const boxes = {
        container: { left: containerRect.left, right: containerRect.right, width: containerRect.width },
        row: { left: rowRect.left, right: rowRect.right, width: rowRect.width },
        singleCol: colRect ? { left: colRect.left, right: colRect.right, width: colRect.width } : null,
      };

      let firstOverflowing = null;
      for (const [name, box] of Object.entries(boxes)) {
        if (box && box.right > innerWidth) {
          firstOverflowing = {
            name,
            overflow: box.right - innerWidth,
            left: box.left,
            right: box.right,
            width: box.width,
          };
          break;
        }
      }

      return {
        scrollWidth,
        clientWidth,
        innerWidth,
        horizontalOverflow: scrollWidth - clientWidth,
        boxes,
        firstOverflowing,
      };
    });

    console.log('Mobile (375px) overflow info:', JSON.stringify(overflowInfo, null, 2));

    // Report the key findings
    console.log(`---`);
    console.log(`Viewport: 375px, Scroll width: ${overflowInfo.scrollWidth}px`);
    console.log(`Horizontal overflow: ${overflowInfo.horizontalOverflow}px`);
    console.log(`First overflowing box: ${overflowInfo.firstOverflowing ? overflowInfo.firstOverflowing.name : 'none'}`);
    if (overflowInfo.firstOverflowing) {
      console.log(`  Overflow amount: ${overflowInfo.firstOverflowing.overflow}px`);
    }

    // Store for disposition
    global.mobileOverflowInfo = overflowInfo;

    await context.close();
  });

  test('Mobile (414px): measure scroll width', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW_414,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'mobile-grid-overflow.html');

    const overflowInfo = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const innerWidth = window.innerWidth;
      const container = document.querySelector('.container');
      const containerRect = container.getBoundingClientRect();
      const row = document.querySelector('.row');
      const rowRect = row.getBoundingClientRect();
      const singleCol = document.querySelector('.row .col');
      const colRect = singleCol ? singleCol.getBoundingClientRect() : null;

      const boxes = {
        container: { left: containerRect.left, right: containerRect.right, width: containerRect.width },
        row: { left: rowRect.left, right: rowRect.right, width: rowRect.width },
        singleCol: colRect ? { left: colRect.left, right: colRect.right, width: colRect.width } : null,
      };

      let firstOverflowing = null;
      for (const [name, box] of Object.entries(boxes)) {
        if (box && box.right > innerWidth) {
          firstOverflowing = {
            name,
            overflow: box.right - innerWidth,
            left: box.left,
            right: box.right,
            width: box.width,
          };
          break;
        }
      }

      return {
        scrollWidth,
        clientWidth,
        innerWidth,
        horizontalOverflow: scrollWidth - clientWidth,
        boxes,
        firstOverflowing,
      };
    });

    console.log('Mobile (414px) overflow info:', JSON.stringify(overflowInfo, null, 2));
    console.log(`Viewport: 414px, Scroll width: ${overflowInfo.scrollWidth}px, Overflow: ${overflowInfo.horizontalOverflow}px`);
    console.log(`First overflowing box: ${overflowInfo.firstOverflowing ? overflowInfo.firstOverflowing.name : 'none'}`);

    global.mobile414OverflowInfo = overflowInfo;

    await context.close();
  });

  test('Mobile (320px): measure scroll width (narrowest common)', async ({ browser }) => {
    const context = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: NARROW_320,
    });
    const page = await context.newPage();

    await loadFixture(page, server, 'mobile-grid-overflow.html');

    const overflowInfo = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const innerWidth = window.innerWidth;
      const container = document.querySelector('.container');
      const containerRect = container.getBoundingClientRect();
      const row = document.querySelector('.row');
      const rowRect = row.getBoundingClientRect();
      const singleCol = document.querySelector('.row .col');
      const colRect = singleCol ? singleCol.getBoundingClientRect() : null;

      const boxes = {
        container: { left: containerRect.left, right: containerRect.right, width: containerRect.width },
        row: { left: rowRect.left, right: rowRect.right, width: rowRect.width },
        singleCol: colRect ? { left: colRect.left, right: colRect.right, width: colRect.width } : null,
      };

      let firstOverflowing = null;
      for (const [name, box] of Object.entries(boxes)) {
        if (box && box.right > innerWidth) {
          firstOverflowing = {
            name,
            overflow: box.right - innerWidth,
            left: box.left,
            right: box.right,
            width: box.width,
          };
          break;
        }
      }

      return {
        scrollWidth,
        clientWidth,
        innerWidth,
        horizontalOverflow: scrollWidth - clientWidth,
        boxes,
        firstOverflowing,
      };
    });

    console.log('Mobile (320px) overflow info:', JSON.stringify(overflowInfo, null, 2));
    console.log(`Viewport: 320px, Scroll width: ${overflowInfo.scrollWidth}px, Overflow: ${overflowInfo.horizontalOverflow}px`);
    console.log(`First overflowing box: ${overflowInfo.firstOverflowing ? overflowInfo.firstOverflowing.name : 'none'}`);

    global.mobile320OverflowInfo = overflowInfo;

    await context.close();
  });

  test('Capture before screenshots: desktop and mobile (validation evidence)', async ({ browser }) => {
    // Desktop screenshot
    const desktopContext = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: DESKTOP,
    });
    const desktopPage = await desktopContext.newPage();
    await loadFixture(desktopPage, server, 'mobile-grid-overflow.html');
    const desktopScreenshot = await desktopPage.screenshot({ fullPage: false });
    // Write as validation evidence, not regression baseline
    const fs = require('fs');
    const path = require('path');
    const snapshotsDir = path.resolve(__dirname, '../../snapshots/validations/mobile-grid-overflow.spec.js-snapshots');
    fs.mkdirSync(snapshotsDir, { recursive: true });
    fs.writeFileSync(path.join(snapshotsDir, '132-desktop-grid-darwin.png'), desktopScreenshot);
    await desktopContext.close();

    // Mobile screenshot
    const mobileContext = await browser.newContext({
      ...BASE_CONTEXT_OPTIONS,
      viewport: MOBILE,
    });
    const mobilePage = await mobileContext.newPage();
    await loadFixture(mobilePage, server, 'mobile-grid-overflow.html');
    const mobileScreenshot = await mobilePage.screenshot({ fullPage: false });
    fs.writeFileSync(path.join(snapshotsDir, '132-mobile-grid-full-darwin.png'), mobileScreenshot);
    await mobileContext.close();
  });
});
