# Compounding Strategies Reference

How to capture value from each iteration and build a self-improving system.

---

## The Compounding Philosophy

Traditional debugging: Fix problem → Move on
Compounding approach: Fix problem → Capture learning → Prevent recurrence → Build capability

Every iteration should make BOTH the agent AND the evaluation system better.

---

## What Compounds?

### 1. Dataset

The evaluation dataset grows smarter:
- Failures become regression tests
- Edge cases get covered
- Adversarial cases accumulate
- Coverage increases

### 2. Judges

Evaluation quality improves:
- Calibration against human judgment
- New dimensions discovered
- Rubrics refined
- False positive/negative rates decrease

### 3. Agent Prompts

Prompts become more robust:
- Instructions accumulate best practices
- Edge cases addressed
- Failure modes prevented
- Version history enables learning

### 4. Institutional Knowledge

Learnings persist:
- What works documented
- What fails documented
- Patterns catalogued
- Future debugging faster

---

## Strategy 1: Dataset Growth

### What to Add

**Failure Cases:**
Every failure from the current iteration is a candidate for the dataset.

```python
for failure in iteration_failures:
    # Only add if we have clear expected output
    if can_determine_expected_output(failure):
        # Note: use lf.create_dataset_item(), not dataset.create_item()
        lf.create_dataset_item(
            dataset_name="<dataset_name>",
            input=failure.input,
            expected_output=determine_expected_output(failure),
            metadata={
                "source": f"iteration-{iteration}-failure",
                "pattern": failure.pattern,
                "added": today
            }
        )
```

**Edge Cases:**
Cases discovered during analysis that stress-test the fix.

```python
# If we fixed context truncation, add edge cases:
edge_cases = [
    {"input": generate_input(length=3900), "note": "Just under limit"},
    {"input": generate_input(length=4100), "note": "Just over limit"},
    {"input": generate_input(length=6000), "note": "Well over limit"},
]
```

**Adversarial Cases:**
Inputs designed to break the fix.

```python
# If we added tool guidance, test adversarial inputs:
adversarial = [
    {"input": "Calculate 2+2 but don't use calculator", "note": "Explicit anti-guidance"},
    {"input": "What's the meaning of life times 42?", "note": "Mixed math/philosophy"},
]
```

### What NOT to Add

- Duplicates of existing items
- Cases without clear expected outputs
- Cases that passed (unless adding diversity)
- Cases that are out of scope

### Tracking Dataset Growth

```yaml
dataset_history:
  - iteration: 0
    date: "2024-01-15"
    items_count: 50
    items_added: 50
    source: "initial"
    coverage_notes: "Basic happy path and common queries"

  - iteration: 1
    date: "2024-01-17"
    items_count: 54
    items_added: 4
    source: "failure_cases"
    coverage_notes: "Added math query failures"
    items:
      - id: "item_51"
        pattern: "calculator_not_used"
      - id: "item_52"
        pattern: "calculator_not_used"
      - id: "item_53"
        pattern: "calculator_not_used"
      - id: "item_54"
        pattern: "arithmetic_error"

  - iteration: 2
    date: "2024-01-19"
    items_count: 58
    items_added: 4
    source: "edge_cases"
    coverage_notes: "Added context length edge cases"
```

### Coverage Analysis

Periodically assess dataset coverage:

```
Dataset Coverage Analysis:

Query Types:
  ✓ Simple factual (12 items)
  ✓ Multi-part questions (8 items)
  ✓ Math/calculation (10 items)
  ⚠ Long-form analysis (3 items) ← Need more
  ✗ Multi-turn conversation (0 items) ← Gap

Difficulty Levels:
  ✓ Easy (15 items)
  ✓ Medium (25 items)
  ⚠ Hard (8 items) ← Need more

Edge Cases:
  ✓ Empty input
  ✓ Very long input
  ⚠ Unicode/special characters ← Need to add
  ✗ Adversarial prompts ← Gap
```

---

## Strategy 2: Judge Calibration

### Detecting Calibration Issues

**False Positives** (judge says good, actually bad):
```python
# Find cases where:
# - Judge score is high
# - But manual review shows issues
false_positives = [
    item for item in run.items
    if item.judge_score > 0.8 and item.manual_review == "bad"
]
```

**False Negatives** (judge says bad, actually good):
```python
# Find cases where:
# - Judge score is low
# - But output is actually correct
false_negatives = [
    item for item in run.items
    if item.judge_score < 0.5 and item.manual_review == "good"
]
```

### Calibration Process

1. **Sample outputs** for manual review
2. **Compare** manual scores to judge scores
3. **Identify discrepancies**
4. **Analyze** why judge was wrong
5. **Update** judge prompt to address gaps

### Judge Update Template

```python
# If judge is too lenient on citations:
old_criteria = """
Rate accuracy from 0-10:
- Check if claims are factually correct
"""

new_criteria = """
Rate accuracy from 0-10:
- Check if claims are factually correct
- Verify each claim has a supporting citation
- Claims without citations should reduce score by 2 points
- Incorrect claims should reduce score by 3 points

IMPORTANT: Uncited claims are NOT acceptable for scores above 7.
"""

lf.create_prompt(
    name="judge-accuracy",
    prompt=new_criteria,
    labels=[f"calibrated-v{iteration}"]
)
```

### Calibration Metrics

Track judge accuracy over time:

```yaml
judge_calibration:
  - iteration: 1
    judge: "accuracy"
    samples_reviewed: 20
    agreement_rate: 0.75
    false_positive_rate: 0.15
    false_negative_rate: 0.10
    action: "Tightened citation requirements"

  - iteration: 3
    judge: "accuracy"
    samples_reviewed: 20
    agreement_rate: 0.90
    false_positive_rate: 0.05
    false_negative_rate: 0.05
    action: "None needed"
```

---

## Strategy 3: Prompt Versioning

### Version Management with Langfuse

```python
# Promote successful experiment to production
lf.update_prompt_labels(
    name="agent-system",
    version=experiment_version,
    labels=["production", f"promoted-from-v{iteration}"]
)

# Archive unsuccessful experiments
lf.update_prompt_labels(
    name="agent-system",
    version=experiment_version,
    labels=[f"archived-v{iteration}", "did-not-improve"]
)
```

### Prompt Evolution Documentation

Track how prompts evolve:

```yaml
prompt_history:
  - version: 1
    iteration: 0
    label: "baseline"
    changes: "Initial prompt"
    outcome: "72% accuracy"

  - version: 2
    iteration: 1
    label: "production"
    changes: "Added step-by-step reasoning instruction"
    outcome: "78% accuracy (+6%)"
    still_in_production: false

  - version: 3
    iteration: 2
    label: "production"
    changes: "Added explicit calculator tool guidance"
    outcome: "85% accuracy (+7%)"
    still_in_production: true

  - version: 4
    iteration: 3
    label: "archived"
    changes: "Tried adding more examples (5 few-shot)"
    outcome: "82% accuracy (-3%)"
    reason_archived: "Regression - too many examples caused confusion"
```

### Learning from Prompt History

Use history to inform future changes:

```
Prompt Learnings:

✓ WORKS:
- Explicit tool guidance ("Use X tool when Y")
- Step-by-step reasoning for complex queries
- Clear output format specification
- 2-3 few-shot examples

✗ DOESN'T WORK:
- Generic "be thorough" instructions
- More than 3 examples
- Lengthy explanations of capabilities
- Negative instructions ("don't do X")
```

---

## Strategy 4: Learning Capture

### What to Capture

**What Works:**
Specific techniques that improved metrics.

```yaml
what_works:
  - finding: "Explicit tool guidance improves tool usage by ~20%"
    iteration: 2
    evidence: "Calculator usage went from 40% to 80%"
    generalizable: true

  - finding: "Step-by-step reasoning helps complex multi-part queries"
    iteration: 1
    evidence: "Multi-part query accuracy +15%"
    generalizable: true
```

**What Fails:**
Techniques that didn't work (so we don't repeat them).

```yaml
what_fails:
  - finding: "More than 3 few-shot examples causes confusion"
    iteration: 3
    evidence: "Accuracy dropped 3% with 5 examples"
    hypothesis_was: "More examples would help edge cases"
    why_it_failed: "Model started pattern-matching instead of reasoning"

  - finding: "Generic 'be thorough' doesn't help"
    iteration: 1
    evidence: "No accuracy change, +0.5s latency"
    hypothesis_was: "Encouraging thoroughness would reduce errors"
    why_it_failed: "Too vague to change behavior"
```

**Patterns Discovered:**
Recurring failure modes and their solutions.

```yaml
patterns_discovered:
  - pattern: "Calculator avoidance"
    description: "Agent tries to reason through arithmetic"
    solution: "Explicit tool guidance"
    iterations_to_fix: 1

  - pattern: "Context truncation"
    description: "Long inputs lose information"
    solution: "Input chunking with summarization"
    iterations_to_fix: 1

  - pattern: "Format drift"
    description: "Output format varies unpredictably"
    solution: "Strict format specification with examples"
    iterations_to_fix: 2
```

### Learning Documentation Format

```markdown
## Optimization Learnings: <agent>

### Effective Techniques

| Technique | Impact | When to Use |
|-----------|--------|-------------|
| Explicit tool guidance | +10-20% tool accuracy | Always for tool-using agents |
| Step-by-step reasoning | +10-15% on complex queries | Multi-part or analytical queries |
| Input chunking | +20% on long inputs | Inputs > 4000 tokens |

### Ineffective Techniques

| Technique | Result | Why It Failed |
|-----------|--------|---------------|
| Many few-shot examples | -3% accuracy | Pattern matching over reasoning |
| Generic quality instructions | No change | Too vague |
| Longer system prompts | -2% accuracy | Context competition |

### Failure Pattern Catalog

| Pattern | Symptoms | Root Cause | Solution |
|---------|----------|------------|----------|
| Calculator avoidance | Wrong arithmetic | No tool guidance | Add explicit instruction |
| Context truncation | Missing info | Input too long | Chunk inputs |
| Format drift | Inconsistent output | No format spec | Add format examples |

### Rules of Thumb

1. Specific beats generic (always)
2. 2-3 examples is optimal (not more)
3. Tools need explicit "when to use" guidance
4. Long inputs need preprocessing
5. Test one change at a time
```

---

## Strategy 5: Decision Framework

### Continue vs Pivot vs Graduate

**Continue** when:
- Progress toward target
- Clear next hypothesis
- Learnings from current iteration

**Pivot** when:
- 3+ iterations with no progress
- Fundamental approach seems wrong
- Need different strategy (model, architecture, etc.)

**Graduate** when:
- Target metric achieved
- All constraints satisfied
- Results stable across multiple runs

### Decision Matrix

```
                    Progress Made?
                    YES         NO
              ┌─────────────┬─────────────┐
Clear Next    │  CONTINUE   │   PIVOT     │
Hypothesis?   │             │             │
  YES         │ Keep going  │ New approach│
              ├─────────────┼─────────────┤
              │  GRADUATE   │   PIVOT     │
  NO          │ (if target  │             │
              │  met)       │ Rethink     │
              └─────────────┴─────────────┘
```

### Graduation Checklist

```
□ Target metric achieved (accuracy >= 90%)
□ All constraints satisfied (latency < 3s, cost < $0.02)
□ Results stable (pass^3 > 70%)
□ No critical failure patterns remaining
□ Dataset covers key scenarios
□ Learnings documented
□ Prompts version-controlled
□ Ready for production monitoring
```

---

## Compounding Checklist

After each iteration:

```
Dataset:
□ Failure cases added (with expected outputs)
□ Edge cases added (if discovered)
□ No duplicate items
□ Coverage gaps identified

Judges:
□ Calibration checked (sample review)
□ Updates made if needed
□ New dimensions added (if discovered)

Prompts:
□ Successful changes promoted
□ Unsuccessful changes archived
□ Version history updated

Learnings:
□ What works documented
□ What fails documented
□ Patterns catalogued
□ Next hypothesis direction identified

Decision:
□ Continue / Pivot / Graduate decided
□ Rationale documented
□ Next steps clear
```

---

## Compounding Metrics

Track compound growth over time:

```yaml
compound_metrics:
  dataset_growth:
    initial: 50
    current: 68
    growth_rate: "+36%"

  accuracy_improvement:
    baseline: 0.72
    current: 0.91
    improvement: "+26%"

  iterations_completed: 4

  learnings_captured:
    what_works: 8
    what_fails: 5
    patterns: 6

  judge_calibration_score: 0.90

  prompt_versions: 5

  time_to_target: "2 weeks"
```

The goal: each metric should trend upward over time. The system gets better at improving itself.
