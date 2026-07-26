# Agent instructions

Read this file first. GitHub actions use `gh` only.

- Work one GitHub card on one `work/*` or `fix/*` branch targeting `v1`; the card body defines scope.
- The designated coordinator may delegate bounded card work to subagents; workers may not delegate further. The coordinator remains responsible for review, GitHub state, and final decisions.
- Inspect the exact diff, command output, or Actions log before reporting a result. Do not guess.
- Do not change GitHub state—comments, issues, board, PRs, merges, pushes, tags, releases, or owner approval—unless the coordinator explicitly requests that action.
- Open a PR only when `git diff --stat origin/v1...HEAD` contains the intended card changes. Workers never approve or merge their own PR.
- For CI evidence, cite the relevant PR quality-gate run and required step; an unrelated successful workflow is not evidence.
- Before handoff, report changed files, commands and exit status, commit SHA, and unresolved risk.
- Run typecheck only at the end, immediately before committing, if the repository has one.
