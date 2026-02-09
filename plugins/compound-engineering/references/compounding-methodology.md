# Compounding Methodology

> Reference document for compound-engineering plugin. Loaded by discovery-craft, consolidation-craft, reflection-craft, and improvement-cycle skills.

## Core Philosophy

The compound engineering workflow is a four-step feedback cycle where each iteration improves the next: **Plan → Work → Review → Compound**.

The critical insight: most engineering workflows skip the fourth step. They plan, work, review, repeat — but the learnings stay in people's heads. The compound step makes learning *architectural*: explicitly capturing and encoding lessons so future cycles inherit them.

In compound engineering, this is grounded in **subsystem knowledge** — YAML specs that capture contracts, invariants, dependencies, and gaps for every subsystem in the codebase. The knowledge compounds because each cycle enriches these specs.

## The Target

**Maximize cumulative leverage.**

- **Leverage** = output / effort
- **Cumulative** = each unit of effort produces more output than the previous

The system should become more capable per unit of investment over time. Not just faster at the same tasks — capable of tasks that were previously impossible.

## The Algorithm

```
capability_n = capability_0 x (1 + r)^n
```

Where:
- **r** = improvement rate per cycle (quality of learning encoded)
- **n** = number of cycles completed

The power is in the exponent. Small r over large n beats large r over small n. This is why frequent reflection matters more than occasional deep reviews.

| Parameter | What it means | How to improve |
|-----------|---------------|----------------|
| **r** (improvement rate) | How much does each cycle improve the system? | Higher quality learnings, better encoding |
| **n** (frequency) | How many cycles do you run? | Reflect often, shorter loops |
| **a** (application rate) | What fraction of learnings get used? | Better skill triggers, clear invariants, helpful_skills in subsystem specs |

## Evolution Parallels

The compound loop maps to evolution's mechanisms:

| Evolution | Compound Engineering |
|-----------|---------------------|
| Mutation (variation) | Discover new patterns via /discover |
| Selection (fitness test) | Consolidate — approve or reject via /consolidate |
| Inheritance (DNA) | Encode in skills, commands, subsystem specs |
| Iteration (generations) | Reflect frequently, short cycles |

**Our advantages over evolution:**

- **Intentional variation** — We direct exploration, not random mutation. We target areas of friction.
- **Cross-pollination** — We can borrow patterns across subsystems. Evolution can't share genes across species.
- **Compressed cycles** — Generations take years. We can reflect daily or after every significant task.

**What evolution teaches us:**

- Selection pressure must be real. Learnings that don't emerge from actual friction are just opinions.
- Memory matters. DNA persists successes; subsystem specs and skills persist learnings.
- Most mutations fail. Most potential learnings aren't worth encoding. That's fine.

## Actionable Principles

| Principle | What It Means | How to Apply |
|-----------|---------------|--------------|
| **Shift the frontier** | Don't trade volume for quality. Find learnings that improve both. | Ask: "Does this shift the frontier, or just slide along it?" |
| **Beware local optima** | "Good enough" patterns resist improvement. | Periodically question comfortable workflows. Use /discover for big jumps. |
| **Parallel search** | Evolution explores many variants simultaneously. | Launch multiple agents to explore approaches. Go wide before deep. |
| **Real selection pressure** | Evolution never fools itself. | Prioritize learnings from actual friction over theoretical elegance. |
| **Build for evolvability** | Some systems adapt faster. | Modular skills, loose coupling, clear subsystem boundaries. |
| **Niche construction** | You're not just adapting — you're building an environment. | Subsystem specs + skills + plugin = capability compound. |
| **Exaptation** | Features repurposed for new uses. | Look for skills that could apply to unexpected subsystems. |
| **Cross-pollinate** | Recombination accelerates search. | Combine patterns from different subsystems/plugins. |

## The Frontier Model

```
Quality
    |      /--- New frontier (after compounding)
    |     /
    |    /  /--- Current frontier
    |   /  /
    |  /  /
    | /  /
    |/  /
    +---------- Volume
```

Trading volume for quality isn't compounding. Compounding means the frontier itself moves outward. High-r learnings shift the frontier; low-r learnings slide along it.

**Test for a learning:** Does this improve volume OR quality (sliding)? Or does it improve the underlying capability so BOTH can improve (shifting)?

Examples:
- **Sliding:** "Write faster by skipping invariant checks" — trades quality for volume
- **Shifting:** "Add invariants to subsystem specs so /review catches issues automatically" — reduces effort AND improves quality

## The Compound Engineering Loop

```
PLAN (40%)
├── Read subsystem specs (map before territory)
├── Trace dependencies and blast radius
└── Output: Dependency-aware change plan

WORK (20%)
├── Execute per plan, group by group
├── Verify invariants after each group
└── Log friction inline

REVIEW (40%)
├── Map changes to subsystems
├── Check invariants
├── Run tests by tier
└── Identify spec gaps

COMPOUND (ongoing)
├── Discover → extract patterns into component specs
├── Consolidate → implement approved components
├── Update subsystem specs with new knowledge
└── Future cycles inherit all of this
```

The 80/20 split is intentional: 80% planning/review, 20% execution.

## What Makes Learning Worth Encoding

Not all observations should become permanent rules. Apply these gates:

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
When modifying API route handlers, always verify auth middleware invariant.
[src:2025-06-15__api-auth-cascade]
```

**Bad:**
```
I learned that when you're changing API routes, it's really important
to think about authentication because sometimes the middleware can be
affected in unexpected ways...
```

The good format:
- Is actionable (you know exactly what to do)
- Is testable (did I verify the auth invariant?)
- Has traceability (source reference tells you where this came from)

## Where Learnings Land

| Learning Type | Destination |
|--------------|-------------|
| Subsystem-specific knowledge | helpful_skills in subsystem YAML |
| Cross-cutting rule | CLAUDE.md or shared skill |
| Missing capability | New skill, command, or agent in local plugin |
| Guard/validation | Hook in local plugin or invariant in subsystem spec |
| Architecture decision | Documentation or subsystem spec update |
| Bug prevention | Invariant in subsystem spec or hook |

## Anti-Patterns

### r → 0 (Improvement rate collapses)
Learnings aren't high quality — vague rules, wrong abstractions, opinions not insights.

### n → 0 (Cycle frequency collapses)
Cycles don't happen — no reflection habit, only reflect at major milestones.

### a → 0 (Application rate collapses)
Learnings exist but don't trigger — skill descriptions wrong, helpful_skills not populated, invariants buried.

### Over-Codification
Too many rules calcify the system. Rules that made sense in context become constraints that prevent adaptation. Prune stale rules, don't just add.

### Essay Learnings
Vague, long-form observations get ignored. If it can't be a 1-line testable rule, it might not be encodable.

### Skipping the Compound Step
"We'll document it later." Later never comes. The loop only works if compounding is non-negotiable.

### Encoding Opinions as Rules
Prefer measurable guardrails (invariants, tests, contracts) over style opinions.

### Poor Skill Triggers
Learnings encoded in skills that never activate are wasted. If the skill description doesn't match how you actually ask for things, a → 0.

## The Spiral, Not the Circle

Each loop is higher than the last because it stands on everything the previous loops deposited:

```
capability_n = capability_0 x (1 + r)^n
```

The spiral goes upward because r > 0. If learnings don't encode, r = 0, and you're back on the flat circle — busy without compounding.

**Why frequency matters more than depth:**

Ten cycles with r = 0.05 beats two cycles with r = 0.20:
- 10 cycles at 5%: 1.05^10 = 1.63x capability
- 2 cycles at 20%: 1.20^2 = 1.44x capability

This argues for frequent, smaller reflections over occasional deep reviews.
