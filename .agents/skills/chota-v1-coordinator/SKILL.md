---
name: chota-v1-coordinator
description: Coordinate, delegate, review, and complete one Chota v1 GitHub card with bounded scope, reproducible evidence, and safe v1 integration. Use for Chota v1 card investigation, junior-agent handoffs, PR review, validation-only work, project-card status, merge decisions, or release-readiness evidence.
---

# Chota v1 coordinator

Use this skill when coordinating one Chota v1 card from scope through accepted evidence. The coordinator owns the card decision, GitHub state, branch/PR lifecycle, and final review. A worker returns evidence and does not delegate or mutate GitHub.

## Source of truth and guardrails

1. Read `AGENTS.md`, `PLAN.md`, and the complete GitHub card with `gh issue view <number>`.
2. Treat the card body as the detailed scope. Treat `PLAN.md` as sequencing guidance, not live status.
3. Use `gh` for all GitHub interaction. Never infer a check, merge, issue state, or project status.
4. Work one card on one `work/*` or `fix/*` branch targeting `v1`.
5. Never change `.container`, `.row`, `.col-*`, `body.dark`, or another public contract without an explicit approved scope and migration decision.
6. For validation cards, prohibit production CSS changes. A proposed fix gets a separate implementation card.
7. Run typecheck only at the end, immediately before committing, when the repository has an applicable command.

## Gate 0: coordinator brief

Before branching or delegating, return this brief and resolve unknowns:

```text
Card: #<number> — <title>
Outcome: <fix | validation | documentation | release>
Allowed files: <exact paths or bounded patterns>
Protected/excluded files: <exact paths; always include AGENTS.md, PLAN.md, generated reports, and unrelated snapshots>
Dependencies: <cards, branch, toolchain, or owner decisions>
Required reproduction/measurements: <exact commands, browser matrix, viewport matrix, and metrics>
Required acceptance evidence: <card checklist translated into artifacts and exit statuses>
Possible dispositions: <promote | close | defer | blocked>
```

For a shared configuration, workflow, package, build, or test-runner change, add an impact matrix before approval:

```text
Changed file | Existing consumers | New behavior | Preserved behavior | Proof command/evidence
```

Do not create a branch, delegate, commit, push, PR, issue comment, board change, merge, or owner-approval claim before the brief is accepted by the owner/coordinator.

## Delegating a junior worker

Before delegation:

- Move the project card to `In Progress`.
- Create or provide one clean branch from current `origin/v1`.
- Give the worker exact allowed files, protected files, non-goals, commands, and handoff fields.
- State that the worker may not delegate, commit, push, open/close/comment on GitHub, alter the board, or claim owner approval.

Use this handoff shape:

```text
You are the worker for Chota v1 card #<number>.

Scope: <one bounded outcome>
Allowed files: <exact list>
Protected files: AGENTS.md, PLAN.md, generated reports, unrelated snapshots, and unrelated source/configuration.
Non-goals: <explicit exclusions>

Required proof:
- base SHA and branch
- OS, browser/version, Node/Yarn version, viewport/device settings
- exact commands and exit statuses
- measured values and artifact paths
- changed-file list and diff against origin/v1
- unresolved risk and recommendation

Do not substitute prose, a screenshot, or a green unrelated workflow for evidence.
Stop for dependency, public API, browser-policy, scope, or non-reproducible-environment decisions.
Return evidence only; do not change GitHub state.
```

## Evidence integrity

Accept a result only when the exact artifact and command prove it.

- Record commit SHA, base SHA, branch, OS, browser/version, runtime/tool versions, viewport/device settings, command, exit status, and artifact path.
- Build and test the checked-in `dist/` from the recorded commit when runtime CSS is under review.
- A screenshot is evidence, not VRT, unless a test asserts it against a named baseline. Do not call screenshot capture a passing VRT test.
- For layout claims, record viewport width, document scroll width, first overflowing element when present, computed styles, and the causal selector/rule.
- For CSS/API claims, identify exact selectors/properties and prove unaffected public behavior remains intact.
- If a command cannot run, report `BLOCKED` and the exact error. Never convert an environment failure into a pass.
- Require negative demonstrations where the card promises detection: deliberate selector removal, visual change, size overage, a11y violation, or fixture failure.
- Reject stale status, hand-typed measurements, placeholder artifacts, unrelated successful workflows, and unreviewed snapshots.

## Review before handoff

Inspect the worker output and the actual branch; do not trust the report.

1. Run `git diff --stat origin/v1...HEAD`, `git diff --name-status origin/v1...HEAD`, and `git diff --check`.
2. Reject every file outside the approved scope, especially `AGENTS.md`, `PLAN.md`, generated reports, and unrelated snapshots.
3. Confirm every card checklist item against command output, fixture markup, browser/version, viewport, measured values, and artifacts.
4. Verify the command actually runs the intended test. A screenshot written to disk is not a screenshot assertion.
5. For CI evidence, inspect the relevant PR quality-gate run and required step; an unrelated green workflow is not evidence.
6. Check public API, source/dist agreement, size impact, VRT/a11y impact, and compatibility risk where relevant.
7. Record unresolved risk explicitly. Do not silently broaden the conclusion.

## Reusing an existing PR branch

When the owner requires reuse of an open PR:

1. Inspect the live PR with `gh pr view <number>` and identify contaminated commits/files.
2. Fetch current `origin/v1` and preserve a local backup ref before rewriting history.
3. Rebase only the intended card commit(s) onto current `origin/v1`.
4. Verify the exact four-way scope with `git diff --stat origin/v1...HEAD` and `git diff --check`.
5. Run the required checks on the rebased commit.
6. Update the PR description so paths, SHA, commands, evidence classification, and disposition are current.
7. Force-push only with `--force-with-lease`, as coordinator, after review.

Never carry staging changes, instructions, generated reports, or unrelated snapshots into the reused PR.

## Validation-card dispositions

End a validation card with exactly one coordinator-reviewable disposition:

- `promote`: create a separate implementation card naming files, bounded fix, regression fixture, API/migration impact, and risk.
- `close`: evidence shows the report is not reproducible or no longer relevant under the declared support policy.
- `defer`: report is real or plausible but outside the current v1 boundary, with a reason and follow-up.
- `blocked`: a required environment or decision is unavailable; preserve the error and keep the card In Progress.

The worker may recommend a disposition. Only the coordinator/owner accepts it and changes GitHub state.

## Completion and GitHub lifecycle

A card is not Done because code exists, a branch is clean, or a worker says “ready.”

1. Required checks and card evidence pass review.
2. The PR targets `v1`, contains only intended changes, and required CI is green.
3. Merge the approved PR into `v1`; record the merge SHA.
4. Update the card with changed files, commands/exit statuses, artifacts, disposition, risk, PR URL, and merge SHA.
5. Update the tracking issue when the card contributes release evidence.
6. Close or defer related reports only when the coordinator’s evidence supports it.
7. Set the project card to `Done` only after evidence is attached and the merge/disposition is recorded.

Required final handoff:

```text
Card/PR:
Outcome and disposition:
Changed files:
Base SHA / validation SHA / merge SHA:
Commands and exit statuses:
CI run and required step:
Browser/OS/viewport matrix:
Artifacts:
API/source/dist/size/VRT/a11y impact:
Unresolved risk:
Owner/coordinator decision:
```
