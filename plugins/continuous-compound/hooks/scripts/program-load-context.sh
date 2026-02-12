#!/bin/bash
# SessionStart hook: load markdown program context.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/runtime-config.sh"
source "$SCRIPT_DIR/local-store.sh"

emit_context() {
  local context="$1"
  local escaped
  escaped=$(echo "$context" | jq -Rs '.')

  cat << EOF_JSON
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $escaped
  }
}
EOF_JSON
}

render_warning_block() {
  local validation_json="$1"
  local warnings count
  warnings=$(echo "$validation_json" | jq -r '.warnings[]?' 2>/dev/null || true)
  count=$(echo "$validation_json" | jq -r '.warnings | length' 2>/dev/null || echo 0)

  if [ "$count" -eq 0 ]; then
    return 0
  fi

  cat << EOF_WARN
## Migration Warnings

$warnings

---
EOF_WARN
}

validation_json="$(bash "$SCRIPT_DIR/program-validate.sh")"
valid="$(echo "$validation_json" | jq -r '.valid')"

if [ "$valid" != "true" ]; then
  errors=$(echo "$validation_json" | jq -r '.errors[]' 2>/dev/null || true)
  warning_block="$(render_warning_block "$validation_json")"

  emit_context "# Program Context Validation Failed

$warning_block
Program: $CC_PROGRAM_NAME
Program Directory: $CC_PROGRAM_DIR

The markdown contract is invalid. Fix these issues before continuing:

$errors

Required files:
- contract.md
- tasks.md
- status.md

Strict rules:
- tasks.md must have exactly one [>] current task
- allowed task markers are [ ], [>], [x], [!]
- status.md must contain Current:, Next:, Blocked:"
  exit 0
fi

contract="$(local_read_contract)"
status="$(local_read_status)"
current_tasks="$(local_get_current_task_lines)"
pending_tasks="$(local_get_pending_task_lines)"
blocked_tasks="$(local_get_blocked_task_lines)"
done_tasks="$(local_get_done_task_lines)"
latest_handoff_path="$(local_get_latest_handoff_path)"
latest_handoff_excerpt="$(local_get_latest_handoff_excerpt)"

current_count=$(echo "$current_tasks" | sed '/^$/d' | wc -l | tr -d ' ')
pending_count=$(echo "$pending_tasks" | sed '/^$/d' | wc -l | tr -d ' ')
blocked_count=$(echo "$blocked_tasks" | sed '/^$/d' | wc -l | tr -d ' ')
done_count=$(echo "$done_tasks" | sed '/^$/d' | wc -l | tr -d ' ')

if [ -z "$latest_handoff_excerpt" ]; then
  latest_handoff_excerpt="No handoff recorded yet."
fi

warning_block="$(render_warning_block "$validation_json")"

emit_context "# Program Context (Auto-Loaded)

$warning_block
Program: $CC_PROGRAM_NAME
Program Directory: $CC_PROGRAM_DIR
Runtime: markdown-only

## Contract (contract.md)

$contract

## Status (status.md)

$status

## Task Snapshot (tasks.md)

Current ($current_count):
$current_tasks

Pending ($pending_count):
$pending_tasks

Blocked ($blocked_count):
$blocked_tasks

Done ($done_count):
$done_tasks

## Latest Handoff

Path: ${latest_handoff_path:-none}

$latest_handoff_excerpt

---

## CRITICAL: Execution Rules

- Work the single current task [>] until complete or blocked.
- Update tasks.md/status.md manually; hooks do not auto-advance tasks.
- Preserve strict markers: [ ], [>], [x], [!].
- Use [MILESTONE_COMPLETE: <name>] and [PROJECT_COMPLETE] markers when applicable.
- Prefer /clear over /compact to reload full markdown context."
