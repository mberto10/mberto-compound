#!/bin/bash
# Stop hook: detect milestone/project completion markers for markdown-ledger programs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/runtime-config.sh"

output=$(cat)

if echo "$output" | grep -q '\[PROJECT_COMPLETE\]'; then
  cat << EOF_JSON
{
  "decision": "block",
  "reason": "Program '$CC_PROGRAM_NAME' marked complete. Run /compound-loop:discover with focus: 'Project complete - review full journey for high-value patterns'. Guardrails: only propose if saves >30 min, appeared 3+ times, workflow-level pattern. MAX 1-2 components. After discovery, finalize markdown program artifacts and produce summary."
}
EOF_JSON
  exit 0
fi

if echo "$output" | grep -q '\[MILESTONE_COMPLETE:'; then
  milestone=$(echo "$output" | grep -oE '\[MILESTONE_COMPLETE:[[:space:]]*[^]]+' | head -1 | sed 's/\[MILESTONE_COMPLETE:[[:space:]]*//')

  cat << EOF_MSG

╔══════════════════════════════════════════════════════════════════╗
║  MILESTONE COMPLETE: $milestone
╚══════════════════════════════════════════════════════════════════╝

## Compound Discovery Phase (Optional)

Consider running:

\`\`\`
/compound-loop:discover Milestone: $milestone - patterns from this phase
\`\`\`

Then update markdown artifacts:
1. tasks.md and status.md milestone state
2. decision-log.md and risks.md as needed
3. Continue to next milestone

════════════════════════════════════════════════════════════════════

EOF_MSG
  exit 0
fi

echo '{"decision": "approve"}'
