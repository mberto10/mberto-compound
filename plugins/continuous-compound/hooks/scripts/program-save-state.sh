#!/bin/bash
# PreCompact hook: save markdown handoff and update status.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/runtime-config.sh"
source "$SCRIPT_DIR/local-store.sh"

read_hook_input() {
  local input
  input=$(cat || true)
  if [ -z "$input" ]; then
    input='{}'
  fi
  echo "$input"
}

parse_transcript_markdown() {
  local transcript_path="$1"

  if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
    node "$SCRIPT_DIR/transcript-parser.mjs" "$transcript_path" --markdown 2>/dev/null || echo "Failed to parse transcript"
  else
    cat << EOF_FALLBACK
## Auto-Handoff

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

*Transcript not available for parsing*

## Resume Instructions

Check contract.md, tasks.md, and status.md. Continue from the single current [>] task.
EOF_FALLBACK
  fi
}

validation_json="$(bash "$SCRIPT_DIR/program-validate.sh")"
valid="$(echo "$validation_json" | jq -r '.valid')"

if [ "$valid" != "true" ]; then
  errors=$(echo "$validation_json" | jq -r '.errors[]' 2>/dev/null || true)
  cat << EOF_JSON
{
  "continue": true,
  "systemMessage": "PreCompact state save skipped: markdown schema validation failed for '$CC_PROGRAM_NAME'. Fix:\n$errors"
}
EOF_JSON
  exit 0
fi

input="$(read_hook_input)"
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)
trigger=$(echo "$input" | jq -r '.trigger // "unknown"' 2>/dev/null || true)

handoff_markdown="$(parse_transcript_markdown "$transcript_path")"
handoff_path="$(local_write_handoff "$handoff_markdown")"
local_append_status_handoff "$handoff_path"

cat << EOF_JSON
{
  "continue": true,
  "systemMessage": "State auto-saved locally for '$CC_PROGRAM_NAME' via trigger '$trigger' at '$handoff_path'."
}
EOF_JSON
