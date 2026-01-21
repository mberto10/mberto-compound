# Agentic Optimization Loop

A Claude Code plugin for systematic, iterative improvement of AI agents through hypothesis-driven experimentation. Based on Anthropic's agent evaluation best practices.

## Overview

This plugin implements a **three-layer framework** for AI agent optimization:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: EVALUATION INFRASTRUCTURE                          │
│ Dataset + Graders + Baseline                                │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: OPTIMIZATION TARGET                                │
│ Goal + Constraints + Main Knob                              │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: OPTIMIZATION LOOP                                  │
│ Diagnose → Hypothesize → Experiment → Compound → Decide     │
└─────────────────────────────────────────────────────────────┘
```

## Two Modes of Operation

### Local Interactive Mode (`/optimize`)

Run optimization loops interactively with persistent state:
- Journal-driven progress tracking
- Resume from where you left off
- Human-in-the-loop at each phase

### Cloud Execution Mode (`/cloud-optimize`)

Generate self-contained prompts for cloud-based coding agents:
- Run in parallel across multiple environments
- Compare results across different models
- Consistent output format for easy comparison

## The Three-Layer Framework

### Layer 1: Evaluation Infrastructure

Before optimizing, establish what you need to measure:

| Component | Purpose |
|-----------|---------|
| **Dataset** | Tasks with inputs + success criteria (20+ items) |
| **Graders** | How to score outputs (code, model, or human) |
| **Baseline** | Current measurements to improve from |

**Skill:** `evaluation-infrastructure`

### Layer 2: Optimization Target

Define what you're optimizing toward:

| Component | Purpose |
|-----------|---------|
| **Goal** | Metric to improve + target value |
| **Constraints** | Hard boundaries + regression guards |
| **Main Knob** | What you're adjusting (config, prompt, grader, code) |

**Skill:** `optimization-target`

### Layer 3: Optimization Loop

Execute iterations:

```
DIAGNOSE   → Analyze failures, find patterns
HYPOTHESIZE → Propose ONE change to main knob
EXPERIMENT  → Implement, run evaluation
COMPOUND    → Keep/rollback, capture learnings
DECIDE      → Continue, graduate, or stop
```

**Skill:** `optimization-loop`

## Commands

### `/optimize [agent]`

Interactive local optimization with persistent state.

```bash
/optimize my-agent
```

### `/optimize-status [agent]`

Check current optimization state.

```bash
/optimize-status my-agent
```

### `/cloud-optimize [iterations]`

Generate cloud-ready optimization prompt.

```bash
/cloud-optimize 5
```

Guides you through:
1. Assessing existing evaluation infrastructure
2. Defining optimization target and constraints
3. Generating self-contained prompt for cloud execution

## Quick Start Paths

### Path A: Full Infrastructure Exists

You have dataset, graders, and baseline.

```
→ /cloud-optimize
→ Define target (goal, constraints, main knob)
→ Generate prompt
→ Run in cloud
```

### Path B: Have Traces, Need Graders

You have production data but no formal evaluation.

```
→ /cloud-optimize
→ Build graders (Layer 1 guidance)
→ Establish baseline
→ Define target
→ Generate prompt
```

### Path C: Starting Fresh

Need to set up everything.

```
→ /cloud-optimize
→ Create dataset from production traces
→ Design graders
→ Establish baseline
→ Define target
→ Generate prompt
```

## Key Concepts

### Main Knob Types

| Type | What Changes | Example |
|------|--------------|---------|
| CONFIG | Parameter values | `style: "formal" → "analytical"` |
| PROMPT | Prompt content | Add examples, restructure |
| GRADER | Evaluation criteria | Refine rubric |
| CODE | Implementation | Modify logic (within boundaries) |

### Constraint Types

| Type | Purpose | Violation = |
|------|---------|-------------|
| Hard boundaries | Paths that cannot change | Immediate stop |
| Regression guards | Metrics that cannot get worse | Rollback |
| Soft preferences | Nice to have | Noted but continues |

### Metrics from Anthropic's Framework

| Metric | Measures | Use for |
|--------|----------|---------|
| pass@k | Works eventually? | Capability ceiling |
| pass^k | Reliably consistent? | Production readiness |

## State Persistence: The Journal

All optimization progress is tracked in:

```
.claude/optimization-loops/<agent-name>/
├── journal.yaml           # Full state (Layer 1 + 2 + 3 history)
├── iterations/            # Detailed per-iteration records
│   ├── 001-tool-guidance.md
│   └── 002-prompt-restructure.md
└── artifacts/             # Modified files
```

The journal captures:
- **Evaluation infrastructure** (dataset, graders, baseline)
- **Optimization target** (goal, constraints, main knob)
- **Iteration history** (every hypothesis, experiment, result)
- **Accumulated learnings** (what works, what fails, patterns)

**Resume anywhere:** The journal allows picking up exactly where you left off, whether running locally or in cloud.

## Parallel Cloud Execution

Generate one prompt, run in multiple environments:

1. Generate prompt with `/cloud-optimize`
2. Copy to 5 different cloud agents
3. Each runs independently
4. Compare FINAL REPORT sections
5. Merge best changes and learnings

Output format is consistent across all runs.

## References

### Best Practices Guide

`references/agent-eval-best-practices.md`

Comprehensive guide covering:
- Grader design (code, model, human)
- Dataset construction
- Calibration protocols
- Failure debugging
- The relationship between evals and optimization

### Skills

| Skill | Purpose |
|-------|---------|
| `evaluation-infrastructure` | Layer 1 - Build/assess eval infra |
| `optimization-target` | Layer 2 - Define goal + constraints |
| `optimization-loop` | Layer 3 - Execute iterations |
| `optimization-craft` | Local interactive methodology |

## Philosophy

Based on Anthropic's agent evaluation principles:

1. **Evaluation-first**: Define metrics BEFORE making changes
2. **Hypothesis-driven**: Every change has a testable prediction
3. **Controlled experiments**: One change at a time, compare to baseline
4. **Compounding returns**: Failures become test cases, learnings accumulate
5. **Statistical rigor**: Multiple samples, track trends

The goal is not just to improve your agent, but to build a **self-improving evaluation system**.
