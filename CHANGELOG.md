# Chota Changelog

This file documents released and unreleased changes to [Chota](https://github.com/jenil/chota).
The `Unreleased` section tracks work merged to the `v1` integration branch that
has not yet shipped to `main` or been published to npm.

## Unreleased

Work merged to the `v1` branch in preparation for the 1.0.0 release. Nothing
here is published yet; the 1.0.0 release happens in card [#145](https://github.com/jenil/chota/issues/145).
The full upgrade guide lives in [MIGRATION.md](./MIGRATION.md).

### Breaking changes

- **Internet Explorer 11 is no longer supported.** The `browserslist` policy is
  now `last 2 Chrome versions`, `last 2 Firefox versions`, `last 2 Edge
  versions`, `Safari >= 15.4`, `ios >= 15.4`. IE11 users see a degraded
  experience; there is no legacy build. ([#122](https://github.com/jenil/chota/issues/122))
- **Root font-size override removed.** Chota no longer sets
  `html { font-size: 62.5% }`. The root font-size is the consumer's
  responsibility and defaults to the browser's 16px. Every Chota-owned `rem`
  value was divided by 1.6 so rendered pixels are unchanged at a 16px root.
  Consumers who set `html { font-size: 62.5% }` themselves now see Chota render
  at 0.625× its 16px-root size — proportional scaling, not a second baseline.
  ([#137](https://github.com/jenil/chota/issues/137))

### New features

- **Visible keyboard focus.** A global `:focus-visible` rule applies
  `outline: 2px solid var(--color-primary); outline-offset: 2px` to `a`,
  `button`, `input`, `select`, `textarea`, `summary`, and `[tabindex]`. Form
  controls retain their existing border + box-shadow focus signal, now scoped
  to keyboard focus only (not mouse click). `:focus-visible` is supported
  across the entire declared browserslist, so no `:focus` fallback is needed.
  ([#139](https://github.com/jenil/chota/issues/139))
- **Three new design tokens.** `--color-placeholder`, `--border-radius`, and
  `--transition-duration` are now CSS custom properties on `:root`, replacing
  previously hardcoded values. Defaults preserve the previous rendered output;
  override on `:root` (or any selector) to theme all affected components at
  once. ([#138](https://github.com/jenil/chota/issues/138))
- **Grouped controls wrap on narrow viewports.** `.grouped` now applies
  `flex-wrap: wrap` inside `@media (max-width: 480px)` so items wrap to a
  vertical layout instead of overflowing horizontally. `.grouped.gapless`
  keeps `gap: 0` to preserve joined borders. Desktop layout is unchanged.
  ([#114](https://github.com/jenil/chota/issues/114), validated in
  [#135](https://github.com/jenil/chota/issues/135), shipped via
  [PR #170](https://github.com/jenil/chota/pull/170))

### Documentation

- `body.dark` is documented as a **consumer convention**, not a built-in theme.
  Chota ships no `body.dark` rule and no default dark palette; the consumer
  owns the selector, the overrides, and the decision of when to apply the
  class. See the "Customizing" section of the docs site and
  [`docs/examples/dark-mode.html`](./docs/examples/dark-mode.html).
  ([#140](https://github.com/jenil/chota/issues/140))
- **CSS-only interaction boundary** documented for `.dropdown` and `.tabs`:
  Chota provides visual styling only. Native `<details>`/`<summary>` supplies
  disclosure behavior; `.tabs` is visual navigation, not an ARIA Tabs widget.
  Chota does not manage ARIA state, focus traps, or menu keyboard interaction.
  ([#141](https://github.com/jenil/chota/issues/141))

### Validation outcomes (no shipped change)

The following reports were investigated and closed without a v1 code change.
They are listed here so consumers can find the disposition; they are **not**
shipped changes and are not part of the upgrade guide.

- [#77](https://github.com/jenil/chota/issues/77) / [#133](https://github.com/jenil/chota/issues/133) — WordPress `body.tag` collision with `.tag`. Closed out-of-scope: the `.tag` public API is preserved; a future version may consider a prefixed build. See "Known limitations" in [MIGRATION.md](./MIGRATION.md).
- [#102](https://github.com/jenil/chota/issues/102) / [#132](https://github.com/jenil/chota/issues/132) — mobile grid overflow. Validated; no v1 fix shipped.
- [#111](https://github.com/jenil/chota/issues/111) / [#134](https://github.com/jenil/chota/issues/134) — full-height nav logo. Validated; no v1 fix shipped.
- [#61](https://github.com/jenil/chota/issues/61) / [#136](https://github.com/jenil/chota/issues/136) — spacing utilities. Validated; no v1 fix shipped.

### Tooling and quality

- Standardized Yarn toolchain, portable size gate (4096-byte gzip ceiling),
  architecture/workflow docs, dependency maintenance policy.
  ([#123](https://github.com/jenil/chota/issues/123),
  [#126](https://github.com/jenil/chota/issues/126),
  [#127](https://github.com/jenil/chota/issues/127),
  [#128](https://github.com/jenil/chota/issues/128))
- CI quality gate, Chromium VRT, axe-core a11y baseline, CSS public API
  contract, Firefox/WebKit smoke coverage.
  ([#129](https://github.com/jenil/chota/issues/129),
  [#124](https://github.com/jenil/chota/issues/124),
  [#130](https://github.com/jenil/chota/issues/130),
  [#131](https://github.com/jenil/chota/issues/131))
- `test:vrt` discovery mechanism: new VRT specs need zero harness edits.
  ([#190](https://github.com/jenil/chota/issues/190))
