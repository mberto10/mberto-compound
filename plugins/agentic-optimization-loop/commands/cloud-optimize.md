---
name: cloud-optimize
description: Generate self-contained optimization prompts for cloud execution using the three-layer framework (eval infrastructure → optimization target → optimization loop).
arguments:
  - name: iterations
    description: Maximum optimization iterations (default 5)
    required: false
---

# Cloud Optimize Command

Generate optimization prompts for cloud-based coding agents using the three-layer framework.

```
Layer 1: Evaluation Infrastructure (what exists to measure with)
Layer 2: Optimization Target (what to improve, with what constraints)
Layer 3: Optimization Loop (the execution prompt)
```

---

## Step 1: Assess Evaluation Infrastructure (Layer 1)

Load skill:
```
Read: ${CLAUDE_PLUGIN_ROOT}/skills/evaluation-infrastructure/SKILL.md
```

### Determine What Exists

Ask user:

```
Let's assess your evaluation infrastructure.

**Dataset:**
Do you have an evaluation dataset?
- YES, existing dataset (path/reference?)
- PARTIAL, have production traces but no formal dataset
- NO, need to create one

**Graders:**
Do you have graders/evaluators?
- YES, existing graders (what metrics do they measure?)
- PARTIAL, have some but need more
- NO, need to create them

**Baseline:**
Do you have baseline measurements?
- YES, from a previous run (metrics?)
- NO, need to establish baseline
```

### Build Layer 1 Specification

Based on answers, construct:

```yaml
evaluation_infrastructure:
  dataset:
    status: EXISTS | PARTIAL | MISSING
    reference: "<if exists>"
    size: <if known>

  graders:
    status: EXISTS | PARTIAL | MISSING
    items:
      - name: "<name>"
        metric: "<metric>"
        reference: "<if exists>"

  baseline:
    status: EXISTS | MISSING
    metrics:
      <metric>: <value if exists>

  ready: true | false
```

**If not ready:** Guide user through building missing components using the evaluation-infrastructure skill.

**If ready:** Proceed to Layer 2.

---

## Step 2: Define Optimization Target (Layer 2)

Load skill:
```
Read: ${CLAUDE_PLUGIN_ROOT}/skills/optimization-target/SKILL.md
```

### Define Goal

Ask user:

```
What do you want to improve?

**Goal metric:** Which metric to optimize?
(List metrics from Layer 1 graders)

**Current value:** <from baseline>
**Target value:** What's the goal?
```

### Define Constraints

Ask user:

```
What are your constraints?

**Hard boundaries (MUST NOT change):**
- Are there files/components that cannot be touched?
- List paths that are frozen.

**Regression guards (MUST NOT get worse):**
- Which metrics cannot regress?
- What are the minimum thresholds?

**Soft preferences (SHOULD respect):**
- Any preferences that aren't hard requirements?
```

### Define Optimization Surface

Ask user:

```
What will you be adjusting?

**Main knob type:**
- CONFIG: Tune parameter values (model, style, thresholds)
- PROMPT: Modify prompt content
- GRADER: Refine evaluation criteria
- CODE: Change implementation (within boundaries)

**Main knob location:** Path to what you're changing

**Frozen areas:** What's explicitly off-limits?
(Confirm against hard boundaries)
```

### Build Layer 2 Specification

```yaml
optimization_target:
  goal:
    metric: "<metric>"
    current: <value>
    target: <value>

  constraints:
    hard:
      boundaries:
        - path: "<frozen path>"
      regressions:
        - metric: "<metric>"
          threshold: <value>

  optimization_surface:
    main_knob:
      type: config | prompt | grader | code
      location: "<path>"
    frozen:
      - "<path>"
```

---

## Step 3: Generate Cloud Prompt (Layer 3)

Load skill and template:
```
Read: ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/SKILL.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/references/loop-prompt-template.md
```

### Assemble Variables

From Layer 1:
- `{{DATASET}}` - Dataset reference and access method
- `{{GRADERS}}` - Grader list with invocation methods
- `{{BASELINE}}` - Baseline metrics

From Layer 2:
- `{{GOAL_METRIC}}` - Metric to optimize
- `{{CURRENT_VALUE}}` - Baseline value
- `{{GOAL_TARGET}}` - Target value
- `{{MAIN_KNOB_TYPE}}` - Type of knob
- `{{MAIN_KNOB_LOCATION}}` - Path to knob
- `{{MAIN_KNOB}}` - Full knob specification
- `{{HARD_BOUNDARIES}}` - Frozen paths
- `{{REGRESSION_GUARDS}}` - Metrics that cannot regress
- `{{FROZEN}}` - Off-limits areas

From config:
- `{{MAX_ITERATIONS}}` - Iteration limit (from argument or default 5)

### Generate and Output

Substitute variables into template and present:

```
═══════════════════════════════════════════════════════════════
GENERATED OPTIMIZATION PROMPT
═══════════════════════════════════════════════════════════════

**Framework Summary:**

Layer 1 (Eval Infrastructure):
  Dataset: <reference> (<size> tasks)
  Graders: <list>
  Baseline: <metrics>

Layer 2 (Optimization Target):
  Goal: <metric> <current> → <target>
  Main knob: <type> @ <location>
  Constraints: <summary>

Layer 3 (Execution):
  Max iterations: <N>

───────────────────────────────────────────────────────────────

Copy this prompt to your cloud coding agent(s):

---

<generated prompt from template>

---

═══════════════════════════════════════════════════════════════
USAGE
═══════════════════════════════════════════════════════════════

**Single run:**
1. Copy the prompt above
2. Paste into cloud coding agent
3. Review FINAL REPORT

**Parallel runs (compare approaches):**
1. Copy the prompt
2. Paste into multiple environments (different models)
3. Each runs independently with same constraints
4. Compare FINAL REPORT sections across runs
5. Select best changes, merge learnings

**Output format is consistent** - easy to diff across runs.
```

---

## Step 4: Offer Options

```
What next?

1. **Save to file** - Write prompt to .md file
2. **Modify** - Adjust target, constraints, or iterations
3. **View best practices** - Review eval guidelines
4. **Done** - Ready to execute
```

---

## Quick Start Paths

### Path A: Full Infrastructure Exists

```
User: "I have a dataset, graders, and baseline. Want to optimize X."

→ Skip to Layer 2 (define target)
→ Generate prompt
```

### Path B: Have Data, Need Graders

```
User: "I have production traces but no formal graders."

→ Layer 1: Guide grader creation
→ Layer 1: Establish baseline
→ Layer 2: Define target
→ Generate prompt
```

### Path C: Starting Fresh

```
User: "I need to set up evaluation from scratch."

→ Layer 1: Guide dataset creation
→ Layer 1: Guide grader creation
→ Layer 1: Establish baseline
→ Layer 2: Define target
→ Generate prompt
```

---

## References

- `${CLAUDE_PLUGIN_ROOT}/skills/evaluation-infrastructure/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-target/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/references/agent-eval-best-practices.md`
