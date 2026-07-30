const { defineConfig } = require('@playwright/test');

const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

module.exports = defineConfig({
  testDir: './test/vrt',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  snapshotIdFormat: name => name, // platform-independent: no -chromium-darwin/-linux suffixes
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...BASE_CONTEXT_OPTIONS, browserName: 'chromium', bypassCSP: true },
    },
    {
      name: 'firefox',
      use: { ...BASE_CONTEXT_OPTIONS, browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { ...BASE_CONTEXT_OPTIONS, browserName: 'webkit' },
    },
  ],
  snapshotDir: 'test/vrt/snapshots',
  outputDir: 'test/vrt/results',
  reporter: [['html', { outputFolder: 'test/vrt/report' }]],
  retries: 0,
});
