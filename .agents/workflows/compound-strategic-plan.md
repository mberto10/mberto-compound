---
description: Decompose a product vision into a Linear hierarchy (initiative, project, milestones, issues) grounded in subsystem knowledge
---

# Strategic Plan Command

Decompose a product vision into an executable Linear hierarchy grounded in subsystem knowledge. This command implements the **strategic-planner** skill methodology.

---

## Input

**User's vision:** The user's request.

If no argument provided, ask the user what they want to build, migrate, or implement.

---

## CRITICAL RULE

**You MUST load the strategic-planner skill methodology AND read subsystem specs BEFORE creating anything in Linear.** The skill provides the decomposition methodology. The subsystem specs provide the technical grounding. Without both, issues will be vague and ungrounded.

---

## Step 1: LOAD — Internalize the methodology

Load and internalize the **strategic-planner** skill. It contains:
- The Linear hierarchy model (initiative → project → milestone → issue)
- Scope sizing heuristics and decision tree
- Question protocol (what to always ask, what to ask only if ambiguous)
- Breakdown methodology (top-down decomposition, milestone design, issue design)
- Edge case handling

**This is your playbook.** Every decision in subsequent steps should trace back to the skill methodology.

---

## Step 2: EXPLORE LINEAR — What already exists?

Before planning anything new, understand what's already in Linear.

1. **List teams** — determine which team(s) this work belongs to
2. **List initiatives** — check for existing strategic themes that overlap with the user's vision
3. **List projects** — check for existing projects in the relevant area
4. **For overlapping items:** read their details to understand current scope and progress

**Output:** Summary of existing Linear state relevant to this vision, including any overlaps.

If overlaps are found, surface them to the user and ask whether to extend or create separate (per the skill's "Overlap Check" section).

---

## Step 3: EXPLORE SUBSYSTEMS — What's the technical landscape?

Read subsystem specs to understand technical blast radius:

```
Read: subsystems_knowledge/**/*.yaml
```

For each subsystem, assess:
- **Affected?** Does this vision touch files in `paths.owned`?
- **Readiness:** Are there `gaps` that would affect this work?
- **Invariants:** What constraints must hold?
- **Tests:** What verification exists?
- **Dependencies:** What subsystems depend on affected ones?
- **Helpful Skills:** What skills should be loaded?

**Output:** Subsystem impact assessment:

```
Subsystem Impact Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Subsystem        | Impact   | Readiness | Gaps |
|------------------|----------|-----------|------|
| {name}           | Primary  | Ready     | 0    |
| {name}           | Consumer | Ready     | 1    |
| {name}           | Unknown  | No spec   | —    |
```

If subsystem specs are missing for affected areas, flag this per the skill's "Missing Subsystem Specs" edge case — a prerequisite exploration milestone will be needed.

---

## Step 4: SIZE — Determine the right hierarchy level

Apply the skill's **Scope Sizing Decision Tree** using:
- Number of affected subsystems (from Step 3)
- User's language signals ("migrate", "feature", "fix", etc.)
- Timeline (from clarifying questions)
- Whether existing Linear items cover this area (from Step 2)

**Output:** Proposed entry level (Initiative / Project / Milestone / Issue) with reasoning.

---

## Step 5: CLARIFY — Ask essential questions

Apply the skill's **Question Protocol**.

**Always ask** (batch into a single AskUserQuestion call):
1. Scope boundaries — what is explicitly OUT of scope?
2. Priority / timeline — when does this need to be done?
3. High-level acceptance criteria — what does "done" look like?

**Additionally ask** (only if ambiguous after Steps 2-3):
4. Technical approach — if 2+ valid approaches change the breakdown
5. Sequencing constraints — if ordering isn't implied
6. External dependencies — if third-party services or other teams are involved

Present ALL questions in a **single** AskUserQuestion call (up to 4 questions). Do NOT ask one at a time.

---

## Step 6: DECOMPOSE — Break down top-to-bottom

Apply the skill's **Breakdown Methodology**. Work from the highest level down:

### 6a. Initiative (if applicable)
Define: strategic theme, success criteria, which projects belong.

### 6b. Project(s)
Define: body of work, end state, which team owns it, which milestones.

### 6c. Milestones
Design milestones per the skill's criteria:
- Each is a testable checkpoint
- 3-8 issues per milestone
- Foundation milestones before dependent milestones
- Name format: `[Phase N:] [What is true after]`

### 6d. Issues
Design issues per the skill's **harness-consumable** template:

```markdown
## Goal
[One sentence: what should be true after this is done]

## Subsystems
[From Step 3 — which specs own affected files]

## Acceptance Criteria
- [ ] [Testable assertion — from vision + subsystem gaps + invariants]

## Constraints
[From subsystem invariants — what must NOT break]

## Done When
[Test command from subsystem spec, or specific verification step]
```

Apply issue sizing rules:
- 1-5 change groups per issue
- 1-2 subsystems per issue
- Clear "Done When"
- Derive constraints from subsystem specs

### 6e. Dependencies
Set ordering per the skill's dependency rules:
- Upstream before downstream within milestones
- Foundation milestones before integration milestones
- Use `blockedBy` for hard dependencies

---

## Step 7: PROPOSE — Present the full breakdown

Present the complete decomposition for user review BEFORE creating anything in Linear.

**Output format:**

```markdown
# Strategic Plan: {vision summary}

## Entry Level: [Initiative / Project / Milestone]

## Existing Linear Context
[What already exists and how this relates]

## Subsystem Impact
[Summary table from Step 3]

## Proposed Hierarchy

### Initiative: {name} (if applicable)
{Strategic theme and success criteria}

### Project: {name}
{Team: X | End state: Y}

#### Milestone 1: {Phase N: What is true after}
Target: {date if known}

| # | Issue | Subsystems | Blocked By |
|---|-------|------------|------------|
| 1 | {title} | {subsystems} | — |
| 2 | {title} | {subsystems} | #1 |
| 3 | {title} | {subsystems} | — |

#### Milestone 2: {Phase N: What is true after}
...

### Prerequisite Milestones (if subsystem specs missing)
...

## Risks & Unknowns
- {risk 1}
- {risk 2}

## Scope Explicitly Excluded
- {exclusion from Step 5}
```

**For very large scope (20+ issues):** Detail Phase 1 fully, create Phase 2+ as placeholder milestones with summary descriptions per the skill's edge case guidance.

---

## Step 8: CONFIRM — Get user approval

Ask the user to confirm the proposal. They may want to:
- Adjust scope, priorities, or sequencing
- Add or remove milestones/issues
- Change the entry level
- Modify acceptance criteria

Iterate on the proposal until the user approves.

**Do NOT proceed to Step 9 without explicit user approval.**

---

## Step 9: CREATE — Build the hierarchy in Linear

Once approved, create everything in Linear in dependency order:

1. **Initiative** (if applicable) — `create_initiative`
2. **Project** — `create_project` (link to initiative if created)
3. **Milestones** — `create_milestone` (in order, within the project)
4. **Issues** — `create_issue` (within milestones, with `blockedBy` relationships)

For each issue, use the harness-consumable template as the issue description.

Set priorities based on user input from Step 5.

**Output after creation:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRATEGIC PLAN CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Initiative: {name} (if created)
Project:    {name} — {identifier}
Milestones: {count}
Issues:     {count}

Milestone Summary:
  1. {milestone name} — {issue count} issues
  2. {milestone name} — {issue count} issues
  ...

Next Steps:
  1. Run /harness start to begin executing issues
  2. Issues are ordered by dependency — start with the first unblocked issue
  3. After Phase 1, re-run /strategic-plan for detailed Phase 2 breakdown (if applicable)

Subsystem Gaps to Address:
  - {gap — run /explore-subsystem for X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Notes

- This command produces a PROPOSAL first, then creates in Linear only after user approval.
- Every issue is designed to be **harness-consumable** — ready for `/harness start` to pick up and execute via plan→work→review→commit.
- If `subsystems_knowledge/` is empty or missing, warn the user and suggest running `/explore-subsystem` first. Still proceed with the breakdown, but flag affected areas as "unknown complexity."
- The skill methodology handles all edge cases (overlaps, missing specs, large scope, contradictions, cross-team). Refer to it when situations arise.
- Keep the user informed at each step — strategic planning is collaborative, not autonomous.
