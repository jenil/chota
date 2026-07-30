# Agent instructions

## GitHub access

When interacting with GitHub, always use `gh` on the command line.

GitHub is read-only unless the coordinator explicitly authorizes one named
write action in the current message. Workers must not run `git push`, merge a
pull request, or use GitHub write commands such as `gh pr merge`, `gh issue
edit`, `gh issue create`, `gh issue close`, or `gh api` mutation requests.

If work requires a GitHub write, stop and report:

`NEEDS COORDINATOR ACTION: <exact action>, <target>, <reason>`

Workers may prepare local commits and report their SHA, diff, and validation
evidence. Only the coordinator pushes branches, opens or merges pull requests,
and updates GitHub issues or workflows.

## Task boundaries

Work on one assigned card only. Do not start implementation without an
owner-approved brief that names allowed files, protected contracts, acceptance
criteria, verification commands, and stop conditions.

Do not expand scope or make a production CSS/API change on a validation card.
If the evidence supports a fix, report the recommended separate implementation
card instead.

## Shared test and CI configuration

Do not change `playwright.config.js`, package test scripts, snapshot naming,
CI workflows, or other shared test configuration without a
coordinator-approved impact matrix covering every consumer, preserved
behavior, and proof command.

Local results are local evidence only. Do not claim CI success unless the
corresponding GitHub Actions check is green. New VRT baselines must use the
project's intentional Chromium snapshot convention and be validated on the CI
platform.

## Compatibility and test contracts

Preserve `.container`, `.row`, `.col-*`, `.tag`, and `body.dark` unless the
brief explicitly authorizes a migration.

`test:vrt`, `test:a11y`, and `test:api` must remain Chromium-pinned.
Firefox/WebKit coverage belongs only in the non-screenshot smoke spec.

A screenshot supplements required behavioral or computed-style assertions; it
does not replace them. A test may claim keyboard behavior only if it performs
the keyboard interaction and asserts the resulting focus target or order.

## Git commits

Always ask the user for permission before running `git commit`. Report the
diff, changed files, and test evidence. Only proceed with the commit after
explicit user approval. This is separate from the GitHub write restriction
below — local commits are a staging step, not a final action.

## Validation

Do not run typecheck until the very end, immediately before committing code.
