---
name: optimize
description: Start or continue the optimization loop, view progress status, or export for cloud execution.
arguments:
  - name: action
    description: Mode of operation - `run` (default), `status`, or `cloud`
    required: false
  - name: agent
    description: Agent name (used for journal and eval contract file lookup)
    required: false
  - name: phase
    description: Optional phase to resume from (for crash recovery). Normally phases auto-advance. For `run` action only.
    required: false
  - name: lever-mode
    description: Lever strategy for hypothesis scope: `single` or `multi`.
    required: false
  - name: max-levers
    description: Maximum levers allowed when lever-mode=multi (1..5)
    required: false
  - name: until
    description: Optional phase to stop after (e.g., `hypothesize`). Useful for partial runs or debugging.
    required: false
---

# Optimize Command

Unified controller for the Agentic Optimization Loop. Handles execution, status monitoring, and cloud prompting.

## Execution Matrix

Depending on the `action` argument, flow changes:

- **`action=run`** (or unspecified): Execute local optimization loop iterations.
- **`action=status`**: Read-only journal progress dump.
- **`action=cloud`**: Export cloud prompt using local settings.

---

## Action: `run` (Default Execution)

Run one optimization loop with persistent journal state and strict contract preflight.

### Step 1: Resolve Inputs

Determine `agent`, `lever_mode` (default `single`), and `max_levers`.
- `single` => force `max_levers=1`
- `multi` => default `max_levers=3`
- hard validation: `1 <= max_levers <= 5`
If validation fails, stop.

### Step 2: Contract Preflight (Required)

1. Check Local snapshot (`.claude/eval-infra/<agent>.[json|yaml]`).
2. Live validation (Langfuse identifiers):
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

If it fails, stop and handoff to: `/agent-eval-setup action=status --agent <agent>`

### Step 3: Load Journal State

Path: `.claude/optimization-loops/<agent>/journal.yaml`

Maintain optimization definition directly in metadata:

```yaml
meta:
  target:
    metric: "<primary metric>"
    current: <0-1>
    goal: <0-1>
    dimensions: [...]
  levers:
    main_knob: {type: config|prompt, location: "<path>"}
    allowed: ["<paths>"]
    frozen: ["<paths>"]
```

Backward-compatible defaults for old journals: `loop.lever_mode: single`, `loop.max_levers: 1`.

### Step 4: Execute Iteration

Execute all phases sequentially within this single invocation. Do NOT stop and ask the user to re-run the command between phases.

> **Anti-pattern:** Do NOT output "next action: run /optimize again" or end your turn between phases.
> **Correct pattern:** At confirmation gates (after HYPOTHESIZE, after ANALYZE), ask the user inline and wait for their response within the same conversation turn. Upon receiving approval, continue to the next phase immediately.

If `--phase` is provided, start from that phase instead of reading `current_phase` from the journal (crash recovery).

If `--until` is provided, stop after completing the specified phase (even if no gate is reached).

Use `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/SKILL.md` for phase logic.

**Lever Rule (HYPOTHESIZE only)**:
- `single`: exactly one lever change
- `multi`: 2..max_levers lever changes
Decision policy and guards are identical across modes.

For diagnoses:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/trace_retriever.py --trace-id <trace_id> --mode io
```

**Phase flow with confirmation gates:**

```
INIT (if current_phase=init)
  → establish baseline, set current_phase=hypothesize, persist journal
  → continue immediately to HYPOTHESIZE

HYPOTHESIZE
  → propose lever change(s) per lever policy
  → persist hypothesis to journal
  → ⛔ GATE: Present hypothesis to user and ask for confirmation before proceeding
  → on approval: set current_phase=experiment, continue
  → on rejection: revise hypothesis (stay in hypothesize)

EXPERIMENT
  → apply changes, run evaluation, collect metrics
  → persist results to journal
  → set current_phase=analyze, continue immediately

ANALYZE
  → compare vs baseline, check guards
  → persist analysis to journal
  → ⛔ GATE: Present analysis summary + keep/rollback recommendation, ask user to confirm
  → set current_phase=compound, continue

COMPOUND
  → execute keep or rollback per user decision
  → persist compounded block to journal
  → if decision=continue: set current_phase=hypothesize (next iteration)
  → if decision=graduate: set current_phase=graduated
  → DONE — output final iteration summary
```

### Step 5: Persist State & Report
Output iteration summary with metrics journey. Do NOT output "next action: run the same command again."

---

## Action: `status`

Provide a read-only view of optimization progress.

### If No Agent Specified
List all journals: `ls .claude/optimization-loops/*/journal.yaml`
Show phase, iteration, summary, and lever rules for each.

### If Agent Specified
Read: `.claude/optimization-loops/<agent>/journal.yaml`

**Required Output:**
```text
Optimization Status: <agent>
Phase: <current_phase>
Iteration: <N>
Lever mode: <single|multi>
Max levers: <N>
Target: <summary>
Guard status: <summary>
Next action: <summary>
```

---

## Action: `cloud`

Generate a self-contained cloud execution prompt using current state.

### Step 1: Preflight
Run contract resolver with `--validate-live`.
If it fails, stop.

### Step 2: Generate
Read `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/references/loop-prompt-template.md`. 
Include all active `lever_mode` and `max_levers` constraints.

**Target Output:**
Return full cloud prompt text, contract summary, and lever strategy summary.
