# Compound Engineering Command Map

## Claude Commands to Codex Wrapper

| Claude command | Codex wrapper |
|---|---|
| `/plan <change>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py plan --args "<change>"` |
| `/work [plan-ref]` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py work --args "<plan-ref>"` |
| `/review [scope]` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py review --args "<scope>"` |
| `/discover [focus]` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py discover --args "<focus>"` |
| `/consolidate [filter]` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py consolidate --args "<filter>"` |
| `/explore-subsystem <system/subsystem>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py explore-subsystem --args "<system/subsystem>"` |
| `/strategic-plan <vision>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py strategic-plan --args "<vision>"` |
| `/harness <start\|stop\|status ...>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "<flags>"` |
| `/reason <gather\|transform ...>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py reason --args "<flags>"` |
| `/chain <stop\|status>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py chain --args "<action>"` |
| `/ship <linear-issue-id>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py ship --args "<linear-issue-id>"` |
| `/linear-context <project issue>` | `python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py linear-context --args "<project issue>"` |

## Utilities

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py list
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py plan --args "..." --print-workflow
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py plan --args "..." --json
```

## Hookless Runner

```bash
# Chain state
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-init
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-status
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-advance --event work_complete
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-advance --event review_pass
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-stop

# Harness state
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-init --project <project> --label ready --max-iterations 20
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-claim --issue-id <issue-id>
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-record --event issue_complete --issue-id <issue-id>
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-status
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-stop
```

## High-Level Bridge Mode

```bash
# Chain: auto runner intent from --args
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py chain --args "status"
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py chain --args "stop" --json

# Harness: auto runner intent from --args
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "start --project MB90 --label ready --max 20" --json
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "status"

# Modes
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "status" --state-mode only
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_bridge.py harness --args "start --project MB90" --state-mode off
```
