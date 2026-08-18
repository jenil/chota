# Migration Guide — Chota 0.9.x → 1.0.0

## Breaking Changes

### Internet Explorer 11 No Longer Supported

Chota 1.0.0 drops Internet Explorer 11 support. The `browserslist` policy was updated from `["last 2 versions"]` (which included IE11) to:

```json
"browserslist": [
  "last 2 Chrome versions",
  "last 2 Firefox versions",
  "last 2 Edge versions",
  "Safari >= 15.4",
  "ios >= 15.4"
]
```

**Impact:** IE11 users will see a degraded experience. Modern CSS features used by Chota (flexbox, CSS custom properties) are not available in IE11. The `browserslist` in `package.json` was updated to explicit queries: `"last 2 Chrome versions", "last 2 Firefox versions", "last 2 Edge versions", "Safari >= 15.4", "ios >= 15.4"`.

**Migration:** If you must support IE11, continue using Chota 0.9.x. There is no legacy build for v1.

## Non-Breaking Changes

- All public CSS class names remain compatible: `.container`, `.row`, `.col-*`, `.tag`, `body.dark`.
- No changes to utility classes or component markup.
- `!important` usage in utilities is preserved.

## Visible Keyboard Focus

### What changed

Chota now applies a visible keyboard focus ring to all interactive elements via
a global `:focus-visible` rule:

```css
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Form controls (`input`, `select`, `textarea`) retain their existing border +
box-shadow focus signal, but the selector switched from `:focus` to
`:focus-visible` so the signal fires only on keyboard focus, not on mouse
click. The previous `:focus` rule set `outline: none` and relied on the
box-shadow alone; the new rule keeps the box-shadow and adds a real outline
for elements that had no focus indicator before (links, buttons, summaries,
tabindex elements).

`:focus-visible` is supported across the entire declared browserslist
(Safari 15.4+, iOS 15.4+, latest Chrome/Firefox/Edge), so no `:focus`
fallback is needed.

### Why

The previous behavior hid the outline on form controls and showed nothing on
links/buttons, which failed keyboard accessibility. The new rule gives every
interactive element a visible focus ring on keyboard navigation without
cluttering mouse-click interactions.

### Consumer impact

- **Consumers who rely on the browser default outline:** no action needed.
  Chota now provides a consistent focus ring across all interactive elements.
- **Consumers who set their own `:focus` / `:focus-visible` styles:**
  override after importing `chota.css`. Chota's rule has the same specificity
  as a single pseudo-class selector, so a same-or-higher-specificity rule on
  the same elements wins.
- **Consumers who previously set `outline: none` globally to hide the
  browser default:** Chota's `:focus-visible` rule will re-introduce a focus
  ring. If you want to suppress it, override `:focus-visible` explicitly.

## Grouped Controls Wrap on Narrow Viewports

### What changed

`.grouped` now wraps its children to a vertical layout on narrow viewports
instead of overflowing horizontally:

```css
.grouped {
  display: flex;
  gap: 0 16px;
}

@media (max-width: 480px) {
  .grouped {
    flex-wrap: wrap;
    gap: 16px;
  }

  /* Gapless groups keep joined borders — no gap spacing. */
  .grouped.gapless {
    gap: 0;
  }
}
```

On desktop (viewports wider than 480px), `.grouped` stays horizontal — the
existing behavior is unchanged. `.grouped.gapless` keeps `gap: 0` at every
viewport so its joined-border geometry is preserved.

### Why

Previously `.grouped` used `margin-right: 16px` on children with no
`flex-wrap`, so a group wider than its container overflowed horizontally on
mobile. The fix adds `flex-wrap: wrap` scoped to narrow viewports and
replaces the child margin with `gap`.

### Consumer impact

- **Consumers who relied on `.grouped` overflowing horizontally on mobile:**
  it now wraps. This is the intended fix; if you need the old horizontal
  overflow, override `flex-wrap: nowrap` on `.grouped` at your narrow
  breakpoint.
- **Consumers who set custom margins on `.grouped > *`:** the new `gap`
  property replaces the old `margin-right: 16px` on non-last children. Custom
  margins still apply; `gap` adds space between flex items on top of any
  per-item margins.
- **`.grouped.gapless` consumers:** no visual change. Joined borders and
  zero spacing are preserved at every viewport.

## Root Font-Size Migration

### What changed

Chota no longer sets `html { font-size: 62.5% }`. The root font-size is the consumer's responsibility and defaults to the browser's 16px. Every Chota-owned `rem` value was divided by 1.6 so that rendered pixels are unchanged at a 16px consumer root.

### Why

Previously Chota forced `1rem = 10px`, which overrode the consumer's root font-size and broke accessibility zoom and consumer overrides. Removing the override lets Chota respect the consumer's root font-size — including accessibility zoom and consumer overrides — while preserving the rendered design at a 16px root.

### Consumer impact

- **Consumers who did NOT override the root:** no visual change. The body font-size is still 16px — `--font-size: 1rem` at a 16px root = 16px, the same as the old `1.6rem` at a 10px root = 16px.
- **Consumers who set `html { font-size: 62.5% }`:** Chota now renders at 0.625× its 16px-root size. This is proportional scaling against the consumer's chosen root, not a second baseline.
- **Consumers who set a different root (e.g. 20px):** Chota scales proportionally to that root.

### Reference table

| Property | Before | After | Rendered px (16px root) |
|---|---|---|---|
| `--grid-maxWidth` | `120rem` | `75rem` | 1200px (unchanged) |
| `--grid-gutter` | `2rem` | `1.25rem` | 20px (unchanged) |
| `--font-size` | `1.6rem` | `1rem` | 16px (unchanged) |

### Note on em-based typography

Em-based typography (`h1`–`h6`, `.tag.is-small`/`.is-large`, `.nav .brand`, `code`/`kbd`) is unchanged — it was always relative to the body font-size, which remains 16px.

## Design Tokens

### What changed

Chota now exposes three component-level design tokens as CSS custom properties, replacing previously hardcoded values:

| Property | Before | After | Default |
|---|---|---|---|
| `--color-placeholder` | `#bdbfc4` (hardcoded in `::placeholder`) | `var(--color-placeholder)` | `#bdbfc4` |
| `--border-radius` | `4px` (hardcoded on `.card`, inputs, buttons, `code`/`kbd`, `.grouped.gapless` outer corners) | `var(--border-radius)` | `4px` |
| `--transition-duration` | `0.2s` (hardcoded on input/button transitions) | `var(--transition-duration)` | `0.2s` |

### Why

Consumers previously had to override these values with specificity battles against Chota's selectors. Exposing them as custom properties lets consumers override once on `:root` (or any selector) and have the change propagate to every affected component.

### Consumer impact

- **Consumers who do not override:** no visual change. Every token resolves to its previous hardcoded value.
- **Consumers who override:** set the token on `:root` after importing `chota.css`:

```css
@import url(chota.css);

:root {
  --border-radius: 8px; /* rounder corners on cards, inputs, buttons */
}
```

### Note on `.grouped.gapless`

The `.grouped.gapless` first/last child rules use `var(--border-radius)` for their outer corners (preserving `!important`); the inner corners stay `0` because they are joined-border geometry, not a theming knob. Overriding `--border-radius` to `0` squares both standalone buttons and gapless group outer corners consistently.

## `body.dark` Convention

Chota ships **no** `body.dark` rule and **no** default dark palette. `body.dark`
is a consumer convention: a selector the consumer owns, where they override
Chota's custom properties. The consumer supplies both the overrides (which
colors to apply) and the decision of when to apply the class (media query, JS
toggle, stored preference).

A runnable side-by-side example lives at
[`docs/examples/dark-mode.html`](./docs/examples/dark-mode.html), and the
"Customizing" section of the docs site documents the convention in full.

## CSS-Only Interaction Boundary

Chota is CSS-only. It provides visual styling for `.dropdown` and `.tabs` but
does **not** manage behavior:

- `.dropdown` is purely visual (`position: relative` + absolute last child).
  Native `<details>`/`<summary>` supplies the disclosure behavior (Tab focus,
  Enter/Space toggle) — that is browser-native, not Chota-provided.
- `.tabs` is visual navigation links, not an ARIA Tabs widget.

Chota does not manage ARIA state, focus traps, menu keyboard interaction, or
tab-panel semantics. Consumers building interactive widgets layer their own
JS and ARIA on top of Chota's visual styles.

## Known Limitations

These are documented limitations of v1, not shipped changes. They are listed
here so consumers can find them before upgrading.

- **WordPress `body.tag` collision with `.tag`.** WordPress adds a `tag`
  class to the page `<body>` on tag archive pages, which collides with
  Chota's `.tag` component selector and can apply Chota's tag styles to the
  whole page. This is a real collision but renaming `.tag` would break
  existing consumers, so v1 preserves the `.tag` public API. A future
  version may consider a prefixed or separately built variant. See
  [#133](https://github.com/jenil/chota/issues/133) for the full
  disposition.

## Unchanged Behavior

The following are explicitly **not** changed in v1 and require no migration
action:

- `.container`, `.row`, `.col-*`, `.tag`, and `body.dark` public contracts.
- Utility classes and component markup.
- `!important` usage in utilities.
- Em-based typography (`h1`–`h6`, `.tag.is-small`/`.is-large`, `.nav .brand`,
  `code`/`kbd`) — always relative to the body font-size, which remains 16px.
- The 12-column flexbox grid semantics.

## Deferred or Closed Reports

The following community reports were investigated during v1 development and
closed without a shipped fix. They are listed here so consumers searching the
issue tracker can find the disposition. None of these appear in the shipped
change list above.

- [#77](https://github.com/jenil/chota/issues/77) — WordPress `body.tag`
  collision. Closed out-of-scope; see Known Limitations above.
- [#102](https://github.com/jenil/chota/issues/102) — mobile grid overflow.
  Validated under the v1 support matrix; no v1 fix shipped.
- [#111](https://github.com/jenil/chota/issues/111) — full-height nav logo.
  Validated; the existing opt-in behavior works as documented.
- [#61](https://github.com/jenil/chota/issues/61) — spacing utilities.
  Validated; utilities deliver their documented semantics.
