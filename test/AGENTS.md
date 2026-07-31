# Playwright fixtures

Read this file before adding or changing a Playwright fixture or spec under
`test/`.

## Fixture and built-CSS paths

- `test/vrt/vrt-helpers.js` serves fixtures from the `test/` directory.
- Put a fixture at `test/<name>.html` and load it with:

  ```js
  await loadFixture(page, server, '<name>.html');
  ```

- Every fixture that tests Chota CSS must load the built stylesheet with this
  exact tag:

  ```html
  <link rel="stylesheet" href="/dist/chota.css">
  ```

  The leading `/dist/` is intentional: the fixture server maps that URL to
  the repository's `dist/` directory. Do not use a relative `../dist` or
  `../../dist` path, and do not link a source CSS file.
- Before trusting a CSS assertion, prove the stylesheet loaded by checking the
  response or a known computed style. A 200 fixture page alone does not prove
  that `/dist/chota.css` was served.

## Test shape

- Put Playwright specs under `test/vrt/`; validation specs belong in
  `test/vrt/validations/`.
- Use stable `data-test-id` attributes for fixture targets. Do not rely on
  positional selectors such as `:nth-of-type()`.
- Keep fixtures small. Do not add display-only measurement scripts when the
  Playwright spec already reads computed styles.
- For CSS behavior, retain computed-style assertions. A screenshot may
  supplement them, but does not replace them.

## Before handoff

Run the named spec with `--project=chromium`, use an isolated output
directory, and report the command and exit status. Do not claim the test runs
in CI unless it is included in the existing Chromium-pinned `test:vrt` script
and the relevant GitHub Actions check is green.
