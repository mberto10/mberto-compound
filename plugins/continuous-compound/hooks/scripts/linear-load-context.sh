#!/bin/bash
# linear-load-context.sh
# SessionStart hook: Auto-load _autonomous project context from Linear
#
# This hook FETCHES and INJECTS context automatically (doesn't just output instructions).
# It queries Linear API and returns additionalContext that gets injected into the session.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source Linear API helpers
source "$SCRIPT_DIR/linear-api.sh"

# Log for debugging (to stderr, captured by Claude Code in debug mode)
log_debug() {
  echo "[SessionStart] $1" >&2
}

log_debug "Hook triggered at $(date)"

# ============================================================================
# Check if _autonomous project exists
# ============================================================================

PROJECT=$(linear_get_project 2>/dev/null || echo '{}')
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id // empty')
PROJECT_STATE=$(echo "$PROJECT" | jq -r '.state // empty')

if [ -z "$PROJECT_ID" ]; then
  # No _autonomous project - output minimal context
  log_debug "No _autonomous project found"
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "No active _autonomous project. This is a normal session."
  }
}
EOF
  exit 0
fi

log_debug "Found _autonomous project: $PROJECT_ID"

# ============================================================================
# Fetch project ledger (description)
# ============================================================================

LEDGER=$(echo "$PROJECT" | jq -r '.description // "No ledger content"')

# ============================================================================
# Fetch current issues (labeled 'current')
# ============================================================================

CURRENT_ISSUES=$(linear_get_current_issues 2>/dev/null || echo '[]')
CURRENT_COUNT=$(echo "$CURRENT_ISSUES" | jq -r 'length // 0')

CURRENT_TASKS=""
if [ "$CURRENT_COUNT" -gt 0 ]; then
  # Build detailed task list with full descriptions
  CURRENT_TASKS=$(echo "$CURRENT_ISSUES" | jq -r '
    .[] |
    "### [\(.identifier)] \(.title)\n**Status:** \(.state.name)\n\n\(.description // "No description")\n\n---"
  ' 2>/dev/null || echo "")
fi

# ============================================================================
# Fetch recent handoffs
# ============================================================================

HANDOFFS=$(linear_get_handoffs 1 2>/dev/null || echo '[]')
LATEST_HANDOFF=""

if [ "$(echo "$HANDOFFS" | jq -r 'length // 0')" -gt 0 ]; then
  HANDOFF_ID=$(echo "$HANDOFFS" | jq -r '.[0].identifier // empty')
  HANDOFF_TITLE=$(echo "$HANDOFFS" | jq -r '.[0].title // empty')
  HANDOFF_DESC=$(echo "$HANDOFFS" | jq -r '.[0].description // empty' | head -c 2000)
  HANDOFF_TIME=$(echo "$HANDOFFS" | jq -r '.[0].updatedAt // empty')

  if [ -n "$HANDOFF_ID" ]; then
    LATEST_HANDOFF="**Latest Handoff**: [$HANDOFF_ID] $HANDOFF_TITLE
Updated: $HANDOFF_TIME

$HANDOFF_DESC"
  fi
fi

# ============================================================================
# Build context to inject
# ============================================================================

CONTEXT="
# Autonomous Project Context (Auto-Loaded)

## Project Ledger

$LEDGER

## Current Tasks ($CURRENT_COUNT active)

$CURRENT_TASKS

## Latest Handoff

$LATEST_HANDOFF

---

## CRITICAL: Autonomous Work Instructions

**Your mission**: Work continuously on this project until ALL milestones are complete (PROJECT_COMPLETE).

**After completing each issue**:
1. Mark the issue as Done in Linear (update_issue with state: Done)
2. Remove the \`current\` label from the completed issue
3. Use \`list_issues\` with project=_autonomous to find the next Backlog issue
4. Add the \`current\` label to the next issue
5. Continue working immediately - DO NOT stop or wait for user input

**When session resumes after compacting**:
- Check Current Tasks above for your active work
- If no current tasks, use Linear tools to find next Backlog issue in _autonomous project
- Add \`current\` label and resume work immediately without asking the user

**Finding next task**: Use \`mcp__linear-server__list_issues\` with project=\"_autonomous\" and state=\"Backlog\" to find pending work. The Project Ledger above contains milestones to guide priority.

**Labels**: current | blocked | decision | learning | pending-review

**When a milestone completes** (all its issues are Done):
1. Update the project ledger (update_project description) to mark milestone as \`[x]\` ✅ COMPLETE
2. Update the State section in ledger to reflect current progress
3. Output \`[MILESTONE_COMPLETE: <name>]\` marker

**Workflow Markers**:
- Output \`[MILESTONE_COMPLETE: <name>]\` when a milestone's tasks are all done
- Output \`[PROJECT_COMPLETE]\` only when ALL milestones are done
- Add \`friction:\` comments when things are hard

**IMPORTANT**: Do not stop working after completing one issue. Continue until PROJECT_COMPLETE or blocked.

**Context Management:**
- Do NOT use /compact - it loses important process details and MANDATORY PROCESS steps
- When context is filling, use /clear instead
- /clear triggers SessionStart hook to reload full ledger and current issues with descriptions
- This ensures you always have the complete MANDATORY PROCESS visible
"

# Escape for JSON
ESCAPED_CONTEXT=$(echo "$CONTEXT" | jq -Rs '.')

log_debug "Loaded context with $CURRENT_COUNT current tasks"

# ============================================================================
# Output as additionalContext (injected into session)
# ============================================================================

cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $ESCAPED_CONTEXT
  }
}
EOF
