---
description: Verify work against subsystem contracts, invariants, and tests
---

# Review Command

Verify completed work against subsystem contracts and tests. Maps changed files to subsystems, checks invariants, runs tests by tier, and identifies spec gaps.

---

## Step 1: Identify Changed Files

Get the list of changed files:

```
git diff --name-only HEAD
git diff --name-only --cached
git status --short
```

Combine staged, unstaged, and untracked files into a single change set. If the user provided a scope filter, narrow to matching files.

**Output:** List of changed files.

---

## Step 2: Map Changes to Subsystems

For each changed file, find the owning subsystem:

1. Read all subsystem specs: `subsystems_knowledge/**/*.yaml`
2. For each spec, check if any `paths.owned` glob matches the changed file
3. If a file matches multiple subsystems, list all of them
4. If a file matches NO subsystem, flag it as **unmapped**

**Output:**

```
═══════════════════════════════════════════════════════════════
FILE → SUBSYSTEM MAPPING
═══════════════════════════════════════════════════════════════

backend/api:
  - src/api/routes/users.py
  - src/api/routes/auth.py

backend/workflow:
  - src/workflows/main.py

UNMAPPED (no subsystem owns these):
  - scripts/one-off-migration.py
  - README.md
```

---

## Step 3: Check Invariants

For each affected subsystem:

1. Read all `invariants` from its spec
2. For each invariant, check whether the changes could affect it
3. Verify compliance by reading the changed code

**Output per subsystem:**

```
═══════════════════════════════════════════════════════════════
INVARIANT CHECK: {system}/{subsystem}
═══════════════════════════════════════════════════════════════

1. [PASS] {invariant text}
   Evidence: {how you verified}

2. [PASS] {invariant text}
   Evidence: {how you verified}

3. [WARN] {invariant text}
   Concern: {why this needs attention}

4. [FAIL] {invariant text}
   Issue: {what's wrong}
   Fix: {suggested fix}
```

---

## Step 4: Run Tests by Tier

For each affected subsystem, run tests in order:

### Tier 0 (fast, must pass)

Run the `tests.tier0` command from the subsystem spec. These are unit tests and quick validations.

```
tier0 — {subsystem}: {PASS/FAIL}
Command: {what was run}
Output: {summary}
```

### Tier 1 (if tier0 passes)

Run the `tests.tier1` command. These are contract/integration tests.

```
tier1 — {subsystem}: {PASS/FAIL}
Command: {what was run}
Output: {summary}
```

### Tier 2 (manual/dogfooding checklist)

Present `tests.tier2` items as a checklist for the user. These are typically manual verification steps.

```
tier2 — {subsystem} (manual verification):
- [ ] {tier2 item 1}
- [ ] {tier2 item 2}
```

**Stop at first tier failure.** Fix the issue before proceeding to higher tiers.

---

## Step 5: Check for Spec Gaps

Identify changes that aren't reflected in subsystem YAMLs:

1. **Unmapped files** — files that changed but no subsystem claims them
2. **New dependencies** — imports added that aren't in the subsystem's `dependencies` section
3. **New public API** — exported functions/types added that aren't in `public_api`
4. **Missing invariants** — validation or constraint logic added that should be documented
5. **Changed contracts** — modifications to interfaces listed in `public_api` that consumers rely on

**Output:**

```
═══════════════════════════════════════════════════════════════
SPEC GAP ANALYSIS
═══════════════════════════════════════════════════════════════

New dependencies not in spec:
- {subsystem}: imports {module} — add to dependencies.runtime

Unmapped files:
- {file} — consider adding to {subsystem}.paths.owned

Public API changes:
- {subsystem}: added {function} — add to public_api

Missing invariants:
- {subsystem}: new validation at {file}:{line} — consider adding to invariants
```

---

## Step 6: Review Report

Produce the final review report:

```
═══════════════════════════════════════════════════════════════
REVIEW REPORT
═══════════════════════════════════════════════════════════════

Files Changed: {count}
Subsystems Affected: {list}

INVARIANTS
- Passed: {count}
- Warnings: {count}
- Failed: {count}

TESTS
- tier0: {pass/fail per subsystem}
- tier1: {pass/fail per subsystem}
- tier2: {checklist items}

SPEC GAPS: {count}
- {gap 1}
- {gap 2}

VERDICT: {PASS / PASS WITH WARNINGS / FAIL}

{If FAIL: list what needs fixing}
{If PASS WITH WARNINGS: list what to watch}

RECOMMENDED ACTIONS:
- {action 1}
- {action 2}
═══════════════════════════════════════════════════════════════
```

---

## Notes

- This command does NOT make code changes. It only reads, runs tests, and reports.
- If a subsystem has no tests defined, flag this as a gap.
- Unmapped files aren't necessarily a problem — some files (README, scripts) may not belong to a subsystem.
- When the user provides a scope filter, only review subsystems matching that filter.
- If subsystem specs don't exist yet, recommend running `/explore-subsystem` for each affected area.
