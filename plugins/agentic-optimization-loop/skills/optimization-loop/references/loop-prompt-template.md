# Optimization Loop Cloud Prompt Template

Self-contained prompt for cloud-based coding agents.

## Template

```markdown
# Optimization Loop Execution

You are executing an optimization loop to improve an AI agent's performance.
Follow this protocol strictly.

## Context

Goal: improve `{{GOAL_METRIC}}` from `{{CURRENT_VALUE}}` to `{{GOAL_TARGET}}`
Main knob: `{{MAIN_KNOB_TYPE}}` at `{{MAIN_KNOB_LOCATION}}`
Max iterations: `{{MAX_ITERATIONS}}`
Lever mode: `{{LEVER_MODE}}`
Max levers: `{{MAX_LEVERS}}`
Score scale: canonical `0-1` (any 0-10 display is non-authoritative)

## Evaluation Contract Inputs

Dataset:
{{DATASET}}

Graders / Signals:
{{GRADERS}}

Baseline:
{{BASELINE}}

## Constraints

Hard boundaries:
{{HARD_BOUNDARIES}}

Regression guards:
{{REGRESSION_GUARDS}}

Frozen scope:
{{FROZEN}}

## Lever Policy

- If `{{LEVER_MODE}}=single`: propose and apply exactly ONE lever.
- If `{{LEVER_MODE}}=multi`: propose and apply 2..`{{MAX_LEVERS}}` levers.
- Boundary checks are mandatory before applying any change-set.
- Decision policy is unchanged across modes (same strict guards and rollback criteria).

## Iteration Protocol

For each iteration:

1. DIAGNOSE
- identify top failure patterns and prioritized target pattern

2. HYPOTHESIZE
- propose lever change-set according to lever policy
- include expected impact and risk
- include boundary check result

3. EXPERIMENT
- apply change-set
- run evaluation
- collect goal + guard metrics

4. ANALYZE
- compare vs previous/baseline
- report deltas on canonical 0-1 scale

5. COMPOUND / DECIDE
- KEEP if improved and all guards pass
- ROLLBACK otherwise
- choose CONTINUE / GRADUATE / STOP

## Required Output Sections

Per iteration:
- `[DIAGNOSE]`
- `[HYPOTHESIZE]`
- `[EXPERIMENT]`
- `[ANALYZE]`
- `[COMPOUND]`
- `[DECIDE]`

In `[HYPOTHESIZE]`, always include:
- `lever_set`
- `lever_set_size`
- `attribution_confidence` (`high|medium|low`; use `low|medium` for multi unless strongly justified)

Final section:
- `FINAL REPORT` with metric journey, kept changes, rollback events, and key learnings.
```

## Variables

| Variable | Description |
|---|---|
| `{{GOAL_METRIC}}` | Metric being optimized |
| `{{CURRENT_VALUE}}` | Baseline/current value |
| `{{GOAL_TARGET}}` | Target value |
| `{{MAIN_KNOB_TYPE}}` | config/prompt/grader/code |
| `{{MAIN_KNOB_LOCATION}}` | Path/reference of knob |
| `{{DATASET}}` | Dataset reference |
| `{{GRADERS}}` | Signal/grader definitions |
| `{{BASELINE}}` | Baseline metrics |
| `{{HARD_BOUNDARIES}}` | Hard immutable boundaries |
| `{{REGRESSION_GUARDS}}` | Must-not-regress metrics |
| `{{FROZEN}}` | Off-limits areas |
| `{{MAX_ITERATIONS}}` | Iteration limit |
| `{{LEVER_MODE}}` | `single` or `multi` |
| `{{MAX_LEVERS}}` | Lever cap for multi mode |
