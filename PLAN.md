# Chota v1.0 upgrade plan

## Goal and boundaries

Ship `chota@1.0.0` as a small, CSS-first framework with a reproducible build, declared browser support, meaningful regression coverage, verified compatibility decisions, and safe upgrade documentation.

Keep the existing `.container`, `.row`, `.col-*`, `.tag`, and `body.dark` contracts unless an approved migration decision says otherwise.

Not v1 scope: grid redesign, behavior-heavy components (modals/toasts), a custom-build application, ESM/CJS wrappers, addon platform, or treating every historical GitHub issue as a release commitment.

The GitHub Project is the live queue. GitHub issue cards contain implementation procedure, file scope, test cases, and handoff evidence; this document controls sequencing and release gates.

### Cross-references

- Live tracking issue: [#121](https://github.com/jenil/chota/issues/121) — the source of truth for integration-branch readiness, evidence links, sequencing, and release gates. This issue is updated in sync with plan.md and the GitHub Project board.
- GitHub Project #2 ("Chota v1.0") — the live queue. Issue cards contain implementation procedure, file scope, test cases, and handoff evidence.
- Current integration branch: `v1`. Use the tracking issue and project board for live commit and card status rather than recording short-lived SHAs here.

## Branch and review policy

- `v1` is the sole long-lived integration branch. Do not merge v1 implementation work to `main` until the owner-approved release PR from `v1` to `main`.
- Create one short-lived branch per card from current `v1`, targeting `v1` in its PR. Use `work/*` or `fix/*`; never `v1/*`, because Git cannot hold both `v1` and `v1/...` branches.
- One card per branch and PR. Do not mix dependency updates, CSS behavior changes, and documentation cleanup unless the card explicitly requires them.
- The coordinator owns branch creation, commits, PRs, merges, board status, and GitHub issue updates. Workers return evidence only.
- Regenerate and inspect `dist/` whenever source CSS changes. Run typechecking only at the end, immediately before committing, if the repository has an applicable command.
- Owner review is required for public CSS API changes, VRT baseline updates, size-budget exceptions, release work, and any scope/API decision.

### Card lifecycle

1. Pick only a **Ready** card from the order below; move it to **In Progress**.
2. Implement the card's bounded scope and run its required checks.
3. Self-review against `v1`; include source/dist, public API, docs, VRT/a11y, and size impact where relevant.
4. Obtain the required review and open a PR to `v1`.
5. Merge only with green required checks. Attach the PR and evidence to the card, then mark it **Done**.

A card is not Done because code exists, a branch merged, or an artifact was created. It is Done only with the evidence required by its GitHub card. A failed check or review returns it to **In Progress** (not **Ready** or **Todo**) — the coordinator re-evaluates whether the card is still viable, still blocked, or should be cancelled.

**Subagent delegation rule:** When delegating a card to a subagent, the coordinator must first move the card to **In Progress** on the project board. The card remains In Progress while the subagent executes, and is only moved to **Done** (or back to **In Progress** on failure) when the subagent completes or fails. This ensures the project board accurately reflects active work at all times — never leave a card as "Ready" while a subagent is executing on it.

**Failure path:** When a card fails (test, review, or evidence check), the coordinator moves it to **In Progress**, evaluates whether to retry, re-scope, or cancel, then either re-delegates or removes it from the board. Cards are never silently abandoned.

### Agent handoff

Every worker brief must name: card/outcome, allowed files, protected public API, non-goals, exact verification commands, required fixture/VRT/a11y coverage, and required handoff evidence. A worker stops for a coordinator decision if the task needs a package-manager/dependency choice, a public API break, a browser-policy exception, or a non-reproducible issue.

## Completion evidence

| Status | Meaning |
|---|---|
| Todo | Not started; prerequisites may still be missing. |
| In Progress | One owner is actively executing the bounded card. |
| Review | Required checks and card evidence exist; review/approval is pending. |
| Done | Merged to `v1` with required evidence, linked PR, and any follow-up decision recorded. |

Evidence must be real and current: commands and exit status, commit SHA, test/VRT/a11y artifacts, current measurements, and owner approval where required. Placeholder data, stale dates, or a claimed result without reproducible output are not evidence.

## Execution order

| Week | Order | Cards | Gate |
|---|---:|---|---|
| 1 | 1 | #121 tracking, #122 support policy, #123 Yarn toolchain, #126 architecture/workflow | #121 is coordinator-owned; the others may run independently. |
| 1 | 2 | #125 release baselines, #128 dependency policy | #125 depends on #123; #128 is independent. |
| 1 | 3 | #127 portable size gate | Requires #123 and #125. |
| 2 | 1 | #129 CI, #124 Chromium VRT, #130 a11y baseline, #131 CSS API contract | Requires verified Week 1 evidence. |
| 2 | 2 | #132 validate #102 (mobile grid overflow) | Validation only; create a separate fix card after reproduction and decision. |
| 2 | 2 | #134 validate #111 (full-height nav logo) | Validation only; create a separate fix card after reproduction and decision. |
| 2 | 2 | #135 validate #114 (grouped controls) | Validation only; create a separate fix card after reproduction and decision. |
| 2 | 2 | #136 validate #61 (spacing utilities) | Validation only; create a separate fix card after reproduction and decision. |
| 2 | 3 | #177 harden regression coverage | Test-harness only; must land before shared CSS migrations. |
| 2 | 3 | #172 nav-logo baseline cleanup, #173 snapshot layout normalization | Test-harness follow-ups to #134/#177; no production CSS or public API change. |
| 2 | 3 | #180 full-page and per-section docs-page VRT coverage | Test-harness card; must land before #137/#138 shared CSS migrations. |
| 3 | 1 | #139 focus, #140 dark-mode docs, #141 interaction docs | #139 uses #130 findings; #140/#141 can run independently. |
| 3 | 2 | #137 root-font migration, #138 token normalization | #137 needs #124 (VRT) and #131 (API contract); avoid concurrent edits to shared base/token CSS. |
| 3 | 3 | #142 migration/API docs | Requires #137 and #138 completion; verifies against current source and built dist/. |
| 4 | 1 | #143 RC readiness, #144 RC validation | Feature scope is frozen except owner-approved release blockers. |
| 4 | 2 | #145 final release, #146 post-v1 roadmap | #145 is the sole `v1` to `main` integration path. |

**Parallelism guidance:** Cards within the same Week are independent unless a dependency is explicitly noted. They may run in parallel (separate branches, separate PRs) or sequentially — the choice is a coordinator decision. Parallel execution saves time but increases merge conflict risk on shared files (e.g., base CSS, package.json). Sequential execution is safer for shared files.

## Current Progress (Updated 2026-07-30)

### Week 1 — COMPLETE (6/6 cards)
- ✅ #122 publish browser support policy
- ✅ #123 standardize Yarn toolchain
- ✅ #125 capture release baselines (3310 bytes gzip)
- ✅ #126 document architecture/workflow
- ✅ #127 add portable size gate
- ✅ #128 configure dependency maintenance policy

### Week 2 — COMPLETE (12/12 cards)
- ✅ #129 add pull request CI quality gate (PR #153)
- ✅ #124 establish Chromium VRT (PR #154, 4 baseline screenshots)
- ✅ #130 establish a11y baseline (axe-core, 9 real violations documented)
- ✅ #131 add CSS public API contract (185 selectors, 14 custom properties)
- ✅ #132 validate #102 (mobile grid overflow)
- ✅ #134 validate #111 (full-height nav logo)
- ✅ #135 validate #114 (grouped controls)
- ✅ #136 validate #61 (spacing utilities; computed-style regression coverage)
- ✅ #177 harden regression coverage (PR #178, behavioral assertions only)
- ✅ #172 clean up duplicate nav-logo baselines (follow-up to #134)
- ✅ #173 normalize Chromium snapshot layout and platform policy (PR #175)
- ✅ #180 full-page and per-section docs-page VRT coverage (PR #181, merge `39659b8`)

#133 (validate #77, WordPress tag collision) was investigated and closed out-of-scope: the `.tag` public API is preserved and no v1 fix is shipped. It is marked Done on the board as a closed validation, but is not counted in the plan total below.

### Weeks 3–4 — IN PROGRESS (5/9 cards)
- ✅ #139 restore visible keyboard focus (PR #182, merge `78fbcf4`)
- ✅ #140 document dark-mode convention (PR #184, merge `9ceb770`)
- ✅ #141 document interaction boundaries (PR #183, merge `3e1f65e`)
- ✅ #137 migrate root font sizing (PR #188, merge `9b9aee0`)
- ✅ #138 normalize design tokens (PR #189, merge `3efaa00`)
- ⏳ #142 write migration guide
- ⏳ #143 prepare RC package
- ⏳ #144 run RC validation
- ⏳ #145 publish chota 1.0.0
- ⏳ #146 create post-v1 roadmap

### Summary
- **Total cards:** 28 (excludes coordinator #121; #133 is a closed out-of-scope validation, marked Done on the board but not counted here)
- **Completed:** 23 (82%) — 6 Week 1 + 12 Week 2 + 5 Week 3
- **Closed out-of-scope:** 1 (#133)
- **Week 1:** 6/6 (100%)
- **Week 2:** 12/12 (100%)
- **Week 3:** 5/6 (83%)
- **Week 4:** 0/4 (0%)

## Week 1 — contract and reproducible build

### Outcome

Publish the support contract, prove the documented toolchain works from a clean checkout, record trustworthy baselines, make the size gate portable, and document the current architecture/workflow.

### Entry/exit gate

Week 2 cannot start merely because Week 1 cards say Done. The owner must confirm all of the following:

- Published support policy agrees exactly with checked-in `browserslist`.
- A clean checkout installs, lints, and builds using the documented package-manager command.
- Gzip and browser-support baselines are measured from current `v1` output with current capture metadata. A11y and VRT baselines begin in Week 2.
- The portable size gate passes at the recorded budget and fails for a deliberate oversize artifact.
- Architecture/workflow and dependency-policy documentation match reality.

## Week 2 — automated confidence and compatibility decisions

### Outcome

Run CI, Chromium VRT, accessibility baseline checks, and public CSS API checks on the same reproducible build. Use the resulting harness to investigate selected compatibility reports.

### Guardrails

- No public class rename or removal without a reviewed deprecation/migration path.
- No breaking change to `.container`, `.row`, `.col-*`, or `body.dark`.
- No new components or layout systems.
- Firefox and Playwright WebKit are functional/a11y smoke coverage, not pixel-baseline browsers; manually check Safari 15.4+ during RC.

### Gate

Before a compatibility fix merges, CI must demonstrate that it can catch a selector removal, a meaningful visual change, and a size regression. #132–#136 decide whether a report is reproducible and v1-worthy; they do not ship a fix themselves.

### Week 2 exit gate

Week 3 cannot start merely because Week 2 cards say Done. The owner must confirm all of the following:

- CI workflow (`.github/workflows/ci.yml`) runs install, lint, build, API contract, VRT, and a11y steps on PRs targeting `v1`.
- VRT baseline screenshots are committed and pass locally (`npx playwright test` green).
- a11y baseline reports exist with real findings (not placeholders), dispositions linked to implementation cards.
- CSS API contract test passes (`yarn test:api` green) with a reviewed `test/vrt/api-manifest.json`.
- Deliberate failure demonstrations prove the CI pipeline catches: selector removal, visual regression, size regression, and a11y violations.
- All Week 2 evidence is attached to its GitHub card and the card is marked Done on the project board.

### Coverage audit and hardening follow-up

The Week 2 audit found a sound CI backbone, but not complete regression coverage. #177 must complete before #137 or #138 changes shared CSS. It must:

- decide whether the #132 mobile-grid and #135 grouped-controls specs join the shared `test:vrt` script; any script change requires an impact matrix covering CI consumers and a proof command;
- convert direct `page.screenshot({ path })` artifacts into named screenshot assertions when a visual baseline is intended, or reclassify/remove them rather than calling them VRT;
- add the smallest focused coverage for the protected `body.dark` convention and responsive boundaries at 480/481, 599/600, 899/900, and 1199/1200 pixels;
- keep screenshot VRT, API, and a11y suites Chromium-pinned. Firefox and WebKit remain functional smoke coverage.

This is a test-harness hardening card, not a product CSS change. It closes the gaps exposed by the audit without reopening completed Week 2 validation decisions.

## Week 3 — safe API and documentation improvements

### Outcome

Ship the selected root-font, token, focus, dark-mode, interaction-boundary, and migration/documentation work only after the Week 2 baseline and issue decisions are stable.

### Entry sequence

1. Complete #177 before #137 or #138.
2. Run #139 with real Tab traversal and visible-focus checks on each affected fixture; use #130 findings as the starting point.
3. Run #140 and verify the documented `body.dark` convention with the new focused test; #141 may run independently.
4. Run #137 and #138 sequentially, then #142 against current source and built `dist/`.

### Guardrails

- Keep `!important` in utilities unless a demonstrated consumer override problem justifies change.
- Change only existing hardcoded values that are genuine customization points; do not promise runtime-configurable media-query breakpoints.
- `body.dark` is a consumer convention for overriding variables, not a library-provided dark theme.
- Chota remains CSS-only: it does not manage ARIA state, focus traps, menus, modal behavior, or tab-panel keyboard interaction.
- Do not change root font sizing except through the approved #137 migration, which must preserve the documented 16px-root visual intent and explain consumer-root-relative `rem` values.

### Gate

Docs and migration examples must be verified against current source and built `dist/`. Do not document an unimplemented issue resolution or an API that does not exist.

## Week 4 — release candidate and release

### Outcome

Freeze feature work, validate a specific candidate commit, collect three business days of RC feedback, then release through one owner-approved `v1` to `main` PR.

### Gate

Before RC publication, a fresh checkout of the candidate must pass documented install, lint, build, API contract, VRT, a11y, smoke, and gzip checks; package contents must be reviewed with `npm pack --dry-run`. Record disposition for every remaining v1-relevant issue.

Before final release, record RC feedback (including an explicit no-feedback result if applicable), complete the manual Safari 15.4+ pass, and obtain owner go approval. Do not publish, tag, merge to `main`, or alter npm access without that approval.

After publication, verify the exact version on npm, unpkg, and jsDelivr. Use #146 only for evidenced post-v1 work; historical issues are candidates, not commitments.

## Definition of done

Chota v1 is done when `v1` has merged its approved work, the final `v1` to `main` release PR is owner-approved, the published `1.0.0` package matches its reviewed candidate, required validation is recorded, and the docs let 0.9.x users upgrade safely without turning Chota into a JavaScript UI library.
