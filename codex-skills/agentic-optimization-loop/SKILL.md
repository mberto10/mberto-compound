---
name: agentic-optimization-loop
description: Three-layer optimization framework ported to Codex. Use this to define evaluation infrastructure, define optimization target, generate cloud optimization prompts, and view optimization status. For interactive local loops, defer to agentic-optimization-craft.
version: 0.1.0
---

# Agentic Optimization Loop (Codex)

This skill ports the plugin @plugins/agentic-optimization-loop into Codex-native workflows. It focuses on the three-layer framework and cloud prompt generation. It does not replace the interactive loop; use `agentic-optimization-craft` for that.

## When to Use

Use this skill when the user asks to:
- "generate a cloud optimization prompt"
- "define evaluation infrastructure" or "layer 1 spec"
- "define optimization target" or "layer 2 spec"
- "show optimization status"
- "three-layer optimization framework"

## Outputs (Files)

All outputs live under:
```
.claude/optimization-loops/<agent>/
```

- `layer1.yaml` - Evaluation infrastructure spec
- `layer2.yaml` - Optimization target spec
- `cloud-optimize-<agent>.md` - Generated cloud prompt
- `status.md` (optional) - Snapshot of current status

## Modes

This skill runs in four modes. Ask which one the user wants if not obvious.

1) **Layer 1: Evaluation Infrastructure**
2) **Layer 2: Optimization Target**
3) **Layer 3: Cloud Optimize Prompt**
4) **Status View**

## Mode 1: Layer 1 - Evaluation Infrastructure

**Goal:** capture dataset, graders, harness, and baseline.

Ask for:
- Dataset reference and size
- Graders (name, type, reference, metric)
- Harness reference (script or system)
- Baseline metrics and run reference

Write `layer1.yaml` using this shape:
```yaml
evaluation_infrastructure:
  dataset:
    reference: "<path or dataset name>"
    size: <count>
  graders:
    - name: "<grader name>"
      type: code | model | human
      reference: "<path or system>"
      metric: "<metric name>"
  harness:
    reference: "<path or system>"
  baseline:
    reference: "<run id or location>"
    metrics:
      <metric>: <value>
```

If missing inputs, direct users to:
- `evaluation-design`
- `langfuse-dataset-setup`
- `langfuse-dataset-management`
- `langfuse-agent-eval-setup`

## Mode 2: Layer 2 - Optimization Target

**Goal:** define what to optimize and what must not change.

Ask for:
- Primary goal metric (from graders)
- Current value (baseline)
- Target value
- Hard boundaries (paths or components)
- Regression guards (metrics with thresholds)
- Main knob (config, prompt, grader, code)
- Frozen areas (explicitly off-limits)

Write `layer2.yaml` using this shape:
```yaml
optimization_target:
  goal:
    metric: "<metric>"
    current: <value>
    target: <value>
    direction: maximize | minimize
  constraints:
    hard:
      boundaries:
        - path: "<frozen path>"
      regressions:
        - metric: "<metric>"
          threshold: <value>
  optimization_surface:
    main_knob:
      type: config | prompt | grader | code | architecture
      location: "<path>"
    frozen:
      - "<path>"
```

## Mode 3: Layer 3 - Cloud Optimize Prompt

**Goal:** generate a self-contained prompt for cloud execution.

Steps:
1. Load `layer1.yaml` and `layer2.yaml`
2. Ask for max iterations (default 5)
3. Fill `references/loop-prompt-template.md`
4. Write `cloud-optimize-<agent>.md`

Always prepend a short summary:
```
Framework Summary:
- Goal: <metric> <current> -> <target>
- Main knob: <type> @ <location>
- Dataset: <reference> (<size>)
- Graders: <list>
- Baseline: <metrics>
- Constraints: <boundaries + regression guards>
```

## Mode 4: Status View

**Goal:** read `journal.yaml` and show a concise status.

If `agent` not provided, list all journals under:
```
.claude/optimization-loops/*/journal.yaml
```

If `agent` provided, summarize:
- current_phase
- current_iteration
- metrics trajectory (baseline, current, target)
- last activity

Optionally write `status.md` if the user asks to save.

## Notes

- Use `agentic-optimization-craft` for interactive loops and journal updates.
- This skill does not run evals; it prepares specs and prompts.

## References

- `references/evaluation-infrastructure.md`
- `references/optimization-target.md`
- `references/loop-prompt-template.md`
- `references/journal-schema.md`
