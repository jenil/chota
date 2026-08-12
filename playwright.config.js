const { defineConfig } = require('@playwright/test');

const BASE_CONTEXT_OPTIONS = {
  locale: 'en-US',
  colorScheme: 'light',
  reducedMotion: 'reduce',
};

// Specs under test/vrt/ that are NOT part of the `test:vrt` gate. Each has its
// own dedicated gate (test:a11y, test:api, browser smoke) or is manual-run
// (root-font-scaling). They are excluded from the `chromium` project only, so
// the `chromium-a11y-api` / `firefox` / `webkit` projects can still run them
// by explicit path. New VRT specs need no edit here — they are picked up by
// `chromium` discovery automatically.
const NON_VRT_SPECS = [
  '**/a11y.spec.js',
  '**/api.spec.js',
  '**/browser-smoke.spec.js',
  '**/root-font-scaling.spec.js',
];

module.exports = defineConfig({
  testDir: './test/vrt',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      // The `test:vrt` gate: every spec under test/vrt/ except the non-VRT
      // specs above. The project name MUST stay `chromium`: Playwright embeds
      // the project name in the snapshot suffix, so renaming it would break
      // every `-chromium-<platform>.png` baseline.
      name: 'chromium',
      testIgnore: NON_VRT_SPECS,
      use: { ...BASE_CONTEXT_OPTIONS, browserName: 'chromium', bypassCSP: true },
    },
    {
      // Plain Chromium project for the dedicated a11y/api gates (explicit
      // paths). No testIgnore, so it can run any spec by path. Produces no
      // snapshots, so its name does not affect any baseline.
      name: 'chromium-a11y-api',
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
