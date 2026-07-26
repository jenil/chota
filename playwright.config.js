const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test/vrt',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    // Chromium only (per card #124)
    browserName: 'chromium',
    // Deterministic settings
    locale: 'en-US',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    // Disable animations for deterministic screenshots
    bypassCSP: true,
  },
  snapshotDir: 'test/vrt/snapshots',
  outputDir: 'test/vrt/results',
  reporter: [['html', { outputFolder: 'test/vrt/reports/html' }]],
  // Retry only on flaky network, not visual changes
  retries: 0,
});
