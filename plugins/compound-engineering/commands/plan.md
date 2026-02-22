---
description: Produce a dependency-aware change plan by consulting subsystem knowledge before reading source code
argument-hint: <change description - what you want to plan>
allowed-tools: Read, Glob, Grep, Task, AskUserQuestion
---

# Plan Command

**IMPORTANT: Do NOT use the EnterPlanMode tool. Execute the steps below directly in the current conversation. This command produces a structured plan — it is not a trigger for Claude Code's built-in plan mode.**

Produce a dependency-aware change plan by consulting subsystem knowledge BEFORE reading any source code.

---

## Input

**Change description:** $ARGUMENTS

If no argument provided, ask the user what change, bug fix, or feature they want to plan.

---

## CRITICAL RULE

**You MUST read the subsystem specs BEFORE reading any source code.** Do not open any `.py`, `.ts`, `.yaml` config, or other source file until you have completed Steps 1-3 below. The subsystem knowledge at `subsystems_knowledge/` is your map — the source code is the territory. Read the map first.

If `subsystems_knowledge/` does not exist or is empty, tell the user to run `/explore-subsystem` first to build the knowledge base.

---

## Step 1: LOCATE — Which subsystem(s) does this touch?

Scan all subsystem specs to find which ones own the change target.

```
Read: subsystems_knowledge/**/*.yaml → check paths.owned, public_api, description
```

For each subsystem spec, check:
- Does `paths.owned` contain files related to the change?
- Does `public_api` list interfaces that would be affected?
- Does `description` mention the concept being changed?

**Output:** List of affected subsystems with their role:
- **Primary** — owns the files being changed
- **Consumer** — depends on the primary subsystem (listed in primary's `dependents`)
- **Provider** — the primary subsystem depends on it (listed in primary's `dependencies`)

---

## Step 2: TRACE — What depends on what's changing?

For the **primary** subsystem(s) identified in Step 1:

1. Read the full spec file
2. Extract `dependents` — these are the **consumer** subsystems
3. Extract `dependencies.compile_time` and `dependencies.runtime` — these are the **provider** subsystems
4. For each consumer subsystem, read ITS spec to understand:
   - Which of its `paths.owned` files consume the primary's `public_api`
   - What `invariants` it has that might be affected
5. Extract `recently_changed` entries from ALL touched subsystems — these are known pitfall areas

Build the dependency chain:

```
[providers] → [PRIMARY subsystem] → [consumers]
                                        ↓
                              [consumers' consumers if relevant]
```

**Output:** Full dependency trace showing which subsystems and files are in the blast radius.

---

## Step 3: INVARIANTS — What must not break?

Collect invariants from ALL subsystems in the blast radius (primary + consumers + providers if relevant).

For each invariant, assess:
- **At risk** — this change could violate it
- **Safe** — this change does not affect it
- **Verify** — unclear, needs code inspection in Step 4

**Output:** Numbered list of invariants grouped by risk level.

---

## Step 4: EXAMINE — Now read the actual code

NOW — and only now — read source code. But only the files identified in Steps 1-3.

For each file in the blast radius:
1. Read it to understand current contracts, types, function signatures
2. Note what specifically would need to change
3. Note what should be verified but probably won't need changes

Do NOT read files outside the blast radius. If you discover a new dependency during code examination that wasn't in the subsystem specs, note it as a **spec gap** to be captured later.

**Output:** Per-file analysis of current state and required changes.

---

## Step 5: PLAN — Produce the change plan

Organize changes into **atomic groups** — files that MUST change together to keep contracts consistent. Order groups by dependency (upstream changes first).

For each group, specify:
- Which files change and what changes in each
- Which test tier to run after (from the subsystem's `tests` section)
- Which invariants to verify

**Output format:**

```markdown
# Change Plan: {description}

## Affected Subsystems
| Subsystem | Role | Cascade Risk |
|-----------|------|--------------|
| {name} | Primary | — |
| {name} | Consumer | HIGH / MODERATE / LOW |

## Invariants at Risk
1. [{subsystem}] {invariant text}
2. [{subsystem}] {invariant text}

## Change Groups (execute in order)

### Group 1: {short description}
**Why this group exists:** {which contract/interface is being changed}

**Files:**
- `{path}` — {what changes and why}
- `{path}` — {what changes and why}

**Test after:** `{test command from subsystem spec}`
**Invariant check:** {which invariants to verify after this group}

### Group 2: {short description}
...

### Group N: Verify downstream (no code changes expected)
**Verify only:**
- `{path}` — {what to confirm still works}

**Test after:** `{broader test command}`

## Risks
- [{recently_changed ID}] {description} — {why it's relevant}
- [{gap ID}] {description} — {why it could interact with this change}
- {any cascade paths the plan might have missed}

## Spec Gaps Discovered
- {any new dependencies found during code examination not in subsystem specs}
- {these should be added to the relevant spec after the change lands}

## Pre-flight Checklist
- [ ] {verification item 1}
- [ ] {verification item 2}
- [ ] {verification item N}
```

---

## Step 6: RISKS — Flag what could go wrong

Review the plan for:

1. **Recently fixed bugs** — check `recently_fixed` from all touched subsystems. If the change touches the same area, flag it.
2. **Known gaps** — check `gaps` from all touched subsystems. If a gap interacts with this change (e.g., missing tests for the area being changed), flag it.
3. **Missing test coverage** — if there are no tier0/tier1 tests for a change group, flag it.
4. **Cascade paths** — if a consumer subsystem has its own consumers (transitive dependencies), flag the full chain.
5. **Broad impact changes** — if the change touches a `public_api` surface, every dependent must be checked.

---

## Notes

- This command produces a PLAN only. It does not make any code changes.
- The plan is designed to be executed with `/work` or manually, group by group.
- If the subsystems_knowledge folder is empty or missing for this project, tell the user to run `/explore-subsystem` first to build the knowledge base.
- If you find that subsystem specs are stale or missing information, note this in the "Spec Gaps Discovered" section so they can be updated after the change lands.
- When the change is small and only touches one subsystem with no consumers, the plan can be shorter — skip the cascade analysis and just output the change group + tests.
- **Do not enter Claude Code plan mode.** This command has its own structured planning workflow. Using the built-in EnterPlanMode tool will bypass `/work` and break the plan → work → review pipeline.
