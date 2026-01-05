#!/bin/bash
# milestone-detector.sh
# Stop hook: Detect milestone/project completion markers
#
# Reads agent output, looks for:
# - [MILESTONE_COMPLETE: <name>] -> Plain text (informational)
# - [PROJECT_COMPLETE] -> JSON block (forces compound discovery)
#
# Triggers compound discovery with guardrails against over-generation.

output=$(cat)

# Check for PROJECT COMPLETION FIRST - this BLOCKS Claude from stopping
if echo "$output" | grep -q '\[PROJECT_COMPLETE\]'; then
    cat << 'EOF'
{
  "decision": "block",
  "reason": "Project complete. You MUST run /compound-loop:discover with focus: 'Project complete - review full journey for high-value patterns'. Guardrails: only propose if saves >30 min, appeared 3+ times, workflow-level pattern. MAX 1-2 components. Zero is fine if nothing qualifies. After discovery, update project state to completed and create final summary."
}
EOF
    exit 0
fi

# Check for MILESTONE completion - informational only, Claude can stop
if echo "$output" | grep -q '\[MILESTONE_COMPLETE:'; then
    milestone=$(echo "$output" | grep -oE '\[MILESTONE_COMPLETE:[[:space:]]*[^]]+' | head -1 | sed 's/\[MILESTONE_COMPLETE:[[:space:]]*//')

    cat << EOF

╔══════════════════════════════════════════════════════════════════╗
║  MILESTONE COMPLETE: $milestone
╚══════════════════════════════════════════════════════════════════╝

## Compound Discovery Phase (Optional)

Consider running compound discovery for this milestone:

\`\`\`
/compound-loop:discover Milestone: $milestone - patterns from this phase
\`\`\`

### ⚠️ Discovery Guardrails

Before proposing any component, apply these filters:

**Threshold Test (ALL must pass):**
1. Would this save >30 minutes if reused?
2. Did this pattern appear 3+ times, OR cause significant friction?
3. Is this a workflow-level pattern (not a small utility)?
4. Does it have clear boundaries (inputs/outputs/trigger)?

**Quantity Limit:**
- Propose MAX 1-2 components per milestone
- Quality over quantity - one excellent spec beats five mediocre ones
- If nothing clears the threshold, propose ZERO - that's fine

**Skip these patterns:**
- One-off fixes (won't recur)
- Small helpers (<10 lines of logic)
- Obvious refactors (not novel knowledge)
- Domain-specific edge cases

### After Discovery

1. Update ledger - mark milestone complete in project description
2. If component proposed: artifact created in Linear (compound-discovery label)
3. Continue to next milestone

════════════════════════════════════════════════════════════════════

EOF
    exit 0
fi

# No markers detected - allow stopping
echo '{"decision": "approve"}'
