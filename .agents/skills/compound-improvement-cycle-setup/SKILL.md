---
name: compound-improvement-cycle-setup
description: Use when starting any significant task, when the user asks to "work with improvement mindset", "apply compound thinking", "set up improvement cycle", or when Codex should proactively apply the improvement lens to ongoing work. Provides the active thinking framework to use during work, not just after.
---

# Improvement Cycle Setup

## Purpose

Apply the improvement mindset during work, not just in retrospective. This skill provides the active lens to use while executing tasks so every piece of work becomes a compounding opportunity.

## The Core Shift

Default mode: Do task -> Done -> Next task
Compound mode: Do task -> Notice -> Encode -> Next task inherits

The difference is not adding steps after. It is a different way of seeing while working.

## Apply This Lens Now

### Before Starting

1. Have I done something like this before?
   - If yes: What did I learn? Is it encoded anywhere?
   - If no: This is exploration territory. Pay attention.

2. What would make this easier?
   - Missing: What info do I wish I had?
   - Existing: What patterns in this codebase apply?

3. What could go wrong?
   - Past: What broke last time?
   - Predicted: What is the risky part?

### While Working

Notice these moments:

| Signal | What It Means |
|--------|---------------|
| "I have done this before" | Pattern worth extracting |
| "This is taking longer than expected" | Friction point - potential learning |
| "I had to look this up" | Knowledge gap to fill |
| "This broke unexpectedly" | Rule candidate |
| "I wish I knew X earlier" | Onboarding content |
| "This would be useful elsewhere" | Reusable component |

Capture in the moment. Do not wait until the end. When you notice something, note it immediately, even just "friction: [one line]" inline.

### After Completing

1. What surprised me?
   - Unexpected difficulty = missing knowledge
   - Unexpected ease = leverage existing pattern

2. What would I do differently?
   - Process change = rule candidate
   - Tool or approach change = skill candidate

3. What should the next person know?
   - If it took you time to figure out, encode it

## Encoding Decisions

Not everything is worth encoding. Apply this filter:

Will this happen again?
- No -> Do not encode (one-off)
- Yes -> Is it teachable in one line?
  - Yes -> Rule in CLAUDE.md
  - No -> Is it a procedure?
    - Yes -> Skill or command workflow
    - No -> Reference doc

Good encodings:
- "Always run `npm test` before committing in this repo" (rule)
- "The auth flow lives in src/auth/, entry point is middleware.ts" (knowledge)
- "When adding API endpoints, follow the pattern in routes/users.ts" (pattern)

Over-encoding (avoid):
- Obvious things ("write clean code")
- One-time edge cases
- Style preferences without functional impact

## The 80/20 Split in Practice

The methodology says: 80% planning/review, 20% execution.

What this means during work:

| Phase | Time | What You Are Doing |
|-------|------|---------------------|
| Understand | 40% | Read code, find patterns, understand context |
| Execute | 20% | Write and change things |
| Verify | 30% | Test, check, validate |
| Extract | 10% | Capture what you learned |

If you are spending 80% or more in execution, you are probably:
- Repeating mistakes others made
- Missing existing patterns
- Creating knowledge that dies with the session

## Friction Logging

During work, log friction points inline:

```txt
// friction: had to trace through 4 files to find where X is configured
// friction: test failed silently, added explicit assertion
// friction: naming inconsistent between FooService and BarManager
```

These become learning candidates. At session end, review friction comments.

## Pattern Recognition Triggers

Watch for these patterns:

Procedure patterns (potential command workflow):
- "First I do X, then Y, then Z" repeated
- Multi-step process with consistent order

Knowledge patterns (potential skill):
- "You need to understand A to do B"
- Domain expertise applied repeatedly

Guard patterns (potential hook):
- "Never do X without checking Y first"
- Validation that should always happen

Delegation patterns (potential agent):
- "This subtask is self-contained"
- "A specialist would do this better"

## Minimum Viable Encoding

Do not over-engineer. First encoding can be tiny:

Rule (1 line in CLAUDE.md):
```
When modifying auth code, always run the full auth test suite, not just unit tests.
```

Skill (50 words):
```markdown
# API Error Handling
This codebase uses Result<T, E> pattern. Never throw from service layer.
Wrap external calls in try/catch, convert to Result. Controllers handle Result -> HTTP.
```

Hook (1 validation):
```json
{"PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "prompt", "prompt": "If this is a git push, verify tests passed first."}]}]}
```

Start small. Expand when needed.

## Active Application

When Codex is helping with a task, apply this framework:

1. Start: check for relevant existing learnings and skills
2. During: flag friction moments, note patterns
3. End: propose encoding for significant learnings

Do not wait for a reflection request. The reflection mindset is active throughout.

## Integration With Related Skills

This skill provides the mindset. The related skills provide the execution workflows:
- /compound:reflect -> compound-reflection-craft
- /compound:discover -> compound-discovery-craft
- /compound:consolidate -> compound-consolidation-craft

## Quick Activation

Starting a task? Run through this:

```
[ ] What do I already know about this? (load context)
[ ] What patterns exist here? (find leverage)
[ ] What could go wrong? (anticipate friction)
[ ] What will I watch for? (set learning triggers)
```

Finishing a task? Run through this:

```
[ ] What friction did I hit?
[ ] What would I tell past-me?
[ ] Is any of this worth encoding?
[ ] What is the one-line learning?
```

That is the improvement cycle. Apply it now.
