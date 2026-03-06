---
name: compound-engineering-commands
description: Use when the user asks to run Claude-style compound-engineering commands in Codex, including /plan, /work, /review, /discover, /consolidate, /explore-subsystem, /strategic-plan, /harness, /reason, /chain, /ship, or /linear-context.
---

# Compound Engineering Commands

Codex-native wrapper surface for compound-engineering command parity.

This skill maps the phase commands to local `.agents/workflows` files and provides a repo-local bridge plus a hookless state runner.

## Command Parity

- `/plan` -> `compound_engineering_bridge.py plan`
- `/work` -> `compound_engineering_bridge.py work`
- `/review` -> `compound_engineering_bridge.py review`
- `/discover` -> `compound_engineering_bridge.py discover`
- `/consolidate` -> `compound_engineering_bridge.py consolidate`
- `/explore-subsystem` -> `compound_engineering_bridge.py explore-subsystem`
- `/strategic-plan` -> `compound_engineering_bridge.py strategic-plan`
- `/harness` -> `compound_engineering_bridge.py harness`
- `/reason` -> `compound_engineering_bridge.py reason`
- `/chain` -> `compound_engineering_bridge.py chain`
- `/ship` -> `compound_engineering_bridge.py ship`
- `/linear-context` -> `compound_engineering_bridge.py linear-context`

See full mapping in `references/command-map.md`.

## Quick Start

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py list
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py plan --args "add retry logic to webhook handler"
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py reason --args "gather --question 'How should we decompose auth migration?' --template migration"
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py linear-context --args "dispatch MB90-1234"
```

## What the Bridge Produces

For each command request the bridge outputs:
- resolved workflow path in `.agents/workflows/compound-engineering-*.md`
- normalized command name and aliases
- a ready-to-paste invocation prompt for Codex

Use `--print-workflow` to also print the full workflow content.

## Automatic State Mode

For `/chain` and `/harness`, the bridge automatically executes the runner intent derived from `--args` (`--state-mode auto`, default).

Examples:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py chain --args "status"
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py chain --args "stop" --json
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "start --project MB90 --max 20 --label ready" --json
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "status" --state-mode only
```

Modes:
- `--state-mode auto` (default): run runner intent + return workflow prompt
- `--state-mode only`: run runner intent only
- `--state-mode off`: skip runner, only route to workflow


## Runner Utilities

Use the hookless runner for Codex-native chain and harness state handling:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py list
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-init
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-advance --event work_complete --json
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-init --project MB90 --label ready --max-iterations 10
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-record --event issue_complete --issue-id MB90-1234 --json
```

## Repo Root Resolution

The bridge resolves the repo root in this order:

1. `--repo-root`
2. `MBERTO_COMPOUND_ROOT`
3. current working directory and parents containing `.agents/workflows/compound-engineering-plan.md`

## Notes

- These wrappers are execution routers, not logic re-implementations.
- `compound_engineering_runner.py` replaces Claude Stop-hook orchestration with explicit state transitions in Codex.
- Workflow source of truth remains in `.agents/workflows/compound-engineering-*.md`.
- The intended issue flow is `linear-context -> plan -> work -> review -> ship`, with periodic discover passes handled by harness cadence.
