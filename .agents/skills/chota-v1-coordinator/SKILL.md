---
name: chota-v1-phased-execution
description: Progress one Chota v1 card through small, evidence-gated phases with bounded scope and safe v1 integration. Use for card investigation, validation-only work, PR review, project-card status, merge decisions, or release-readiness evidence.
---

# Chota v1 phased execution

Use this skill to progress one Chota v1 card through short phases. Complete each phase with recorded evidence before moving to the next. Stop and report a blocker instead of filling a gap with an assumption.

## Source of truth and guardrails

1. Read `AGENTS.md`, `PLAN.md`, and the complete GitHub card with `gh issue view <number>`.
2. Treat the card body as the detailed scope. Treat `PLAN.md` as sequencing guidance, not live status.
3. Use `gh` for all GitHub interaction. Never infer a check, merge, issue state, or project status.
4. Work one card on one `work/*` or `fix/*` branch targeting `v1`.
5. Never change `.container`, `.row`, `.col-*`, `body.dark`, or another public contract without an explicit approved scope and migration decision.
6. For validation cards, prohibit production CSS changes. A proposed fix gets a separate implementation card.
7. Run typecheck only at the end, immediately before committing, when the repository has an applicable command.

## Phase 0: approved brief

Before branching, return this brief and resolve unknowns:

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

For a shared configuration, workflow, package, build, or test-runner change, add an owner-approved impact matrix:

```text
Changed file | Existing consumers | New behavior | Preserved behavior | Proof command/evidence
```

Do not create a branch, commit, push, PR, issue comment, board change, merge, or owner-approval claim before the brief is accepted by the owner.

## Phased progress

1. **Inspect:** read the brief, record branch/base, inventory relevant files, and capture the initial worktree. Do not edit.
2. **Prove:** verify every tool behavior, path mapping, and precondition. Define the command and artifact that will prove each post-change acceptance claim. For cleanup, produce the complete file mapping. Do not make destructive changes.
3. **Execute:** make only the exact operations supported by Phase 2 and allowed by the brief.
4. **Validate:** run the required commands, inspect the current diff, and record actual artifacts and exit statuses.
5. **Hand off:** report what passed, what remains pending, and the next explicit action. Do not call pending CI, an unrun test, or an assumption complete.

If a phase fails, correct it within the approved scope or stop as `BLOCKED`; do not skip to a later phase.

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

## Verified cleanup

Follow the cleanup rules in `AGENTS.md`. For snapshot cleanup, also map before deletion:

```text
assertion or writer -> exact path per supported platform -> on-disk file -> classification
```

Use the test file's full path relative to `testDir`. Classify each file as asserted baseline, current direct-screenshot artifact, or stale. Direct `page.screenshot({ path })` output can be manual visual evidence, but is not a VRT baseline or deliberate-change detection proof.

Evidence outside approved paths may be retained locally or attached to the card, but not committed without explicit approval.

Before requesting commit approval, report current `git status --short`, tracked and untracked files separately, deletion and assertion/baseline/artifact counts, and `git diff --check`. Do not claim no production changes while production files are modified, or `None` risk while required CI is pending.

## Review before handoff

Inspect the actual worktree and branch; do not trust a report without matching evidence.

1. Inspect the current worktree with `git status --short`, `git diff --stat`, `git diff --name-status`, and `git diff --check`. Then run `git diff --stat origin/v1...HEAD` and `git diff --name-status origin/v1...HEAD` for committed branch scope.
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
6. When explicitly authorized by the user in the current message, update the PR description so paths, SHA, commands, evidence classification, and disposition are current.
7. Force-push only with `--force-with-lease` when explicitly authorized by the user in the current message.

Never carry staging changes, instructions, generated reports, or unrelated snapshots into the reused PR.

## Validation-card disposition

End a validation card with exactly one disposition:

- `promote`: create a separate implementation card naming files, bounded fix, regression fixture, API/migration impact, and risk.
- `close`: evidence shows the report is not reproducible or no longer relevant under the declared support policy.
- `defer`: report is real or plausible but outside the current v1 boundary, with a reason and follow-up.
- `blocked`: a required environment or decision is unavailable; preserve the error and keep the card In Progress.

Report the recommended disposition and its evidence. Make a GitHub state change only when explicitly authorized by the user in the current message.

## Completion and GitHub lifecycle

A card is not Done because code exists, a branch is clean, or a report says “ready.”

1. Required checks and card evidence pass review.
2. The PR targets `v1`, contains only intended changes, and required CI is green.
3. When explicitly authorized by the user in the current message, merge the approved PR into `v1`; record the merge SHA.
4. When explicitly authorized by the user in the current message, update the card with changed files, commands/exit statuses, artifacts, disposition, risk, PR URL, and merge SHA.
5. When explicitly authorized by the user in the current message, update the tracking issue when the card contributes release evidence.
6. When explicitly authorized by the user in the current message, close or defer related reports only when the evidence supports it.
7. When explicitly authorized by the user in the current message, set the project card to `Done` only after evidence is attached and the merge/disposition is recorded.

Required final handoff:

```text
Card/PR:
Outcome and disposition:
Changed files:
Worktree status and untracked files:
Base SHA / validation SHA / merge SHA:
Commands and exit statuses:
CI run and required step:
Browser/OS/viewport matrix:
Artifacts:
API/source/dist/size/VRT/a11y impact:
Unresolved risk:
Next action or owner decision:
```
