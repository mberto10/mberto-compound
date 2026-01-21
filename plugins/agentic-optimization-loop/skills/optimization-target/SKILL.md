---
name: optimization-target
description: Layer 2 of the optimization framework. Define what to optimize - the goal, constraints (hard and soft), and the optimization surface (what can change vs. what's frozen).
version: 1.0.0
---

# Optimization Target (Layer 2)

Define precisely what you're optimizing toward. This skill produces a complete specification of goal, constraints, and optimization surface that Layer 3 (optimization-loop) will execute against.

**Requires:** Complete evaluation infrastructure (Layer 1)

**Produces:** Optimization target specification

---

## The Three Components

```
┌─────────────────────────────────────────────────────────────┐
│                   OPTIMIZATION TARGET                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ GOAL                                                    │ │
│  │ What metric to improve, to what target                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ CONSTRAINTS                                             │ │
│  │ Hard: MUST NOT violate (boundaries, regressions)        │ │
│  │ Soft: SHOULD respect (preferences)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ OPTIMIZATION SURFACE                                    │ │
│  │ Main knob: what to adjust                               │ │
│  │ Frozen: what cannot change                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Goal Specification

### Define the Primary Metric

The single metric that represents "success" for this optimization.

```yaml
goal:
  metric:
    name: "<metric name from graders>"
    grader: "<which grader produces this>"

  current_value: <from baseline>
  target_value: <what to achieve>

  direction: maximize | minimize

  rationale: "<why this metric matters>"
```

### Goal Types

| Type | Description | Example |
|------|-------------|---------|
| **Metric improvement** | Improve a specific measured value | accuracy: 72% → 90% |
| **Behavioral** | Achieve a qualitative outcome | "write like WSJ journalist" |
| **Reliability** | Increase consistency | pass^5: 30% → 80% |
| **Efficiency** | Reduce cost/latency while maintaining quality | latency: 5s → 2s (quality unchanged) |

### For Behavioral Goals

When the goal is qualitative (not a pre-existing metric):

```yaml
goal:
  type: behavioral
  description: "<what the output should be like>"

  exemplars:
    - description: "<example of desired behavior>"
      source: "<where this example comes from>"

  operationalized_as:
    metric: "<new metric name>"
    grader:
      type: model
      criteria:
        - "<specific criterion derived from goal>"
      target: <numeric target>

  rationale: "<why this behavior matters>"
```

---

## 2. Constraints

### Hard Constraints (MUST NOT violate)

Violations stop optimization immediately.

#### Boundary Constraints (what cannot change)

```yaml
constraints:
  hard:
    boundaries:
      must_not_change:
        - path: "<file or component path>"
          reason: "<why it's frozen>"
        - path: "<another path>"
          reason: "<reason>"

      rationale: "<overall reason for these boundaries>"
```

**Examples:**
- Model configuration (must use specific model)
- Style rules for specific content types
- Security-critical code
- External API contracts

#### Regression Constraints (metrics that cannot get worse)

```yaml
constraints:
  hard:
    regressions:
      - metric: "<metric name>"
        threshold: <minimum acceptable value>
        current: <baseline value>
        rationale: "<why this cannot regress>"

      - metric: "<another metric>"
        threshold: <value>
        current: <value>
        rationale: "<reason>"
```

**Examples:**
- Accuracy must stay above 85%
- Latency must stay under 3s
- Zero hallucinations (threshold: 0)
- Zero safety violations

#### Invariant Constraints (must always hold)

```yaml
constraints:
  hard:
    invariants:
      - condition: "<what must always be true>"
        check: "<how to verify>"
        rationale: "<why this matters>"
```

**Examples:**
- All outputs must be valid JSON
- Must cite at least 2 sources
- Must not exceed token budget

### Soft Constraints (SHOULD respect)

Violations don't stop optimization but factor into decisions.

```yaml
constraints:
  soft:
    preferences:
      - preference: "<what's preferred>"
        weight: <0-1 importance>
        rationale: "<why this is preferred>"

    tradeoffs:
      - description: "<acceptable tradeoff>"
        limit: "<how far to trade>"
```

**Examples:**
- Prefer shorter outputs (but acceptable if longer)
- Prefer using fewer API calls (but acceptable if needed)
- Prefer simpler prompts (but acceptable if complex works better)

---

## 3. Optimization Surface

### The Main Knob

What you're actually adjusting to reach the goal.

```yaml
optimization_surface:
  main_knob:
    type: config | prompt | grader | code | architecture

    # For config:
    parameters:
      - name: "<param name>"
        type: string | number | enum | boolean
        current: <current value>
        range: [<min>, <max>] | [<option1>, <option2>]
        description: "<what this controls>"

    # For prompt:
    location: "<path to prompt>"
    sections:
      - name: "<section that can change>"
        current_content: "<current text>"

    # For grader:
    location: "<path to grader>"
    aspects:
      - "<what aspect can change>"

    # For code:
    location: "<path to code>"
    scope: "<what part of the code>"
    constraints: "<any limits on code changes>"
```

### Main Knob Types

| Type | What Changes | Example |
|------|--------------|---------|
| **Config** | Parameter values only | `writer_style: "formal"` → `"analytical"` |
| **Prompt** | Prompt content | Add examples, restructure instructions |
| **Grader** | Evaluation criteria | Refine rubric, add criteria |
| **Code** | Implementation logic | Modify processing steps |
| **Architecture** | Structural design | Add/remove pipeline stages |

### Frozen Areas

What absolutely cannot be touched.

```yaml
optimization_surface:
  frozen:
    - path: "<path>"
      reason: "<why frozen>"
    - path: "<path>"
      reason: "<reason>"
```

### Change Scope

Define the boundary of what's in scope.

```yaml
optimization_surface:
  scope:
    in_scope:
      - "<what can be changed>"
    out_of_scope:
      - "<what cannot be changed>"

    change_magnitude:
      description: "<how big can changes be?>"
      limit: "<e.g., no structural changes, only wording>"
```

---

## Putting It Together

### Complete Optimization Target Specification

```yaml
optimization_target:
  name: "<descriptive name for this optimization>"
  created: "<date>"

  # Requires Layer 1 to be complete
  evaluation_infrastructure:
    reference: "<path or ID to Layer 1 spec>"
    baseline_run: "<baseline reference>"

  goal:
    metric: "<metric name>"
    current: <value>
    target: <value>
    direction: maximize | minimize
    type: metric | behavioral | reliability | efficiency

  constraints:
    hard:
      boundaries:
        must_not_change:
          - path: "<path>"
            reason: "<reason>"
      regressions:
        - metric: "<metric>"
          threshold: <value>
      invariants:
        - condition: "<condition>"
          check: "<verification method>"

    soft:
      preferences:
        - preference: "<preference>"
          weight: <0-1>

  optimization_surface:
    main_knob:
      type: <type>
      location: "<path>"
      # type-specific details...

    frozen:
      - path: "<path>"
        reason: "<reason>"

    scope:
      in_scope: ["<what's changeable>"]
      out_of_scope: ["<what's not>"]

  validation:
    ready: true | false
    issues: ["<any issues to resolve>"]
```

---

## Validation Checklist

Before proceeding to Layer 3:

### Goal Validation
- [ ] Metric exists in evaluation infrastructure
- [ ] Current value is from baseline
- [ ] Target is achievable (not 0% → 100% in one loop)
- [ ] Target is meaningful (not already at target)

### Constraint Validation
- [ ] Hard boundaries are specific paths/components
- [ ] Regression thresholds are measurable
- [ ] Constraints don't conflict with goal
- [ ] Constraints are testable during optimization

### Surface Validation
- [ ] Main knob is clearly defined
- [ ] Main knob can actually affect the goal metric
- [ ] Frozen areas don't include the main knob
- [ ] Scope is realistic for optimization loop

---

## Common Patterns

### Pattern: Config-Only Optimization

```yaml
optimization_surface:
  main_knob:
    type: config
    parameters:
      - name: "style"
        type: enum
        current: "casual"
        range: ["formal", "casual", "technical"]
      - name: "verbosity"
        type: number
        current: 0.5
        range: [0, 1]

  frozen:
    - path: "src/**"
      reason: "Code is frozen, config only"
```

### Pattern: Prompt Optimization

```yaml
optimization_surface:
  main_knob:
    type: prompt
    location: "prompts/main.md"
    sections:
      - name: "instructions"
        current_content: "..."
      - name: "examples"
        current_content: "..."

  frozen:
    - path: "prompts/system.md"
      reason: "System prompt is standardized"
```

### Pattern: Grader Optimization

```yaml
optimization_surface:
  main_knob:
    type: grader
    location: "graders/readability.py"
    aspects:
      - "scoring criteria"
      - "threshold values"

  frozen:
    - path: "graders/accuracy.py"
      reason: "Accuracy grader is validated"
    - path: "config/style_rules/**"
      reason: "Style rules are fixed"
```

---

## References

- `references/goal-patterns.md` - Common goal types with examples
- `references/constraint-patterns.md` - Constraint specification patterns
- `references/knob-types.md` - Detailed guide to each knob type
