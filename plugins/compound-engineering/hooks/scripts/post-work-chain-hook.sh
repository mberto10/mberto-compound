#!/bin/bash

# Post-Work Chain Hook
# Chains work → review → discover automatically by detecting completion markers.
#
# Stage logic:
#   idle             + WORK COMPLETE   (tests pass)  → pending_review  (block with review prompt)
#   pending_review   + REVIEW REPORT   (PASS)        → pending_discover (block with discover prompt)
#   pending_review   + REVIEW REPORT   (FAIL)        → done (approve — end chain)
#   pending_discover + DISCOVERY COMPLETE             → done (approve — chain complete)
#
# Each stage only responds to its own marker to prevent infinite loops.

set -euo pipefail

# Portable in-place sed (works on both BSD and GNU)
sed_inplace() {
  local file="$1"; shift
  local tmp="${file}.tmp.$$"
  sed "$@" "$file" > "$tmp" && mv "$tmp" "$file"
}

# Read hook input from stdin
HOOK_INPUT=$(cat)

# State file location
STATE_FILE=".claude/work-chain-state.local.md"

# If no state file exists, chain is not active — allow exit
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Parse YAML frontmatter
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")

# Check if chain is active
ACTIVE=$(echo "$FRONTMATTER" | grep '^active:' | sed 's/active: *//')
if [[ "$ACTIVE" != "true" ]]; then
  exit 0
fi

# Extract current stage
STAGE=$(echo "$FRONTMATTER" | grep '^stage:' | sed 's/stage: *//')
if [[ -z "$STAGE" ]]; then
  echo "Warning: Chain state missing stage. Stopping." >&2
  sed_inplace "$STATE_FILE" 's/^active: true/active: false/'
  exit 0
fi

# Get transcript path from hook input
TRANSCRIPT_PATH=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('transcript_path',''))" "$HOOK_INPUT" 2>/dev/null || echo "")

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  # No transcript — allow exit silently (don't break the chain state)
  exit 0
fi

# Check for assistant messages
if ! grep -qE '"role" *: *"assistant"' "$TRANSCRIPT_PATH"; then
  exit 0
fi

# Extract last assistant message text
LAST_LINE=$(grep -E '"role" *: *"assistant"' "$TRANSCRIPT_PATH" | tail -1)
LAST_OUTPUT=$(python3 -c "
import json, sys
line = sys.argv[1]
data = json.loads(line)
parts = []
for c in data.get('message', {}).get('content', []):
    if c.get('type') == 'text':
        parts.append(c.get('text', ''))
print('\n'.join(parts))
" "$LAST_LINE" 2>/dev/null || echo "")

if [[ -z "$LAST_OUTPUT" ]]; then
  exit 0
fi

# --- Stage: idle — look for WORK COMPLETE ---
if [[ "$STAGE" == "idle" ]]; then
  if echo "$LAST_OUTPUT" | grep -q 'WORK COMPLETE'; then
    # Check that tests passed: numerator == denominator > 0
    TESTS_LINE=$(echo "$LAST_OUTPUT" | grep -oE 'Tests Passed: [0-9]+/[0-9]+' || echo "")
    INVARIANTS_LINE=$(echo "$LAST_OUTPUT" | grep -oE 'Invariants Verified: [0-9]+/[0-9]+' || echo "")

    TESTS_PASS=true
    if [[ -n "$TESTS_LINE" ]]; then
      T_NUM=$(echo "$TESTS_LINE" | grep -oE '[0-9]+/[0-9]+' | cut -d/ -f1)
      T_DEN=$(echo "$TESTS_LINE" | grep -oE '[0-9]+/[0-9]+' | cut -d/ -f2)
      if [[ "$T_NUM" != "$T_DEN" ]] || [[ "$T_DEN" -eq 0 ]]; then
        TESTS_PASS=false
      fi
    fi

    INVARIANTS_PASS=true
    if [[ -n "$INVARIANTS_LINE" ]]; then
      I_NUM=$(echo "$INVARIANTS_LINE" | grep -oE '[0-9]+/[0-9]+' | cut -d/ -f1)
      I_DEN=$(echo "$INVARIANTS_LINE" | grep -oE '[0-9]+/[0-9]+' | cut -d/ -f2)
      if [[ "$I_NUM" != "$I_DEN" ]] || [[ "$I_DEN" -eq 0 ]]; then
        INVARIANTS_PASS=false
      fi
    fi

    if [[ "$TESTS_PASS" == "false" ]] || [[ "$INVARIANTS_PASS" == "false" ]]; then
      echo "Chain: Work completed with failures. Skipping review." >&2
      sed_inplace "$STATE_FILE" 's/^active: true/active: false/'
      sed_inplace "$STATE_FILE" 's/^stage: idle/stage: done/'
      exit 0
    fi

    # Extract friction points and spec gaps for context
    FRICTION=$(echo "$LAST_OUTPUT" | python3 -c "
import sys
text = sys.stdin.read()
in_friction = False
lines = []
for line in text.split('\n'):
    if 'Friction Points:' in line:
        in_friction = True
        continue
    if in_friction:
        if line.strip().startswith('- '):
            lines.append(line.strip())
        else:
            break
print('\n'.join(lines))
" 2>/dev/null || echo "")

    GAPS=$(echo "$LAST_OUTPUT" | python3 -c "
import sys
text = sys.stdin.read()
in_gaps = False
lines = []
for line in text.split('\n'):
    if 'Spec Gaps Discovered:' in line:
        in_gaps = True
        continue
    if in_gaps:
        if line.strip().startswith('- '):
            lines.append(line.strip())
        else:
            break
print('\n'.join(lines))
" 2>/dev/null || echo "")

    # Advance to pending_review
    sed_inplace "$STATE_FILE" 's/^stage: idle/stage: pending_review/'

    # Build review prompt
    REVIEW_PROMPT="Run /compound-engineering:review now."
    if [[ -n "$FRICTION" ]]; then
      REVIEW_PROMPT="$REVIEW_PROMPT

Work reported these friction points:
$FRICTION"
    fi
    if [[ -n "$GAPS" ]]; then
      REVIEW_PROMPT="$REVIEW_PROMPT

Work reported these spec gaps:
$GAPS"
    fi

    echo "Chain: Work passed. Triggering review." >&2
    python3 -c "
import json, sys
print(json.dumps({
    'decision': 'block',
    'reason': sys.argv[1]
}))
" "$REVIEW_PROMPT"
    exit 0
  fi
  # No WORK COMPLETE marker — allow exit
  exit 0
fi

# --- Stage: pending_review — look for REVIEW REPORT ---
if [[ "$STAGE" == "pending_review" ]]; then
  if echo "$LAST_OUTPUT" | grep -q 'REVIEW REPORT'; then
    VERDICT=$(echo "$LAST_OUTPUT" | grep -oE 'VERDICT: (PASS WITH WARNINGS|PASS|FAIL)' | head -1 | sed 's/VERDICT: //')

    if [[ "$VERDICT" == "FAIL" ]]; then
      echo "Chain: Review verdict FAIL. Ending chain." >&2
      sed_inplace "$STATE_FILE" 's/^active: true/active: false/'
      sed_inplace "$STATE_FILE" 's/^stage: pending_review/stage: done/'
      exit 0
    fi

    if [[ "$VERDICT" == "PASS" ]] || [[ "$VERDICT" == "PASS WITH WARNINGS" ]]; then
      # Extract spec gaps from review for discover context
      REVIEW_GAPS=$(echo "$LAST_OUTPUT" | python3 -c "
import sys
text = sys.stdin.read()
in_gaps = False
lines = []
for line in text.split('\n'):
    if 'SPEC GAPS:' in line:
        in_gaps = True
        continue
    if in_gaps:
        if line.strip().startswith('- '):
            lines.append(line.strip())
        elif line.strip() == '' or line.strip().startswith('VERDICT') or line.strip().startswith('RECOMMENDED'):
            break
print('\n'.join(lines))
" 2>/dev/null || echo "")

      # Advance to pending_discover
      sed_inplace "$STATE_FILE" 's/^stage: pending_review/stage: pending_discover/'

      DISCOVER_PROMPT="Run /compound-engineering:discover now."
      if [[ -n "$REVIEW_GAPS" ]]; then
        DISCOVER_PROMPT="$DISCOVER_PROMPT

Review identified these spec gaps:
$REVIEW_GAPS"
      fi

      echo "Chain: Review verdict $VERDICT. Triggering discover." >&2
      python3 -c "
import json, sys
print(json.dumps({
    'decision': 'block',
    'reason': sys.argv[1]
}))
" "$DISCOVER_PROMPT"
      exit 0
    fi

    # Unrecognized verdict — end chain safely
    echo "Chain: Unrecognized verdict '$VERDICT'. Ending chain." >&2
    sed_inplace "$STATE_FILE" 's/^active: true/active: false/'
    sed_inplace "$STATE_FILE" 's/^stage: pending_review/stage: done/'
    exit 0
  fi
  # No REVIEW REPORT marker — allow exit
  exit 0
fi

# --- Stage: pending_discover — look for DISCOVERY COMPLETE ---
if [[ "$STAGE" == "pending_discover" ]]; then
  if echo "$LAST_OUTPUT" | grep -q 'DISCOVERY COMPLETE'; then
    echo "Chain: Discovery complete. Chain finished." >&2
    sed_inplace "$STATE_FILE" 's/^active: true/active: false/'
    sed_inplace "$STATE_FILE" 's/^stage: pending_discover/stage: done/'
    exit 0
  fi
  # No DISCOVERY COMPLETE marker — allow exit
  exit 0
fi

# Any other stage (done, unknown) — allow exit
exit 0
