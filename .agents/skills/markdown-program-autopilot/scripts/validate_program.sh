#!/usr/bin/env bash
set -euo pipefail

PROGRAM=""
WORKSPACE="$(pwd)"

usage() {
  cat << USAGE
Usage: $0 --program <name> [--workspace <path>]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --program)
      PROGRAM="${2:-}"
      shift 2
      ;;
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROGRAM" ]]; then
  echo "--program is required" >&2
  usage
  exit 1
fi

PROGRAM_DIR="$WORKSPACE/programs/$PROGRAM"
CONTRACT="$PROGRAM_DIR/contract.md"
TASKS="$PROGRAM_DIR/tasks.md"
STATUS="$PROGRAM_DIR/status.md"

errors=()
warnings=()

add_error() { errors+=("$1"); }
add_warning() { warnings+=("$1"); }

[[ -d "$PROGRAM_DIR" ]] || add_error "Program directory does not exist: $PROGRAM_DIR"
[[ -f "$CONTRACT" ]] || add_error "Missing required file: $CONTRACT"
[[ -f "$TASKS" ]] || add_error "Missing required file: $TASKS"
[[ -f "$STATUS" ]] || add_error "Missing required file: $STATUS"

if [[ -f "$TASKS" ]]; then
  current_count=$(grep -E '^[[:space:]]*[-*][[:space:]]*\[>\][[:space:]]+' "$TASKS" | wc -l | tr -d ' ')
  [[ "$current_count" -eq 1 ]] || add_error "tasks.md must contain exactly one current task marker [>]; found $current_count"

  invalid_markers=$(grep -E '^[[:space:]]*[-*][[:space:]]*\[[^ >x!]\][[:space:]]+' "$TASKS" || true)
  [[ -z "$invalid_markers" ]] || add_error "tasks.md contains invalid task markers; allowed markers are [ ], [>], [x], [!]"

  total_tasks=$(grep -E '^[[:space:]]*[-*][[:space:]]*\[( |>|x|!)\][[:space:]]+' "$TASKS" | wc -l | tr -d ' ')
  [[ "$total_tasks" -gt 0 ]] || add_warning "tasks.md contains no parseable task lines"
fi

if [[ -f "$STATUS" ]]; then
  grep -Eq '^[[:space:]]*Current:[[:space:]]*' "$STATUS" || add_error "status.md missing required key: Current:"
  grep -Eq '^[[:space:]]*Next:[[:space:]]*' "$STATUS" || add_error "status.md missing required key: Next:"
  grep -Eq '^[[:space:]]*Blocked:[[:space:]]*' "$STATUS" || add_error "status.md missing required key: Blocked:"
fi

errors_json='[]'
warnings_json='[]'
if [[ ${#errors[@]} -gt 0 ]]; then
  errors_json=$(printf '%s\n' "${errors[@]}" | jq -R . | jq -s .)
fi
if [[ ${#warnings[@]} -gt 0 ]]; then
  warnings_json=$(printf '%s\n' "${warnings[@]}" | jq -R . | jq -s .)
fi

if [[ ${#errors[@]} -eq 0 ]]; then
  jq -n \
    --arg program "$PROGRAM" \
    --arg program_dir "$PROGRAM_DIR" \
    --argjson warnings "$warnings_json" \
    '{valid: true, program: $program, program_dir: $program_dir, warnings: $warnings, errors: []}'
else
  jq -n \
    --arg program "$PROGRAM" \
    --arg program_dir "$PROGRAM_DIR" \
    --argjson warnings "$warnings_json" \
    --argjson errors "$errors_json" \
    '{valid: false, program: $program, program_dir: $program_dir, warnings: $warnings, errors: $errors}'
fi
