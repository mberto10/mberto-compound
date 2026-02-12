#!/bin/bash
# Strict markdown schema validator for continuous-compound.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/runtime-config.sh"
source "$SCRIPT_DIR/local-store.sh"

errors=()

add_error() {
  errors+=("$1")
}

if ! local_program_exists; then
  add_error "Program directory does not exist: $CC_PROGRAM_DIR"
fi

for required in $(local_required_files); do
  if [ ! -f "$required" ]; then
    add_error "Missing required file: $required"
  fi
done

if [ -f "$(local_program_tasks_path)" ]; then
  current_count="$(local_count_current_tasks)"
  if [ "$current_count" -ne 1 ]; then
    add_error "tasks.md must contain exactly one current task marker [>]; found $current_count"
  fi

  invalid_marker_lines="$(local_invalid_task_marker_lines)"
  if [ -n "$invalid_marker_lines" ]; then
    add_error "tasks.md contains invalid task markers; allowed markers are [ ], [>], [x], [!]"
  fi
fi

if [ -f "$(local_program_status_path)" ]; then
  if ! local_status_has_key "Current"; then
    add_error "status.md missing required key: Current:"
  fi
  if ! local_status_has_key "Next"; then
    add_error "status.md missing required key: Next:"
  fi
  if ! local_status_has_key "Blocked"; then
    add_error "status.md missing required key: Blocked:"
  fi
fi

warnings_json='[]'
if [ -n "${CC_DEPRECATED_ENV_WARNINGS:-}" ]; then
  warnings_json=$(printf '%s\n' "$CC_DEPRECATED_ENV_WARNINGS" | sed '/^$/d' | jq -R . | jq -s .)
fi

errors_json='[]'
if [ "${#errors[@]}" -gt 0 ]; then
  errors_json=$(printf '%s\n' "${errors[@]}" | jq -R . | jq -s .)
fi

if [ "${#errors[@]}" -eq 0 ]; then
  jq -n \
    --arg program "$CC_PROGRAM_NAME" \
    --arg program_dir "$CC_PROGRAM_DIR" \
    --argjson warnings "$warnings_json" \
    '{valid: true, program: $program, program_dir: $program_dir, warnings: $warnings, errors: []}'
else
  jq -n \
    --arg program "$CC_PROGRAM_NAME" \
    --arg program_dir "$CC_PROGRAM_DIR" \
    --argjson warnings "$warnings_json" \
    --argjson errors "$errors_json" \
    '{valid: false, program: $program, program_dir: $program_dir, warnings: $warnings, errors: $errors}'
fi
