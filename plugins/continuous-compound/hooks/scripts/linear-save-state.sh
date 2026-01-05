#!/bin/bash
# linear-save-state.sh
# PreCompact hook: Auto-save state to _autonomous project
#
# This hook EXECUTES the saves automatically (doesn't just output instructions).
# It parses the transcript and saves to Linear via GraphQL API.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source Linear API helpers
source "$SCRIPT_DIR/linear-api.sh"

# ============================================================================
# Read hook input from stdin
# ============================================================================

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Log for debugging (to stderr, captured by Claude Code in debug mode)
log_debug() {
  echo "[PreCompact] $1" >&2
}

log_debug "Trigger: $TRIGGER, Transcript: $TRANSCRIPT_PATH"

# ============================================================================
# Check if _autonomous project exists
# ============================================================================

PROJECT=$(linear_get_project)
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id // empty')

if [ -z "$PROJECT_ID" ]; then
  # No _autonomous project - just continue normally
  cat << 'EOF'
{
  "continue": true
}
EOF
  exit 0
fi

# ============================================================================
# Parse transcript to extract state
# ============================================================================

HANDOFF_BODY=""

if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  # Parse transcript using Node.js script
  STATE=$(node "$SCRIPT_DIR/transcript-parser.mjs" "$TRANSCRIPT_PATH" 2>/dev/null || echo '{}')
  HANDOFF_MARKDOWN=$(node "$SCRIPT_DIR/transcript-parser.mjs" "$TRANSCRIPT_PATH" --markdown 2>/dev/null || echo 'Failed to parse transcript')
  HANDOFF_BODY="$HANDOFF_MARKDOWN"

  log_debug "Parsed transcript successfully"
else
  HANDOFF_BODY="## Auto-Handoff

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Trigger: $TRIGGER

*Transcript not available for parsing*

## Resume Instructions

Check the project ledger and recent issues for context.
"
  log_debug "No transcript available"
fi

# ============================================================================
# Create handoff issue in Linear
# ============================================================================

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
HANDOFF_TITLE="Handoff: $TIMESTAMP"

HANDOFF_RESULT=$(linear_create_handoff_issue "$HANDOFF_TITLE" "$HANDOFF_BODY" 2>/dev/null || echo '{}')
HANDOFF_ID=$(echo "$HANDOFF_RESULT" | jq -r '.issue.identifier // empty')

if [ -n "$HANDOFF_ID" ]; then
  log_debug "Created handoff issue: $HANDOFF_ID"
else
  log_debug "Failed to create handoff issue"
fi

# ============================================================================
# Update project ledger with timestamp
# ============================================================================

CURRENT_LEDGER=$(echo "$PROJECT" | jq -r '.description // ""')
UPDATED_LEDGER="$CURRENT_LEDGER

---
**Last Handoff**: $TIMESTAMP
**Handoff Issue**: $HANDOFF_ID
"

LEDGER_RESULT=$(linear_update_ledger "$PROJECT_ID" "$UPDATED_LEDGER" 2>/dev/null || echo '{}')

if [ "$(echo "$LEDGER_RESULT" | jq -r '.success // false')" = "true" ]; then
  log_debug "Updated project ledger"
else
  log_debug "Failed to update ledger"
fi

# ============================================================================
# Output result
# ============================================================================

if [ -n "$HANDOFF_ID" ]; then
  cat << EOF
{
  "continue": true,
  "systemMessage": "State auto-saved to Linear (${HANDOFF_ID}). Context will be compacted. Run /clear for fresh context with handoff loaded."
}
EOF
else
  cat << 'EOF'
{
  "continue": true,
  "systemMessage": "PreCompact hook ran but could not save to Linear. Check LINEAR_API_KEY."
}
EOF
fi
