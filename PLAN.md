# Chota v1.0 upgrade plan

## Goal and boundaries

Ship `chota@1.0.0` as a small, CSS-first framework with a reproducible build, declared browser support, meaningful regression coverage, verified compatibility decisions, and safe upgrade documentation.

Keep the existing `.container`, `.row`, `.col-*`, `.tag`, and `body.dark` contracts unless an approved migration decision says otherwise.

Not v1 scope: grid redesign, behavior-heavy components (modals/toasts), a custom-build application, ESM/CJS wrappers, addon platform, or treating every historical GitHub issue as a release commitment.

The GitHub Project is the live queue. GitHub issue cards contain implementation procedure, file scope, test cases, and handoff evidence; this document controls sequencing and release gates.

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

A card is not Done because code exists, a branch merged, or an artifact was created. It is Done only with the evidence required by its GitHub card. A failed check or review returns it to In Progress.

**Subagent delegation rule:** When delegating a card to a subagent, the coordinator must first move the card to **In Progress** on the project board. The card remains In Progress while the subagent executes, and is only moved to **Done** (or back to **Ready** on failure) when the subagent completes or fails. This ensures the project board accurately reflects active work at all times — never leave a card as "Ready" while a subagent is executing on it.

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
| 2 | 2 | #132–#136 issue validation | Validation only; create a separate fix card only after reproduction and decision. |
| 3 | 1 | #139 focus, #140 dark-mode docs, #141 interaction docs | #139 uses #130 findings; #140/#141 can run independently. |
| 3 | 2 | #137 root-font migration, #138 token normalization | #137 needs #124; avoid concurrent edits to shared base/token CSS. |
| 3 | 3 | #142 migration/API docs | Requires final Week 3 API and issue decisions. |
| 4 | 1 | #143 RC readiness, #144 RC validation | Feature scope is frozen except owner-approved release blockers. |
| 4 | 2 | #145 final release, #146 post-v1 roadmap | #145 is the sole `v1` to `main` integration path. |

## Current Progress (Updated 2026-07-26)

### Week 1 — COMPLETE (6/6 cards)
- ✅ #122 publish browser support policy
- ✅ #123 standardize Yarn toolchain
- ✅ #125 capture release baselines (3310 bytes gzip)
- ✅ #126 document architecture/workflow
- ✅ #127 add portable size gate
- ✅ #128 configure dependency maintenance policy

### Week 2 — IN PROGRESS (3/10 cards)
- ✅ #129 add pull request CI quality gate (PR #153)
- ✅ #124 establish Chromium VRT (PR #154, 4 baseline screenshots)
- ✅ #130 establish a11y baseline (axe-core, 9 real violations documented)
- ✅ #131 add CSS public API contract (185 selectors, 14 custom properties)
- ⏳ #132 validate #102 (mobile grid overflow)
- ⏳ #133 validate #77 (WordPress tag collision)
- ⏳ #134 validate #111 (full-height nav logo)
- ⏳ #135 validate #114 (grouped controls)
- ⏳ #136 validate #61 (spacing utilities)

### Weeks 3–4 — NOT STARTED (0/10 cards)
- ⏳ #139 restore visible keyboard focus
- ⏳ #140 document dark-mode convention
- ⏳ #141 document interaction boundaries
- ⏳ #137 migrate root font sizing
- ⏳ #138 normalize design tokens
- ⏳ #142 write migration guide
- ⏳ #143 prepare RC package
- ⏳ #144 run RC validation
- ⏳ #145 publish chota 1.0.0
- ⏳ #146 create post-v1 roadmap

### Summary
- **Total cards:** 26
- **Completed:** 9 (35%)
- **Week 1:** 6/6 (100%)
- **Week 2:** 3/10 (30%)
- **Week 3:** 0/6 (0%)
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

## Week 3 — safe API and documentation improvements

### Outcome

Ship the selected root-font, token, focus, dark-mode, interaction-boundary, and migration/documentation work only after the Week 2 baseline and issue decisions are stable.

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
