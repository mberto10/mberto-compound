#!/bin/bash

# Harness Stop Hook
# Controls the autonomous engineering loop by detecting completion markers
# and either continuing the loop or allowing exit.
#
# Markers detected:
#   [ISSUE_COMPLETE: <id>] — issue done, continue loop
#   [ISSUE_FAILED: <id>]   — issue failed, continue (unless 3+ consecutive failures)
#   [HARNESS_DONE]          — queue empty, allow exit
#   [HARNESS_PAUSE: <id>]   — context limit, allow exit for manual resume
#   [HARNESS_STOP]          — user-requested stop, allow exit
#
# JSON parsing uses python3 (always available) instead of jq for portability.

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)

# State file location
STATE_FILE=".claude/harness-state.local.md"

# If no state file exists, harness is not active — allow exit
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Parse YAML frontmatter
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")

# Check if harness is active
ACTIVE=$(echo "$FRONTMATTER" | grep '^active:' | sed 's/active: *//')
if [[ "$ACTIVE" != "true" ]]; then
  exit 0
fi

# Extract state values
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
CONSECUTIVE_FAILURES=$(echo "$FRONTMATTER" | grep '^consecutive_failures:' | sed 's/consecutive_failures: *//')

# Validate numeric fields
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "Warning: Harness state corrupted (iteration='$ITERATION'). Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "Warning: Harness state corrupted (max_iterations='$MAX_ITERATIONS'). Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

if [[ ! "$CONSECUTIVE_FAILURES" =~ ^[0-9]+$ ]]; then
  CONSECUTIVE_FAILURES=0
fi

# Get transcript path from hook input (using python3 for JSON parsing)
TRANSCRIPT_PATH=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('transcript_path',''))" "$HOOK_INPUT" 2>/dev/null || echo "")

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "Warning: Harness transcript not found. Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Check for assistant messages (handle both compact and pretty JSON)
if ! grep -qE '"role" *: *"assistant"' "$TRANSCRIPT_PATH"; then
  echo "Warning: No assistant messages in transcript. Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Extract last assistant message text (using python3 for JSON parsing)
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
  echo "Warning: Could not parse assistant message. Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# --- Marker Detection ---

# Check for HARNESS_DONE — queue empty, allow exit
if echo "$LAST_OUTPUT" | grep -q '\[HARNESS_DONE\]'; then
  echo "Harness: Queue empty. Stopping after $ITERATION iterations." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Check for HARNESS_PAUSE — context limit, allow exit
if echo "$LAST_OUTPUT" | grep -qE '\[HARNESS_PAUSE: .+\]'; then
  PAUSE_ID=$(echo "$LAST_OUTPUT" | grep -oE '\[HARNESS_PAUSE: [^]]+' | sed 's/\[HARNESS_PAUSE: //')
  echo "Harness: Pausing on issue $PAUSE_ID. Resume with /harness start." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Check for HARNESS_STOP — user-requested stop
if echo "$LAST_OUTPUT" | grep -q '\[HARNESS_STOP\]'; then
  echo "Harness: User-requested stop after $ITERATION iterations." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Check for ISSUE_COMPLETE — success, continue loop
if echo "$LAST_OUTPUT" | grep -qE '\[ISSUE_COMPLETE: .+\]'; then
  COMPLETED_ID=$(echo "$LAST_OUTPUT" | grep -oE '\[ISSUE_COMPLETE: [^]]+' | sed 's/\[ISSUE_COMPLETE: //')

  # Update completed_issues in state file using python3 for reliable YAML list editing
  python3 -c "
import sys, re
state_file = sys.argv[1]
issue_id = sys.argv[2]
with open(state_file, 'r') as f:
    content = f.read()
# Update completed_issues list
content = re.sub(
    r'^(completed_issues: \[)(.*?)(\])$',
    lambda m: m.group(1) + ('\"' + issue_id + '\", ' + m.group(2) if m.group(2).strip() else '\"' + issue_id + '\"') + m.group(3),
    content,
    flags=re.MULTILINE
)
# Reset consecutive failures
content = re.sub(r'^consecutive_failures: .*$', 'consecutive_failures: 0', content, flags=re.MULTILINE)
with open(state_file, 'w') as f:
    f.write(content)
" "$STATE_FILE" "$COMPLETED_ID"

  CONSECUTIVE_FAILURES=0
  echo "Harness: Issue $COMPLETED_ID completed." >&2
fi

# Check for ISSUE_FAILED — failure, maybe continue
if echo "$LAST_OUTPUT" | grep -qE '\[ISSUE_FAILED: .+\]'; then
  FAILED_ID=$(echo "$LAST_OUTPUT" | grep -oE '\[ISSUE_FAILED: [^]]+' | sed 's/\[ISSUE_FAILED: //')

  # Increment consecutive failures
  NEW_FAILURES=$((CONSECUTIVE_FAILURES + 1))

  # Update failed_issues and consecutive_failures in state file
  python3 -c "
import sys, re
state_file = sys.argv[1]
issue_id = sys.argv[2]
new_failures = sys.argv[3]
with open(state_file, 'r') as f:
    content = f.read()
# Update failed_issues list
content = re.sub(
    r'^(failed_issues: \[)(.*?)(\])$',
    lambda m: m.group(1) + ('\"' + issue_id + '\", ' + m.group(2) if m.group(2).strip() else '\"' + issue_id + '\"') + m.group(3),
    content,
    flags=re.MULTILINE
)
# Update consecutive failures
content = re.sub(r'^consecutive_failures: .*$', 'consecutive_failures: ' + new_failures, content, flags=re.MULTILINE)
with open(state_file, 'w') as f:
    f.write(content)
" "$STATE_FILE" "$FAILED_ID" "$NEW_FAILURES"

  # Check if 3+ consecutive failures — stop the loop
  if [[ $NEW_FAILURES -ge 3 ]]; then
    echo "Harness: 3 consecutive failures. Stopping for human review." >&2
    sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
    exit 0
  fi

  echo "Harness: Issue $FAILED_ID failed ($NEW_FAILURES consecutive)." >&2
fi

# --- Loop Continuation Checks ---

# Increment iteration
NEXT_ITERATION=$((ITERATION + 1))

# Check max iterations
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $NEXT_ITERATION -gt $MAX_ITERATIONS ]]; then
  echo "Harness: Max iterations ($MAX_ITERATIONS) reached. Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Update iteration in state file
TEMP_FILE="${STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$STATE_FILE"

# Extract the prompt text (everything after the closing ---)
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
  echo "Warning: No prompt found in state file. Stopping." >&2
  sed -i '' 's/^active: true/active: false/' "$STATE_FILE"
  exit 0
fi

# Build system message
SYSTEM_MSG="Harness iteration $NEXT_ITERATION/$MAX_ITERATIONS | Failures: $CONSECUTIVE_FAILURES/3"

# Block the stop and feed the harness prompt back (using python3 for JSON output)
python3 -c "
import json, sys
print(json.dumps({
    'decision': 'block',
    'reason': sys.argv[1],
    'systemMessage': sys.argv[2]
}))
" "$PROMPT_TEXT" "$SYSTEM_MSG"

exit 0
