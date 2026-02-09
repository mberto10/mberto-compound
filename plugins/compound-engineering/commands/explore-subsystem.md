---
description: Systematically explore and document a subsystem for the compound engineering knowledge base
argument-hint: <system/subsystem e.g. backend/api or frontend/auth>
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
---

# Subsystem Exploration Command

Systematically explore and document a subsystem for the compound engineering knowledge base.

---

## Input Required

**System:** $ARGUMENTS (format: `system/subsystem`, e.g., `backend/api` or `frontend/first-value`)

If no argument provided, ask the user which subsystem to explore.

---

## Knowledge Location

All subsystem specs are stored in the **project root** at `subsystems_knowledge/`. This folder is repo-specific and persists independently of the plugin installation, so each project maintains its own knowledge base.

```
subsystems_knowledge/
├── backend/
│   ├── workflow.yaml
│   ├── validation.yaml
│   └── ...
├── design-system/
│   └── ...
└── frontend/
    └── ...
```

If `subsystems_knowledge/` does not exist yet in this project, create it before proceeding.

---

## Step 1: Load Context

Read the project's architecture document (if it exists) to understand:
- The subsystem's defined path pattern and transferable pattern
- Whether it's critical for the current milestone
- What core functionalities it supports

Check for architecture docs at common locations:
- `architecture.md`
- `docs/architecture.md`
- `CLAUDE.md` (project instructions)

---

## Step 2: Explore Boundaries

Identify the exact files owned by this subsystem.

**For Backend/Design System (technical subsystems):**
- Use Glob to find all files matching the path pattern
- Identify public API surfaces (exported functions, classes, types)
- Note any files that seem misplaced or unclear ownership

**For Frontend (goal-oriented subsystems):**
- Identify pages and components that serve this user journey
- Map the user flow through the codebase
- Note entry points and exit points of the journey

**Output:** List of owned files with brief purpose annotations.

---

## Step 3: Map Dependencies

**Inbound (what this subsystem depends on):**
- Imports from other subsystems
- External packages
- Runtime dependencies (APIs called, databases accessed)
- Config dependencies (env vars, feature flags)

**Outbound (what depends on this subsystem):**
- Other subsystems that import from here
- External consumers (API clients, other services)

**Output:** Dependency graph showing subsystem relationships.

---

## Step 4: Identify Invariants

Find 3-10 statements that MUST remain true for this subsystem. Look for:
- Security constraints (auth checks, data sanitization)
- Data integrity rules (required fields, valid states)
- Performance requirements (timeouts, rate limits)
- Contract guarantees (API response shapes, event formats)

**Sources:**
- Comments mentioning "must", "always", "never"
- Validation logic
- Error handling patterns
- Test assertions

**Output:** Numbered list of invariants.

---

## Step 5: Assess Current State

Against the current milestone, evaluate:

| Aspect | Status | Evidence |
|--------|--------|----------|
| Core functionality works | | |
| Error handling complete | | |
| Happy path tested | | |
| Edge cases handled | | |
| Integration with dependents verified | | |

**Milestone mapping:**
- Concept: Spec exists, boundaries defined
- Prototype: Happy path works, can demo
- Alpha: Unit tests, basic error handling, integration test, API documented
- Beta: Full coverage, all error paths, contract tests
- Production: Monitoring, runbook, performance benchmarked

**Output:** Current milestone state with evidence.

---

## Step 6: Identify Gaps

List specific items missing to reach the next milestone:

```
Gaps:
- [ ] GAP-001: [Description] - blocks [functionality]
- [ ] GAP-002: [Description] - blocks [functionality]
```

Prioritize by:
1. Blocks other subsystems
2. Blocks core user flow
3. Missing but not blocking

**Output:** Prioritized gap list with blocking relationships.

---

## Step 7: Generate Subsystem Spec

Create or update a YAML spec file at `subsystems_knowledge/{system}/{subsystem}.yaml`:

```yaml
id: {subsystem}
system: {system}
owners: []

description: |
  Brief description of the subsystem's purpose and responsibility.

architecture:
  overview: |
    High-level diagram showing how this subsystem fits into the larger system.

  components: |
    For each major component, show its internal structure.

  data_flow: |
    Show a complete request/response flow through the subsystem.

paths:
  owned:
    - {glob patterns}
  public_api:
    - {exported interfaces}

dependencies:
  compile_time: []
  runtime: []
  data: []
  config: []

dependents: []

invariants:
  - "{invariant 1}"
  - "{invariant 2}"

tests:
  tier0: "{unit test command}"
  tier1: "{contract test command}"
  tier2: "{integration test command}"

milestone:
  current: {concept|prototype|alpha|beta|production}
  target: alpha

recently_fixed: []

gaps:
  - id: GAP-001
    type: {feature|bugfix|optimization}
    title: "{title}"
    priority: {1-5}
    blocks: ["{other gaps or subsystems}"]
    done_when: "{acceptance criteria}"

helpful_skills: []
```

### Architecture Diagram Guidelines

When creating the `architecture` section, follow these principles:

1. **Use box-drawing characters** for clean visuals:
   - Corners: `+ -` or unicode
   - Lines: `- |` or unicode
   - Arrows: `-->` or unicode

2. **Show decision points** where behavior branches

3. **Label data transformations** between steps

4. **Include key constraints inline**

5. **For complex subsystems**, create multiple diagrams:
   - `overview`: System integration view
   - `{component_name}`: Per-component detail
   - `data_flow`: End-to-end request trace

---

## Step 8: Summary Report

Output a markdown summary:

```markdown
# Subsystem Exploration: {system}/{subsystem}

## Overview
- **Path Pattern:** {paths}
- **Current State:** {milestone}

## Key Findings
- {finding 1}
- {finding 2}

## Dependencies
- **Depends on:** {list}
- **Depended on by:** {list}

## Invariants
1. {invariant}
2. {invariant}

## Gaps ({count})
| ID | Title | Priority | Blocks |
|----|-------|----------|--------|
| | | | |

## Recommended Next Steps
1. {step}
2. {step}
```

---

## Output Artifacts

After exploration, you should have:
1. New or updated `subsystems_knowledge/{system}/{subsystem}.yaml` spec
2. Summary in conversation for user review

---

## Notes

- For Frontend goal-oriented subsystems, focus on user journey completeness over code coverage
- Flag any cross-subsystem concerns that need coordination
- If gaps are large, suggest breaking into smaller work items
- This command works in any repo where the plugin is installed — it will create `subsystems_knowledge/` if it doesn't exist
