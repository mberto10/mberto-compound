---
description: Execute planned work while leveraging subsystem knowledge and applying the improvement mindset
---

# Work Command

Execute planned work while leveraging subsystem knowledge, applying relevant skills, and verifying invariants after each change group.

---

## CRITICAL RULE

Work is subsystem-aware. Before touching code, load the relevant subsystem specs. After each change group, verify invariants. This is what separates compound engineering from default engineering.

---

## Step 1: Load the Plan

Find the plan to execute:

1. **If argument references a plan:** Read the specified plan file or conversation context
2. **If no argument:** Check if a plan was recently produced by `/plan` in this conversation
3. **If no plan exists:** Ask the user what work to do, then recommend running `/plan` first for non-trivial changes

Extract from the plan:
- Change groups (ordered)
- Affected subsystems
- Invariants to verify
- Test commands per group

---

## Step 2: Load Subsystem Context

For each affected subsystem identified in the plan:

1. Read the subsystem spec at `subsystems_knowledge/{system}/{subsystem}.yaml`
2. Extract the `helpful_skills` section — these are project-specific skills relevant to this subsystem
3. Extract `invariants` — these must hold after each change group
4. Extract `tests` — these validate each group
5. Note `recently_fixed` — areas to be extra careful around

---

## Step 3: Activate the Improvement Mindset

Load the **improvement-cycle** skill. Before starting work, run through:

```
Before Starting:
- [ ] Have I done something like this before? What did I learn?
- [ ] What patterns exist in the affected subsystems?
- [ ] What could go wrong? (check recently_fixed)
- [ ] What will I watch for? (set learning triggers)
```

If any `helpful_skills` were found in Step 2, read them now and keep them active during work.

---

## Step 4: Execute Change Groups

For each change group in the plan (in order):

### 4a. Announce the Group

```
═══════════════════════════════════════════════════════════════
CHANGE GROUP {N}: {description}
═══════════════════════════════════════════════════════════════

Files:
- {path} — {what changes}
- {path} — {what changes}

Invariants to verify after:
- {invariant 1}
- {invariant 2}
```

### 4b. Apply Changes

Make the code changes for this group. Apply any relevant skills from `helpful_skills` while working.

**During work, notice:**
- Friction points (things that are harder than expected)
- Missing patterns (things that should exist but don't)
- Unexpected dependencies (things not captured in subsystem specs)

Log these inline as you work — they become candidates for `/discover` later.

### 4c. Verify Invariants

After completing each change group, verify the invariants listed for that group:

1. **Read each invariant** from the subsystem spec
2. **Check compliance** — does the changed code still satisfy it?
3. **Run tier0 tests** if specified for this group

```
Invariant Check — Group {N}:
- [PASS] {invariant 1} — {evidence}
- [PASS] {invariant 2} — {evidence}
- [FAIL] {invariant 3} — {what's wrong}
```

If any invariant fails, fix it before moving to the next group.

### 4d. Run Tests

Run the test command specified for this group (from the subsystem's `tests` section):

```
Test Results — Group {N}:
- tier0: {pass/fail} — {command run}
- tier1: {pass/fail if applicable}
```

If tests fail, fix issues before proceeding to the next group.

---

## Step 5: Cross-Group Verification

After all groups are complete:

1. **Run broader tests** — tier1 or tier2 tests that span multiple subsystems
2. **Check downstream subsystems** — verify consumer subsystems still work
3. **Re-check any "Verify" invariants** from the plan that were unclear during planning

---

## Step 6: Capture Friction

After completing work, run through the improvement-cycle closing checklist:

```
After Completing:
- [ ] What friction did I hit?
- [ ] What would I tell past-me?
- [ ] Is any of this worth encoding?
- [ ] What spec gaps did I discover?
```

**Output friction summary:**

```
═══════════════════════════════════════════════════════════════
WORK COMPLETE
═══════════════════════════════════════════════════════════════

Change Groups Completed: {N}/{total}
Invariants Verified: {pass}/{total}
Tests Passed: {pass}/{total}

Friction Points:
- {friction 1}
- {friction 2}

Spec Gaps Discovered:
- {gap 1 — which subsystem spec needs updating}
- {gap 2}

Suggested Next Steps:
- Run /review for full verification
- Run /discover if friction points suggest reusable patterns
- Update subsystem specs with discovered gaps
═══════════════════════════════════════════════════════════════
```

---

## Working Without a Plan

If the work is small enough that `/plan` was skipped:

1. Identify affected subsystems by reading `subsystems_knowledge/**/*.yaml`
2. Load relevant `helpful_skills`
3. Make changes
4. Verify invariants from affected subsystems
5. Run tier0 tests
6. Capture friction

The plan just front-loads the thinking. The invariant verification and skill loading happen regardless.

---

## Notes

- This command MAKES code changes. It is the execution phase.
- Always verify invariants after each change group, not just at the end.
- If you discover a spec gap (dependency not in subsystem YAML), note it but don't stop work — fix the spec after the change lands.
- The `helpful_skills` section in subsystem YAMLs bridges this portable plugin to project-specific knowledge. If it's empty, that's fine — the subsystem's invariants and tests are still valuable.
- When in doubt about a change, ask the user rather than guessing.
