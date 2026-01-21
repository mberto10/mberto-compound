---
name: evaluation-infrastructure
description: Layer 1 of the optimization framework. Assess, build, or reference evaluation infrastructure (dataset, graders, harness, baseline). Must be complete before optimization can run.
version: 1.0.0
---

# Evaluation Infrastructure (Layer 1)

Establish the foundation required for any optimization loop. This skill helps you assess what exists, build what's missing, and produce a complete evaluation infrastructure specification.

**Prerequisites for optimization:**
- Dataset (tasks with inputs + success criteria)
- Graders (how to score outputs)
- Harness (how to run evaluations)
- Baseline (current measurements)

---

## Assessment: What Exists?

### Step 1: Inventory Current State

For each component, determine status:

```yaml
evaluation_infrastructure:
  dataset:
    status: EXISTS | PARTIAL | MISSING
    details:
      location: "<path, URL, or reference>"
      size: <number of tasks>
      coverage: "<assessment of diversity>"
      quality: "<assessment of task clarity>"

  graders:
    status: EXISTS | PARTIAL | MISSING
    items:
      - name: "<grader name>"
        type: code | model | human
        location: "<path or reference>"
        metric: "<what it measures>"
        calibrated: true | false

  harness:
    status: EXISTS | PARTIAL | MISSING
    details:
      type: "<langfuse | custom | script>"
      location: "<path or reference>"
      capabilities:
        - isolated_trials: true | false
        - transcript_capture: true | false
        - parallel_execution: true | false

  baseline:
    status: EXISTS | MISSING
    details:
      run_reference: "<path or run ID>"
      date: "<when measured>"
      metrics:
        <metric>: <value>
```

### Step 2: Gap Analysis

| Component | Status | Gap | Action Needed |
|-----------|--------|-----|---------------|
| Dataset | ? | ? | ? |
| Graders | ? | ? | ? |
| Harness | ? | ? | ? |
| Baseline | ? | ? | ? |

---

## Building: Dataset

### If MISSING: Create from Scratch

**Sources for tasks:**
1. Production failures (highest value)
2. User feedback/complaints
3. Known edge cases
4. Synthetic generation
5. Public benchmarks (if applicable)

**Requirements per task:**
```yaml
task:
  id: "<unique identifier>"
  input: <the input to the agent>
  expected_output: <reference solution or criteria>
  success_criteria:
    - "<specific, unambiguous criterion>"
    - "<another criterion>"
  category: "<grouping for analysis>"
  metadata:
    source: "<where this task came from>"
    difficulty: easy | medium | hard
    tags: ["<tag1>", "<tag2>"]
```

**Quality checklist:**
- [ ] Two experts would agree on pass/fail
- [ ] Success criteria are specific, not vague
- [ ] Reference solution exists (where deterministic)
- [ ] Task is self-contained (no external dependencies)

**Balance requirements:**
- Include cases where behavior SHOULD occur
- Include cases where behavior should NOT occur
- Cover common cases AND edge cases
- Represent real production distribution

**Minimum viable dataset:** 20-50 tasks

### If PARTIAL: Curate from Traces

When production traces exist but no formal dataset:

1. **Sample traces** with diversity:
   - Different input types
   - Different outcomes (success, failure, partial)
   - Different time periods
   - Edge cases and common cases

2. **Label each trace:**
   - If good outcome → use as expected
   - If bad outcome → write what SHOULD have been
   - If unclear → flag for review

3. **Categorize** by:
   - Input type
   - Failure pattern
   - Difficulty level

### If EXISTS: Validate

Check existing dataset for:
- [ ] Sufficient size (20+ tasks)
- [ ] Balanced coverage
- [ ] Unambiguous tasks
- [ ] Up-to-date with current agent capabilities
- [ ] Not saturated (some tasks still fail)

---

## Building: Graders

### Grader Type Selection

| Scenario | Recommended Type |
|----------|------------------|
| Deterministic outcomes (file exists, test passes) | Code-based |
| Subjective quality (tone, helpfulness) | Model-based |
| Complex multi-factor (needs expertise) | Hybrid or Human |
| High-stakes validation | Human (at least for calibration) |

### Code-Based Grader Design

```python
def grader(input, output, expected):
    """
    Returns: {"pass": bool, "score": float, "details": str}
    """
    # Check outcome, not procedure
    # Allow multiple valid paths
    # Be specific about what constitutes pass
```

**Patterns:**
- String/regex matching
- JSON schema validation
- State verification (check end state)
- Tool-call verification (specific tools used)

### Model-Based Grader Design

```yaml
grader:
  name: "<metric_name>"
  type: model
  model: "<model to use for judging>"

  prompt: |
    You are evaluating {metric_name} of an agent's output.

    ## Task Input
    {input}

    ## Agent Output
    {output}

    ## Expected Output (reference)
    {expected}

    ## Evaluation Criteria
    {criteria}

    ## Scoring Scale
    {scale_description}

    Evaluate the output against each criterion.
    Output JSON: {"score": <number>, "reasoning": "<explanation>"}

  criteria:
    - criterion: "<specific thing to check>"
      description: "<what good looks like>"
      weight: <0-1>

  scale:
    type: "1-5"
    anchors:
      5: "<description of 5>"
      3: "<description of 3>"
      1: "<description of 1>"
```

**Critical: Calibration process**
1. Run on 5+ known-good outputs → should score high (4-5)
2. Run on 5+ known-bad outputs → should score low (1-2)
3. Check correlation with human judgment
4. Adjust criteria if misaligned

**Bias mitigations:**
- Randomize order in pairwise comparisons
- Use specific rubrics, not vague instructions
- Run multiple trials, aggregate results
- Periodically spot-check against human judgment

### Grader Specification Format

```yaml
graders:
  - name: "<grader_name>"
    type: code | model | human
    metric: "<what it measures>"

    # For code-based:
    implementation: "<path to code or inline>"

    # For model-based:
    model: "<model identifier>"
    prompt: "<evaluation prompt>"
    criteria: [<list of criteria>]
    scale: <scale specification>
    calibration:
      status: calibrated | needs_calibration
      last_calibrated: "<date>"
      human_correlation: <0-1>

    # For all:
    assertions:
      - condition: "<when this grader applies>"
        threshold: <minimum passing score>
```

---

## Building: Harness

### Minimum Requirements

- [ ] Can run agent on task input
- [ ] Can capture complete transcript
- [ ] Can pass output to graders
- [ ] Can aggregate results
- [ ] Isolates trials (clean state each run)

### Harness Specification

```yaml
harness:
  type: langfuse | custom | script

  execution:
    command: "<how to run agent on input>"
    timeout: <seconds>
    retries: <count>
    isolation: "<how trials are isolated>"

  transcript:
    capture: true
    format: "<format of captured transcript>"
    storage: "<where transcripts stored>"

  grading:
    automatic: true | false
    graders: [<list of grader references>]
    aggregation: "<how scores combined>"

  reporting:
    metrics: [<list of metrics to report>]
    format: "<output format>"
```

### Integration Options

**Langfuse (recommended):**
- Built-in dataset management
- Experiment tracking
- Score aggregation
- Trace storage

**Custom script:**
- Run agent programmatically
- Capture outputs
- Apply graders
- Store results

---

## Establishing: Baseline

### If No Baseline Exists

Run full evaluation with current configuration:
1. Execute all tasks in dataset
2. Apply all graders
3. Aggregate metrics
4. Store as baseline reference

```yaml
baseline:
  run_id: "<unique identifier>"
  date: "<timestamp>"
  configuration: "<description of agent config>"

  metrics:
    <primary_metric>: <value>
    <secondary_metric>: <value>

  distribution:
    pass_rate: <percentage>
    score_histogram: [<buckets>]

  notable_failures:
    - task_id: "<id>"
      failure_pattern: "<category>"
```

### If Baseline Exists

Validate it's still relevant:
- [ ] Same agent configuration being optimized
- [ ] Same dataset (or subset)
- [ ] Same graders
- [ ] Recent enough (agent hasn't changed significantly)

---

## Output: Complete Infrastructure Spec

After assessment and building, produce:

```yaml
evaluation_infrastructure:
  status: COMPLETE | INCOMPLETE
  missing: [<list of gaps if incomplete>]

  dataset:
    reference: "<location>"
    size: <count>
    categories: [<list>]
    balance_check: PASS | FAIL

  graders:
    - name: "<name>"
      type: <type>
      reference: "<location>"
      calibration: PASS | NEEDS_WORK

  harness:
    reference: "<location>"
    capabilities: [<list>]

  baseline:
    reference: "<run_id or location>"
    metrics:
      <metric>: <value>

  ready_for_optimization: true | false
```

---

## References

- `${PLUGIN_ROOT}/references/agent-eval-best-practices.md` - Comprehensive evaluation guide
- `references/dataset-templates.md` - Task templates by agent type
- `references/grader-templates.md` - Grader prompts and patterns
- `references/calibration-protocol.md` - How to calibrate model-based graders
