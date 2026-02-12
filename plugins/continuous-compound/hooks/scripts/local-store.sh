#!/bin/bash
# Local markdown storage helpers for continuous-compound.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/runtime-config.sh"

local_program_contract_path() {
  echo "$CC_PROGRAM_DIR/contract.md"
}

local_program_tasks_path() {
  echo "$CC_PROGRAM_DIR/tasks.md"
}

local_program_status_path() {
  echo "$CC_PROGRAM_DIR/status.md"
}

local_program_handoffs_dir() {
  echo "$CC_PROGRAM_DIR/handoffs"
}

local_program_evidence_dir() {
  echo "$CC_PROGRAM_DIR/evidence"
}

local_program_exists() {
  [ -d "$CC_PROGRAM_DIR" ]
}

local_required_files() {
  echo "$(local_program_contract_path)"
  echo "$(local_program_tasks_path)"
  echo "$(local_program_status_path)"
}

local_read_contract() {
  cat "$(local_program_contract_path)"
}

local_read_tasks() {
  cat "$(local_program_tasks_path)"
}

local_read_status() {
  cat "$(local_program_status_path)"
}

local_task_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[( |>|x|!)\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_invalid_task_marker_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[[^ >x!]\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_get_current_task_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[>\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_get_pending_task_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[[[:space:]]\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_get_done_task_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[x\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_get_blocked_task_lines() {
  grep -E '^[[:space:]]*[-*][[:space:]]*\[!\][[:space:]]+' "$(local_program_tasks_path)" || true
}

local_count_current_tasks() {
  local lines
  lines="$(local_get_current_task_lines)"
  if [ -z "$lines" ]; then
    echo 0
  else
    echo "$lines" | sed '/^$/d' | wc -l | tr -d ' '
  fi
}

local_status_has_key() {
  local key="$1"
  grep -Eq "^[[:space:]]*${key}:[[:space:]]*" "$(local_program_status_path)"
}

local_status_value() {
  local key="$1"
  grep -E "^[[:space:]]*${key}:[[:space:]]*" "$(local_program_status_path)" | head -1 | sed -E "s/^[[:space:]]*${key}:[[:space:]]*//"
}

local_get_latest_handoff_path() {
  local handoff_dir
  handoff_dir="$(local_program_handoffs_dir)"
  if [ -d "$handoff_dir" ]; then
    ls -1t "$handoff_dir"/*.md 2>/dev/null | head -1
  fi
}

local_get_latest_handoff_excerpt() {
  local path
  path="$(local_get_latest_handoff_path)"
  if [ -n "$path" ] && [ -f "$path" ]; then
    head -c 2000 "$path"
  fi
}

local_write_handoff() {
  local body="$1"
  local handoff_dir timestamp path
  handoff_dir="$(local_program_handoffs_dir)"
  mkdir -p "$handoff_dir"
  timestamp="$(date +"%Y-%m-%d-%H%M%S")"
  path="$handoff_dir/handoff-$timestamp.md"
  printf "%s\n" "$body" > "$path"
  echo "$path"
}

local_append_status_handoff() {
  local handoff_path="$1"
  local status_file timestamp
  status_file="$(local_program_status_path)"
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  cat >> "$status_file" << EOF_STATUS

---
Last Handoff: $timestamp
Handoff File: $handoff_path
EOF_STATUS
}
