# Optimization Loop Cloud Prompt Template

Self-contained prompt for cloud-based coding agents to execute optimization iterations.

---

## Template

```markdown
# Optimization Loop Execution

You are executing an optimization loop to improve an AI agent's performance.
Follow this protocol precisely. Respect all constraints strictly.

## Context

Goal: Improve {{GOAL_METRIC}} from {{CURRENT_VALUE}} to {{GOAL_TARGET}}
Main knob: {{MAIN_KNOB_TYPE}} at {{MAIN_KNOB_LOCATION}}
Max iterations: {{MAX_ITERATIONS}}

## Evaluation Infrastructure

### Dataset
{{DATASET}}

### Graders
{{GRADERS}}

### Baseline (already measured)
{{BASELINE}}

## Constraints

### HARD BOUNDARIES (violation = immediate stop)
{{HARD_BOUNDARIES}}

Before ANY change, verify it does NOT touch these areas.

### REGRESSION GUARDS (must not get worse)
{{REGRESSION_GUARDS}}

After EVERY change, verify these metrics have not regressed.

## Optimization Surface

### Main Knob (what you CAN change)
{{MAIN_KNOB}}

### Frozen (what you CANNOT change)
{{FROZEN}}

---

## Execution Protocol

Run {{MAX_ITERATIONS}} iterations maximum. Each iteration:

### DIAGNOSE

Using the baseline/previous results, analyze failures:

1. Identify tasks where {{GOAL_METRIC}} is below target
2. For each failing task, determine root cause
3. Categorize failures by pattern
4. Prioritize by frequency x impact

Output:
```
[DIAGNOSE]
Failures analyzed: <N> of <total> tasks
Top patterns:
  1. <pattern> (<count>) - <root cause>
  2. <pattern> (<count>) - <root cause>
  3. <pattern> (<count>) - <root cause>

Priority: <which pattern to address>
```

### HYPOTHESIZE

Propose ONE change to the main knob:

1. Select the highest-priority failure pattern
2. Design a specific change to address it
3. VERIFY: Change is within main knob, not in frozen areas
4. Predict expected improvement

Output:
```
[HYPOTHESIZE]
Target pattern: <pattern being addressed>

Change:
  Location: <specific location within main knob>
  Modification: <exact change to make>

Boundary check:
  - Is this within main knob? [YES/NO]
  - Does this touch frozen areas? [YES/NO]
  - Boundary status: PASS | VIOLATION

IF boundary VIOLATION -> STOP immediately

Expected impact: {{GOAL_METRIC}} +<expected delta>
Reasoning: <why this change should help>
Risk: <what might get worse>
```

### EXPERIMENT

Implement and test the change:

1. Apply the change to the main knob
2. Run evaluation on all tasks (or targeted subset)
3. Collect {{GOAL_METRIC}} and all regression guard metrics
4. Compare to previous iteration

Output:
```
[EXPERIMENT]
Change applied: <description>

Results:
| Metric | Previous | Current | Delta | Status |
|--------|----------|---------|-------|--------|
| {{GOAL_METRIC}} | <val> | <val> | <+/> | <better/worse/same> |
| <regression metric 1> | <val> | <val> | <+/> | PASS/FAIL |
| <regression metric 2> | <val> | <val> | <+/> | PASS/FAIL |

Verdict: VALIDATED | PARTIAL | INVALIDATED
```

### COMPOUND

Decide whether to keep or rollback:

IF {{GOAL_METRIC}} improved AND no regression guards violated:
-> KEEP the change

IF {{GOAL_METRIC}} regressed OR any regression guard violated:
-> ROLLBACK to previous state

Record learnings regardless of decision.

Output:
```
[COMPOUND]
Decision: KEEP | ROLLBACK
Reason: <explanation>

Current main knob state:
<summary of current state after decision>

Learnings:
- <what this attempt taught us>
```

### DECIDE

Evaluate exit conditions:

| Condition | Check | Action |
|-----------|-------|--------|
| Target achieved | {{GOAL_METRIC}} >= {{GOAL_TARGET}} | GRADUATE |
| Boundary violated | Change touched frozen/boundary | STOP |
| Regression | Regression guard failed persistently | STOP |
| Plateau | 3 iterations, no improvement | STOP |
| Max iterations | Iteration count >= {{MAX_ITERATIONS}} | STOP |
| Otherwise | None of above | CONTINUE |

Output:
```
[DECIDE]
Status check:
  - {{GOAL_METRIC}}: <value> (target: {{GOAL_TARGET}}) [MET/NOT MET]
  - Boundaries: [RESPECTED/VIOLATED]
  - Regressions: [NONE/LIST]
  - Iterations: <N>/{{MAX_ITERATIONS}}
  - Trend: <improving/flat/declining>

Decision: CONTINUE | GRADUATE | STOP
Reason: <explanation>

[If CONTINUE] Next focus: <pattern to address next>
```

---

## Output Format

Structure ALL output as follows for consistency:

```
===============================================
OPTIMIZATION RUN
===============================================
Run ID: <generate unique ID>
Environment: <identify yourself - model name>
Started: <timestamp>

Goal: {{GOAL_METRIC}} {{CURRENT_VALUE}} -> {{GOAL_TARGET}}
Main knob: {{MAIN_KNOB_TYPE}} @ {{MAIN_KNOB_LOCATION}}

-----------------------------------------------
ITERATION <N>
-----------------------------------------------
[DIAGNOSE output]
[HYPOTHESIZE output]
[EXPERIMENT output]
[COMPOUND output]
[DECIDE output]
-----------------------------------------------

<repeat for each iteration>

===============================================
FINAL REPORT
===============================================
Outcome: <GRADUATED | STOPPED: reason>
Iterations completed: <N>

Metrics journey:
| Iteration | {{GOAL_METRIC}} | Change |
|-----------|-----------------|--------|
| baseline  | {{CURRENT_VALUE}} | - |
| 1         | <value> | <change> |
| ...       | ...     | ...     |
| final     | <value> | - |

Changes kept:
  1. <change description> (+<impact>)
  2. <change description> (+<impact>)

Final main knob state:
<complete description of final state>

Key learnings:
  - What worked: <insight>
  - What didn't: <insight>
  - Patterns discovered: <insight>

Recommendations:
<if not graduated, what to try next>
===============================================
```

---

## Rules

1. ONE change per iteration
2. Respect boundaries absolutely
3. Check regressions after every change
4. Use existing baseline; do not re-run baseline
5. Document everything
6. Be specific

Begin with ITERATION 1. Use the provided baseline data; do not re-run baseline measurement.
```
