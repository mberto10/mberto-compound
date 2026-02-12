---
name: agent-eval-init
description: Interview-driven initialization of an agent evaluation infrastructure document using tracing implementation context and custom instructions
allowed_tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
arguments:
  - name: agent
    description: Agent name used for context scan and output files
    required: true
  - name: dataset
    description: Optional dataset name suggestion (defaults to <agent>-eval)
    required: false
  - name: instructions
    description: Optional custom instructions (inline text or path to a local file)
    required: false
  - name: output
    description: Optional output path for the initial infrastructure doc
    required: false
---

# Agent Eval Init

Create an initial evaluation-infrastructure document before bootstrap execution.

This command is interview-first and context-grounded:
1. Collect custom goals and constraints from the user.
2. Scan tracing/evaluation implementation in the codebase.
3. Produce a concrete `initial eval infra` doc artifact that can be used with `/agent-eval-setup`.

## Step 1: Resolve Inputs

- `agent` is required.
- `dataset` defaults to `<agent>-eval`.
- `output` defaults to `.claude/eval-infra/<agent>-initial.md`.
- `instructions` can be:
  - inline text, or
  - a path to a markdown/text file.

If `instructions` looks like a file path and exists, read it and include it in planning context.

## Step 2: Gather Codebase Context (Tracing + Eval Signals)

Run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/tracing_context_collector.py \
  scan \
  --agent "<agent>" \
  --root "." \
  --out ".claude/eval-infra/<agent>-tracing-context.json"
```

Capture:
- entry-point candidates
- score/metric naming candidates
- metadata key candidates for slices
- key files where Langfuse instrumentation appears

## Step 3: Interview the User (Required)

Ask focused questions and keep answers in the doc:

1. What exact output/feature is being optimized?
2. What does success look like (primary objective and target threshold)?
3. What constraints are non-negotiable (safety/style/cost/latency/etc.)?
4. What failure modes matter most right now?
5. Which slices must be tracked from day one?
6. Which levers are allowed vs frozen for optimization?
7. Any existing baseline run or known "good" version to anchor against?

If answers conflict with code context, call that out explicitly as assumptions/open questions.

## Step 4: Write Initial Eval Infra Doc

Write markdown document to:

- `.claude/eval-infra/<agent>-initial.md` (or `--output` path)

Required structure:

```md
# Initial Eval Infrastructure: <agent>

## 1. Scope and Optimization Intent
- feature/output in scope
- objective statement
- success criteria

## 2. Custom Instructions (User-Provided)
- normalized summary of provided instructions

## 3. Tracing Implementation Context (Observed)
- entry point candidates
- instrumentation evidence (files + snippets)
- score/metric names already present
- metadata keys usable for slices

## 4. Proposed Evaluation Contract (Initial Draft)
- dataset name
- canonical score policy (0-1)
- dimensions table: name, signal type, threshold, weight, critical
- candidate judge prompts (`judge-*`)
- slice plan
- baseline plan

## 5. Open Questions and Risks
- missing instrumentation
- ambiguous metrics
- judge reliability concerns
- data quality gaps

## 6. Next Commands
- `/agent-eval-setup --agent <agent> --dataset <dataset>`
- `/agent-eval-infra status --agent <agent> --dataset <dataset>`
```

## Step 5: Output Summary

Return:
- created doc path
- tracing context JSON path
- proposed dataset name
- count of proposed dimensions
- explicit assumptions that require confirmation

## Constraints

- Do not mutate Langfuse objects in this command.
- Do not run dataset bootstrap here.
- Canonical scoring semantics in all proposals must be `0-1`.

