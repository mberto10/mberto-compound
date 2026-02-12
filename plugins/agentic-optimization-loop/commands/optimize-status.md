---
name: optimize-status
description: Read-only status for optimization loop progress, including lever strategy state.
arguments:
  - name: agent
    description: Agent name to check. If omitted, list all active journals.
    required: false
---

# Optimize Status Command

Provide a read-only view of optimization progress and lever strategy configuration.

## If No Agent Specified

List all journals:

```bash
ls .claude/optimization-loops/*/journal.yaml
```

For each agent, show:
- phase
- iteration
- progress summary
- `lever_mode`
- `max_levers`
- last activity

## If Agent Specified

Read:

```
.claude/optimization-loops/<agent>/journal.yaml
```

Infer backward-compatible defaults when fields are missing:
- `lever_mode: single`
- `max_levers: 1`

## Required Output Fields

```text
Optimization Status: <agent>
Phase: <current_phase>
Iteration: <N>
Lever mode: <single|multi>
Max levers: <N>
Current lever set size: <N or ->
Lever scope:
  main_knob: <type @ location>
  allowed: <count or summary>
  frozen: <count or summary>
Target: <summary>
Guard status: <summary>
Next action: <summary>
```

## Brief Mode

If user requests quick status:

```text
<agent>: phase <phase>, iter <N>, lever_mode=<mode>, max_levers=<N>, next=<action>
```
