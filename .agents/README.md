# Compound Engineering For Codex

This `.agents` tree is the Codex-native port of the `compound-engineering` plugin. The canonical surface lives here in the workspace and should be treated as the source of truth for this repo.

## Canonical Workflows

Use the `compound-engineering-*` workflow files as the primary command surface:

- `compound-engineering-plan.md`
- `compound-engineering-work.md`
- `compound-engineering-review.md`
- `compound-engineering-discover.md`
- `compound-engineering-consolidate.md`
- `compound-engineering-ship.md`
- `compound-engineering-harness.md`
- `compound-engineering-linear_context.md`
- `compound-engineering-strategic-plan.md`
- `compound-engineering-reason.md`
- `compound-engineering-explore-subsystem.md`
- `compound-engineering-chain.md`

Legacy `compound-*.md` workflow files are compatibility aliases only. Prefer the `compound-engineering-*` versions when editing or debugging behavior.

## Phase Model

The intended execution model is explicit and phase-separated:

1. `plan`
2. `work`
3. `review`
4. `discover`
5. `consolidate`
6. `ship`

For queued Linear execution, the harness runs issue-by-issue with this operating flow:

`linear-context -> plan -> work -> review -> ship`

Periodic `discover` runs are triggered by harness cadence across completed issues. `consolidate` remains a user-approved follow-up phase rather than an automatic harness step.

## Local State

Codex does not provide the Claude hook model, so local state is stored in:

`compound-state/compound-engineering/`

Important files:

- `work-chain-state.local.json`
- `harness-state.local.json`
- `reasoning/`

These files are machine-local execution state, not portable project knowledge.

## Local References

Shared methodology used by the compound-engineering skills lives at:

`/Users/bruhn/.codex/worktrees/a7a7/mberto-compound/.agents/references/compounding-methodology.md`

Prefer that shared reference over stale references to plugin-internal `references/` folders.
