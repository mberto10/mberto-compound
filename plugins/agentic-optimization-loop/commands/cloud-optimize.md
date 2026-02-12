---
name: cloud-optimize
description: Generate a cloud-ready optimization prompt from validated eval contract and optimization target.
arguments:
  - name: iterations
    description: Maximum optimization iterations (default 5)
    required: false
  - name: agent
    description: Agent name used for contract snapshot lookup
    required: false
  - name: lever-mode
    description: Lever strategy: single or multi
    required: false
  - name: max-levers
    description: Maximum levers allowed when lever-mode=multi (1..5)
    required: false
---

# Cloud Optimize Command

Generate a self-contained cloud execution prompt for the same optimization loop used locally.

## Step 1: Resolve Strategy Inputs

Determine:
- `lever_mode` (default `single`)
- `max_levers` (single=>1, multi default=>3, cap=>5)
- `iterations` (default 5)

Validation:
- enforce `1..5`
- fail fast on invalid input

## Step 2: Contract Preflight (Required)

Resolve local snapshot and live-validate identifiers:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

If contract fails preflight:
- stop prompt generation
- emit deterministic handoff to Langfuse Analyzer setup/status commands

## Step 3: Load Target + Loop Guidance

Read:
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-target/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/references/loop-prompt-template.md`

## Step 4: Build Prompt Variables

Include core variables plus lever strategy variables:
- `{{LEVER_MODE}}`
- `{{MAX_LEVERS}}`

Policy text to include in generated prompt:
- single mode => exactly one lever per hypothesis
- multi mode => 2..N levers per hypothesis
- strict guard/rollback policy unchanged across both modes
- score semantics are canonical `0-1`

## Step 5: Output

Return:
1. Contract summary (dataset, dimensions, baseline)
2. Target summary (goal, constraints, knob)
3. Lever strategy summary (`lever_mode`, `max_levers`)
4. Final cloud prompt body
