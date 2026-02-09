---
name: Improvement Cycle
description: This skill should be used when starting any significant engineering task, when the user asks to "work with improvement mindset", "apply compound thinking", "set up improvement cycle", or when Claude should proactively apply the improvement lens during /work execution. Provides the active thinking framework to use DURING work, not just after.
---

# Improvement Cycle

## Purpose

Apply the improvement mindset **during engineering work**, not just in retrospective. This skill provides the active lens to use while executing tasks — turning every unit of work into a compounding opportunity. It is subsystem-aware: it uses subsystem knowledge to ground the improvement mindset in concrete contracts and invariants.

## The Core Shift

**Default mode:** Do task → Done → Next task
**Compound mode:** Do task → Notice → Encode → Next task inherits

The difference isn't adding steps after. It's a different way of seeing while working.

## Apply This Lens Now

When starting any task, activate these questions:

### Before Starting

```
1. Have I done something like this before?
   → If yes: What did I learn? Is it encoded anywhere?
   → If no: This is exploration territory. Pay attention.

2. What subsystem knowledge exists?
   → Read subsystems_knowledge/ for affected areas
   → Load helpful_skills from affected subsystems
   → Note invariants that must hold

3. What could go wrong?
   → Past: Check recently_fixed in subsystem specs
   → Predicted: What's the risky part?
   → Dependencies: What consumers might break?
```

### While Working

**Notice these moments:**

| Signal | What It Means |
|--------|---------------|
| "I've done this before" | Pattern worth extracting |
| "This is taking longer than expected" | Friction point - potential learning |
| "I had to look this up" | Knowledge gap to fill |
| "This broke unexpectedly" | Rule candidate or missing invariant |
| "I wish I knew X earlier" | Onboarding content or helpful_skill |
| "This would be useful elsewhere" | Reusable component |
| "The subsystem spec was wrong/incomplete" | Spec gap to fix |

**Capture in the moment:** Don't wait until the end. When you notice something, note it immediately — even just "friction: [one line]" inline.

### After Completing

```
1. What surprised me?
   → Unexpected difficulty = missing knowledge or spec gap
   → Unexpected ease = leverage from existing pattern

2. What would I do differently?
   → Process change = rule candidate
   → Tool/approach change = skill candidate
   → Missing automation = hook or agent candidate

3. What should be added to subsystem knowledge?
   → New invariants discovered
   → New dependencies found
   → Gaps addressed or created
   → Skills that would help future work on this subsystem
```

## Encoding Decisions

Not everything is worth encoding. Apply this filter:

```
Will this happen again?
├─ No → Don't encode (one-off)
└─ Yes → Is it teachable in one line?
         ├─ Yes → Rule in CLAUDE.md or subsystem invariant
         └─ No → Is it a procedure?
                 ├─ Yes → Skill or command (→ /discover)
                 └─ No → Reference doc or subsystem spec update
```

## The 80/20 Split in Practice

The methodology says: 80% planning/review, 20% execution.

| Phase | Time | What You're Doing |
|-------|------|-------------------|
| Understand | 40% | Read subsystem specs, find patterns, understand context |
| Execute | 20% | Actually write/change things |
| Verify | 30% | Check invariants, run tests, validate |
| Extract | 10% | Capture what you learned |

If you're spending 80%+ in execution, you're probably:
- Repeating mistakes others made
- Missing existing patterns in subsystem specs
- Creating knowledge that dies with the session

## Friction Logging

During work, log friction points:

```
friction: had to trace through 4 files to find where X is configured
friction: subsystem spec didn't mention dependency on Y
friction: test failed silently, added explicit assertion
friction: invariant Z wasn't documented but is critical
```

These become candidates for `/discover`. At session end, review friction.

## Pattern Recognition Triggers

Watch for these patterns emerging:

**Procedure patterns** (→ potential command):
- "First I do X, then Y, then Z" repeated
- Multi-step process with consistent order

**Knowledge patterns** (→ potential skill / helpful_skill):
- "You need to understand A to do B"
- Domain expertise applied repeatedly
- Subsystem-specific knowledge that keeps being needed

**Guard patterns** (→ potential hook or invariant):
- "Never do X without checking Y first"
- Validation that should always happen

**Delegation patterns** (→ potential agent):
- "This subtask is self-contained"
- "A specialist would do this better"

## Integration with Commands

This skill provides the **mindset**. The commands provide **infrastructure**:

- Noticed a pattern worth extracting? → `/discover` to spec it
- Want to verify work against contracts? → `/review` to check it
- Ready to implement a discovered pattern? → `/consolidate` to encode it
- Need to plan a change? → `/plan` to map the blast radius

But the commands aren't the point. The point is seeing work through the improvement lens continuously.

## Quick Activation

Starting a task? Run through this:

```
[ ] What subsystem specs cover this area? (load context)
[ ] What helpful_skills exist for affected subsystems? (find leverage)
[ ] What invariants must hold? (set guardrails)
[ ] What could go wrong? (anticipate friction)
[ ] What will I watch for? (set learning triggers)
```

Finishing a task? Run through this:

```
[ ] What friction did I hit?
[ ] What would I tell past-me?
[ ] Is any of this worth encoding?
[ ] What subsystem specs need updating?
[ ] What's the one-line learning?
```

That's the improvement cycle. Apply it now.
