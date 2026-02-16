---
name: Strategic Planner
description: This skill should be used when the user wants to "plan a migration", "build feature X", "break down a project", "create a roadmap", "plan this initiative", "what would it take to build X", "decompose this into issues", or when Claude needs to decompose a product vision into a Linear hierarchy (initiative, project, milestones, issues) grounded in subsystem knowledge.
---

# Strategic Planner

## Purpose

Act as a thinking partner for product decomposition. Bridge the gap between high-level intent ("I want to migrate to X") and executable work items (harness-consumable Linear issues) by grounding every breakdown in two sources of truth:

1. **Linear** — what initiatives, projects, and issues already exist
2. **Subsystem knowledge** — what is the technical blast radius, complexity, and readiness

This skill provides the **methodology**. The `/strategic-plan` command provides the **workflow**.

---

## The Linear Hierarchy

Understanding how Linear primitives nest is essential for correct scoping:

```
Initiative (strategic theme — "why")
  └── Project (body of work — "what")
        └── Milestone (checkpoint — "when")
              └── Issue (unit of work — "how")
                    └── Sub-issue (optional decomposition)
```

**Rules of thumb:**
- An **initiative** groups related projects under a strategic theme. It answers "why are we doing this?"
- A **project** is a coherent body of work with a defined end state. It belongs to one team but can contain cross-team issues.
- A **milestone** is a checkpoint within a project. After reaching it, something testable is true.
- An **issue** is the atomic unit of work. For harness consumption, each issue = one plan→work→review→commit cycle.

---

## Scope Sizing Heuristics

The first decision: at what level does this work enter the hierarchy?

### Decision Tree

```
User's vision
     │
     ▼
Is this a new strategic direction or cross-cutting theme?
     │
     ├── YES → INITIATIVE level
     │         (new initiative with 1+ projects)
     │         Signals: 4+ subsystems, "migration", "strategic",
     │                  "redesign", "platform change", multi-quarter
     │
     └── NO → Does this need multiple coordinated phases?
              │
              ├── YES → PROJECT level
              │         (new project, possibly under existing initiative)
              │         Signals: 2-3 subsystems, "feature", "this quarter",
              │                  multi-milestone, clear deliverable
              │
              └── NO → Does this need multiple coordinated issues?
                       │
                       ├── YES → MILESTONE level
                       │         (new milestone in existing project)
                       │         Signals: 1-2 subsystems, fits existing project,
                       │                  "add X to all Y", batch of related changes
                       │
                       └── NO → ISSUE level
                                (individual issue in existing project)
                                Signals: single focused change, "fix", "add",
                                         clear single-session scope
```

### Sizing Signals Table

| Signal | Points to... |
|--------|-------------|
| "Migrate", "redesign", "overhaul", "platform" | Initiative |
| Affects 4+ subsystems | Initiative |
| Multi-quarter timeline | Initiative |
| "Feature", "build", "implement" + multi-phase | Project |
| Affects 2-3 subsystems | Project |
| "This quarter" timeline | Project |
| "Add X to all Y", batch operation | Milestone |
| Affects 1-2 subsystems, fits existing project | Milestone |
| Single focused change, "fix", "tweak" | Issue |

### The Overlap Check

**Before deciding scope, always check if existing Linear items cover this area.** If an initiative or project already exists for this theme:
- Default to extending it (add milestones/issues)
- Only create separate if intentionally different (ask the user)
- Never create duplicate initiatives for the same strategic theme

---

## Question Protocol

The strategic planner must ASK about ambiguities rather than guessing. But it must also not over-ask — respect the user's time.

### Always Ask (every invocation)

These questions are essential for a grounded breakdown:

1. **Scope boundaries** — "What is explicitly OUT of scope?"
   - Why: Prevents scope creep in the breakdown. Without this, issues expand to cover adjacent concerns.

2. **Priority / timeline** — "When does this need to be done?"
   - Why: Determines milestone target dates, issue priority, and whether to detail all phases or just Phase 1.

3. **High-level acceptance criteria** — "What does 'done' look like at the highest level?"
   - Why: Becomes the initiative/project success criteria. Without it, there's no way to know when to stop.

### Ask Only If Ambiguous

These questions matter only when the answer affects the breakdown structure:

4. **Technical approach** — "Should we use approach A or B?"
   - When: Only if there are 2+ valid approaches AND the choice changes which subsystems are affected or how work is sequenced.
   - Example: "Migrate auth to JWT or session-based?" changes the entire breakdown.

5. **Sequencing constraints** — "Does anything need to happen in a specific order?"
   - When: Only if the user hasn't implied ordering and there are multiple valid sequences.

6. **External dependencies** — "Does this depend on anything outside the codebase?"
   - When: Only if the vision mentions third-party services, design work, user research, or other teams.

### Never Ask

- **Implementation details** — individual issues handle these during `/plan` and `/work`
- **Test strategy** — derived from subsystem spec `tests` sections
- **File-level changes** — derived from subsystem spec `paths.owned`
- **Which invariants to check** — always check all invariants for affected subsystems

### Batching Rule

Collect all ambiguities discovered during Steps 2-5, then present them in a **single** AskUserQuestion call (up to 4 questions). Do NOT ask one question at a time — that creates friction and breaks the user's flow.

---

## Breakdown Methodology

### Top-Down Decomposition

Always work from the highest level down:

1. **Initiative** (if applicable): Define the strategic theme and success criteria
2. **Project(s)**: Define bodies of work with clear end states
3. **Milestones**: Define checkpoints — what is testable after each?
4. **Issues**: Define atomic work units — each one harness-consumable

### Milestone Design

A good milestone has these properties:
- **Checkpoint:** Something testable is true after it's reached
- **Coherent:** All issues in the milestone contribute to the same checkpoint
- **Ordered:** Foundation milestones come before dependent milestones
- **Sized:** 3-8 issues per milestone (fewer = too granular, more = too vague)

**Milestone naming pattern:** `[Phase N:] [What is true after]`
- "Phase 1: Core types defined and exported"
- "Phase 2: All routes migrated to new types"
- "Phase 3: Legacy code removed"

### Issue Design (Harness-Consumable)

Every leaf issue MUST follow the harness-protocol template:

```markdown
## Goal
[One sentence: what should be true after this is done]

## Subsystems
[e.g., backend/api, frontend/core-loop]

## Acceptance Criteria
- [ ] [Testable assertion 1]
- [ ] [Testable assertion 2]

## Constraints
[From subsystem invariants — what must NOT break]

## Done When
[Test command from subsystem spec, or specific verification step]
```

### Issue Sizing Rules

- **1 harness iteration** = 1-5 change groups. If an issue would need more, split it.
- **1-2 subsystems per issue.** If it would touch 3+, split it — the blast radius is too wide for one iteration.
- **Clear "Done When."** If you can't write a test command or verification step, the issue is too vague.
- **Derivable constraints.** If no subsystem invariants apply, the issue might be in an area needing `/explore-subsystem` first.

### Dependency Ordering

Within a milestone:
- Upstream issues first (types/interfaces before implementations)
- Provider subsystems before consumer subsystems
- Use `blockedBy` relationships for hard dependencies

Between milestones:
- Foundation milestones first (shared types, core infrastructure)
- Integration milestones after all dependencies are in place
- Cleanup/migration milestones last

### Deriving Issue Content from Subsystem Specs

| Issue field | Derived from |
|------------|-------------|
| `## Subsystems` | Step 4 subsystem analysis — which specs own the affected files |
| `## Constraints` | Subsystem `invariants` — what must not break |
| `## Done When` | Subsystem `tests.tier0` or `tests.tier1` — the verification command |
| `## Acceptance Criteria` | Combination of user's vision + subsystem `gaps` + invariants |
| Priority | User input from Step 6 + subsystem `gaps.priority` if overlapping |

---

## Edge Cases

### Existing Initiative/Project Overlaps

When Linear exploration finds overlap:
1. Surface it explicitly — show the user what exists
2. Ask whether to extend or create separate
3. If extending: propose new milestones/issues within the existing structure
4. If creating separate: document why it's distinct from the existing work

### Missing Subsystem Specs

When the vision touches areas not covered by any spec:
1. Flag these areas as "unknown complexity"
2. Propose a **prerequisite milestone** with `/explore-subsystem` issues
3. Mark subsequent milestones that depend on those areas as "pending exploration"
4. Warn the user that estimates for unexplored areas are less reliable

Example prerequisite issue:
```markdown
## Goal
Create subsystem spec for [area]

## Subsystems
[none — this IS the exploration]

## Acceptance Criteria
- [ ] subsystems_knowledge/{system}/{subsystem}.yaml exists
- [ ] Spec has: id, description, paths.owned, invariants, tests

## Constraints
Follow the schema in references/subsystem-schema.md

## Done When
YAML file exists and contains all required sections
```

### Scope Unclear After Asking

If ambiguity persists after the clarifying questions:
1. Propose a **discovery sprint** — a small project with exploratory issues
2. Each exploratory issue produces a decision document, not code
3. After the discovery sprint, re-run `/strategic-plan` with the new context

### Very Large Scope (20+ Issues)

1. Detail **Phase 1** fully with complete issues
2. Create **Phase 2+** as placeholder milestones with summary descriptions
3. Note in the proposal: "Re-run `/strategic-plan` after Phase 1 for detailed Phase 2 breakdown"
4. This prevents stale issues that become outdated before work reaches them

### Contradictory Requirements

If the user's vision contains contradictions (e.g., "migrate to new API" + "don't change any endpoints"):
1. Surface the contradiction explicitly
2. Present both interpretations
3. Ask the user to resolve
4. NEVER silently resolve contradictions — they lead to wasted harness iterations

### Cross-Team Work

When work spans multiple teams:
1. The project belongs to one team (the primary owner)
2. Individual issues can be assigned to different teams
3. Ask which team owns the project if unclear
4. Note cross-team issues in the proposal so the user can coordinate

---

## Integration Points

| Component | How Strategic Planner Interacts |
|-----------|-------------------------------|
| `/strategic-plan` | Command that invokes this skill as its methodology |
| `/harness` | Consumes the issues this skill produces (harness-consumable format) |
| `/plan` | Handles individual issue-level planning during harness execution |
| `/work` | Executes the plan for each issue during harness execution |
| `/review` | Verifies each issue's work against subsystem contracts |
| `/explore-subsystem` | Fills gaps when subsystem specs are missing |
| Subsystem specs | Source of truth for invariants, tests, dependencies, readiness |
| Linear MCP tools | Read existing state, create new hierarchy |

### The Closed Loop

```
/strategic-plan → produces issues in Linear
         ↓
/harness start → picks up issues, executes plan→work→review→commit
         ↓
Issues move to Done → harness picks up next issue
         ↓
/discover (periodic) → finds patterns from friction
         ↓
/strategic-plan (next vision) → benefits from updated specs and skills
```

This is the compound engineering loop at the strategic level. Each cycle improves the subsystem specs and skills, making the next `/strategic-plan` breakdown more accurate.
