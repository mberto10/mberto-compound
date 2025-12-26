# Compounding Methodology

> Reference document for compound-loop plugin. Loaded by reflection-craft, discovery-craft, and consolidation-craft skills.

## Core Philosophy

The compound loop is a four-step feedback cycle where each iteration improves the next: **Plan → Work → Review → Compound**.

The critical insight: most workflows skip the fourth step. They plan, work, review, repeat—but the learnings stay in people's heads. The compound step makes learning *architectural*: explicitly capturing and encoding lessons so future cycles inherit them.

> "AI engineering makes you faster today. Compounding engineering makes you faster tomorrow, and each day after."

## The Target

**Maximize cumulative leverage.**

- **Leverage** = output / effort
- **Cumulative** = each unit of effort produces more output than the previous

The system should become more capable per unit of investment over time. Not just faster at the same tasks—capable of tasks that were previously impossible.

This is different from "excellence" (too vague) or "productivity" (static metric). Cumulative leverage means the *rate of improvement* itself improves.

## The Algorithm

Evolution is an algorithm for maximizing fitness. Compound interest is a mechanism for maximizing capital. The compound loop is an algorithm for maximizing cumulative leverage.

**The formula:**

```
capability_n = capability_0 × (1 + r)^n
```

Where:
- **r** = improvement rate per cycle (quality of learning encoded)
- **n** = number of cycles completed

The power is in the exponent. Small r over large n beats large r over small n. This is why frequent reflection matters more than occasional deep reviews.

**Key parameters to optimize:**

| Parameter | What it means | How to improve |
|-----------|---------------|----------------|
| **r** (improvement rate) | How much does each cycle improve the system? | Higher quality learnings, better encoding |
| **n** (frequency) | How many cycles do you run? | Reflect often, shorter loops |
| **a** (application rate) | What fraction of learnings get used? | Better skill triggers, clear rules |

**The tradeoff:** Very fast cycles (high n) may have low signal (low r). Very thorough cycles (high r) take longer (fewer n). Find the frequency where r × n is maximized.

## Evolution Parallels

The compound loop maps to evolution's mechanisms:

| Evolution | Compound Loop |
|-----------|---------------|
| Mutation (variation) | Discover new patterns |
| Selection (fitness test) | Consolidate - approve or reject |
| Inheritance (DNA) | Encode in skills/commands |
| Iteration (generations) | Reflect frequently |

**Our advantages over evolution:**

- **Intentional variation** — We direct exploration, not random mutation. We can target areas of friction.
- **Cross-pollination** — We can borrow from others' learnings. Evolution can't share genes across species.
- **Compressed cycles** — Generations take years. We can reflect daily or after every significant task.

**What evolution teaches us:**

- Selection pressure must be real. Learnings that don't emerge from actual friction are just opinions.
- Memory matters. DNA persists successes; skills and rules persist learnings.
- Most mutations fail. Most potential learnings aren't worth encoding. That's fine.

## Actionable Principles from Evolution

| Principle | What It Means | How to Apply |
|-----------|---------------|--------------|
| **Shift the frontier** | Don't trade volume for quality. Find learnings that improve both. | Ask: "Does this learning move the frontier, or just slide along it?" |
| **Beware local optima** | "Good enough" patterns resist improvement. You WILL get stuck. | Periodically question comfortable workflows. Use discover for big jumps. |
| **Parallel search** | Evolution explores many variants simultaneously. | Launch multiple agents to explore approaches. Go wide before deep. |
| **Real selection pressure** | Evolution never fools itself. The environment decides fitness. | Prioritize learnings from actual friction over theoretical elegance. |
| **Build for evolvability** | Some systems adapt faster. Evolvability is itself selected for. | Modular skills, loose coupling, some redundancy. |
| **Niche construction** | You're not just adapting—you're building an environment. | Recognize: plugins → capability → better plugins. This is the exponential source. |
| **Exaptation** | Features repurposed for new uses. | Look for skills that could apply to unexpected domains. |
| **Cross-pollinate** | Recombination accelerates search. | Deliberately combine patterns from different plugins/domains. |

## The Frontier Model

```
Quality
    │      ┌─── New frontier (after compounding)
    │     /
    │    /  ┌─── Current frontier
    │   /  /
    │  /  /
    │ /  /
    │/  /
    └──────────── Volume
```

Trading volume for quality isn't compounding. Compounding means the frontier itself moves outward. High-r learnings shift the frontier; low-r learnings slide along it.

**Test for a learning:** Does this improve volume OR quality (sliding)? Or does it improve the underlying capability so BOTH can improve (shifting)?

Examples:
- **Sliding:** "Write faster by skipping tests" — trades quality for volume
- **Shifting:** "Batch similar tasks together" — reduces context-switching, improves both volume AND quality

Prioritize frontier-shifting learnings. They have higher r.

## The Compound Loop

```
PLAN (40%)
├── Research codebase, patterns, context
├── Study best practices
└── Output: Clear implementation approach

WORK (20%)
├── Execute per plan
└── Create artifacts

REVIEW (40%)
├── Evaluate output quality
├── Extract lessons learned
└── Apply human judgment

COMPOUND (ongoing)
├── Lessons → skills, CLAUDE.md, docs
├── Patterns → reusable components
├── Decisions → codified rules
└── Future cycles inherit all of this
```

The 80/20 split is intentional: 80% planning/review, 20% execution. Execution is increasingly commoditized; the boundaries—planning and review—are where human judgment creates value.

## What Makes Learning Worth Encoding

Not all observations should become permanent rules. Apply these decision gates:

### Recurrence Likelihood
- Will this situation come up again?
- Is this a one-off edge case or a pattern?

### Maintenance Cost
- Is the rule simple enough to maintain?
- Will encoding this add value or clutter?

### Architecture Fit
- Does this align with existing patterns?
- Will this help or confuse future sessions?

### Testability
- Can compliance be verified?
- Is this specific enough to act on?

## The Heuristics Format

Learnings should be **1-line, testable rules**, not essays:

**Good:**
```
When fetching >100 traces from Langfuse, always use pagination to avoid timeouts.
[src:2025-12-25T1430Z__langfuse-analysis]
```

**Bad:**
```
I learned that when you're doing Langfuse analysis, it's really important
to think about how many traces you're looking at because if there are too
many the analysis gets unfocused...
```

The good format:
- Is actionable (you know exactly what to do)
- Is testable (did I paginate? is batch size reasonable?)
- Has traceability (source reference tells you where this came from)

## Where Learnings Land

Different types of learnings have different homes:

| Learning Type | Destination |
|--------------|-------------|
| Plugin behavior improvement | Skill update, new command |
| Workflow pattern | CLAUDE.md or skill reference |
| Bug prevention | Specialized reviewer or hook |
| Missing capability | New skill or command |
| Architecture decision | Documentation or CLAUDE.md |

## Anti-Patterns

### Failure Modes (From the Model)

The algorithm fails when key parameters collapse:

| Failure | Parameter | Symptom |
|---------|-----------|---------|
| **r → 0** | Improvement rate | Learnings aren't high quality—vague rules, wrong abstractions, opinions not insights |
| **n → 0** | Cycle frequency | Cycles don't happen—no reflection habit, only reflect at major milestones |
| **a → 0** | Application rate | Learnings exist but don't trigger—skill descriptions wrong, rules buried, not applied |

### Over-Codification
Too many rules calcify the system. Rules that made sense in context become constraints that prevent adaptation. Prune stale rules, don't just add.

### Essay Learnings
Vague, long-form observations get ignored. If it can't be a 1-line testable rule, it might not be encodable. This directly kills r—low-quality learnings don't improve capability.

### Skipping the Compound Step
"We'll document it later." Later never comes. The loop only works if compounding is non-negotiable. This kills n—cycles that don't complete don't count.

### Encoding Opinions as Rules
Prefer measurable guardrails (performance, reliability, correctness) over style opinions. "Always use guard clauses" is opinion; "Validate API inputs before processing" is testable.

### Poor Skill Triggers
Learnings encoded in skills that never activate are wasted. If the skill description doesn't match how you actually ask for things, a → 0. Test that your skills trigger when expected.

## Connected Ideas

This methodology connects to:

**Skills as Modular Knowledge**: Learnings become packaged, loadable modules. The sophistication of your skills library compounds over time.

**Agent-Leverageable Architecture**: Build abstractions that agents can introspect and extend. Registry patterns, self-describing components, clear extension points—all enable agents to participate in the compound loop.

## The Spiral, Not the Circle

> "It's not a circle (plan-do-review-repeat). It's a spiral going upward. Each loop is higher than the last because it stands on everything the previous loops deposited."

This is the formula in action: each loop increases capability by factor (1 + r). After n loops:

```
capability_n = capability_0 × (1 + r)^n
```

The spiral goes upward because r > 0. If learnings don't encode, r = 0, and you're back on the flat circle—busy without compounding.

**Why frequency matters more than depth:**

The power of compounding is in the exponent (n), not the base (r). Ten cycles with r = 0.05 beats two cycles with r = 0.20:

- 10 cycles at 5%: 1.05^10 = 1.63× capability
- 2 cycles at 20%: 1.20^2 = 1.44× capability

This argues for frequent, smaller reflections over occasional deep reviews. Daily or after-task reflection beats quarterly retrospectives.

Every cycle should ask:
- What did we learn?
- How do we encode it so we never have to learn it again?
- Where does this learning belong?
