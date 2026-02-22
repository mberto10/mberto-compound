---
description: Assemble codebase context for frontier reasoning models and transform their responses into actionable work
argument-hint: <gather|transform> [--question "..."] [--template architecture|roadmap|debt|migration] [--subsystems backend/api,...] [--all-subsystems] [--commits 20] [--input FILE]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__claude_ai_Linear__list_issues, mcp__claude_ai_Linear__list_projects, mcp__claude_ai_Linear__list_milestones, mcp__claude_ai_Linear__list_initiatives, mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__get_project, mcp__claude_ai_Linear__get_initiative, mcp__claude_ai_Linear__get_milestone, mcp__claude_ai_Linear__create_issue, mcp__claude_ai_Linear__create_milestone, mcp__claude_ai_Linear__list_teams, mcp__claude_ai_Linear__list_issue_labels, mcp__claude_ai_Linear__list_issue_statuses
---

# Reason Command

Leverage frontier reasoning models (Gemini Deep Think, o3, etc.) for strategic questions — architecture decisions, roadmap planning, migration strategies, technical debt assessment. Two-phase workflow: **gather** assembles structured context, **transform** converts the model's response into actionable work.

**Input:** $ARGUMENTS

---

## Parse Subcommand

Extract the subcommand from $ARGUMENTS:
- `gather` (default if omitted) — assemble context document for a reasoning model
- `transform` — parse a reasoning model's response into Linear issues, YAML updates, and ADRs

Also extract optional flags:
- `--question "..."` — the strategic question
- `--template architecture|roadmap|debt|migration` — prompt template type
- `--subsystems backend/api,frontend/core-loop` — specific subsystems (comma-separated)
- `--all-subsystems` — include all subsystem YAMLs
- `--commits N` or `--commits-since 2w` — commit depth
- `--project LINEAR_PROJECT` — Linear project to fetch context from
- `--milestone LINEAR_MILESTONE` — Linear milestone to focus on
- `--input FILE` — file containing the reasoning model's response (transform only)
- `--slug NAME` — custom slug for the audit trail directory

---

## Subcommand: `gather`

### Step 1: LOAD

Read the **reasoning-craft** skill at `plugins/compound-engineering/skills/reasoning-craft/SKILL.md`. Internalize the context assembly methodology and output format contract.

### Step 2: CLARIFY

If required information is missing from the flags, ask the user. Batch all questions into a single AskUserQuestion call.

**Always needed:**
- **Question** — if `--question` not provided: "What strategic question should the reasoning model analyze?"
- **Template** — if `--template` not provided: offer architecture, roadmap, debt, migration as options

**Ask only if ambiguous:**
- **Subsystem scope** — if neither `--subsystems` nor `--all-subsystems` provided: "Which subsystems are relevant? (specific list or all)"
- **Linear project** — if `--project` not provided: "Should I include Linear project context? If so, which project?"
- **Commit depth** — if `--commits` not provided, default to 20 most recent commits (don't ask unless the user seems to want a different range)

### Step 3: FETCH LINEAR

If a Linear project was specified (via flag or user answer):

1. Fetch the project details using the Linear MCP tools
2. Fetch milestones for the project
3. Fetch issues for each milestone (or for the project if no milestones)
4. Serialize the data into markdown following this format:

```markdown
### Project: {title}
Status: {status}

#### Milestone: {title}
Status: {status} | Target: {target_date}

- [{status}] {issue title} (ID: {id})
  Priority: {priority} | Labels: {labels}
```

5. Write the serialized context to `.claude/reason-linear-context.tmp.md`

If no Linear project specified, skip this step.

### Step 4: RUN SCRIPT

Invoke the gather helper script:

```bash
python3 plugins/compound-engineering/skills/reasoning-craft/helpers/gather_context.py \
  --question "{question}" \
  --template {template} \
  {--subsystems X,Y or --all-subsystems} \
  {--commits N} \
  {--linear-context .claude/reason-linear-context.tmp.md} \
  --output .claude/reason-context-output.tmp.md \
  --cwd .
```

Use the flags assembled from Steps 2-3. If commits weren't specified, use `--commits 10` as default.

### Step 5: SAVE AUDIT

1. Generate the audit trail slug:
   - Timestamp: `YYYYMMDD-HHMM` format (current time)
   - Slug: first 5 words of the question, kebab-cased, or `--slug` if provided
   - Directory: `strategic-reasoning/{timestamp}-{slug}/`

2. Create the audit directory and copy the context document:
   ```
   strategic-reasoning/{timestamp}-{slug}/context.md
   ```

3. Read back the generated context document from `.claude/reason-context-output.tmp.md`.

### Step 6: PRESENT

Report to the user:

1. **What was included:**
   - Number of subsystem YAMLs loaded (and which ones)
   - Whether Linear context was included (and how many issues)
   - Number of commits included
   - Which template was used
   - Any warnings (missing YAMLs, skipped sections)

2. **Audit trail location:** Path to `strategic-reasoning/{slug}/context.md`

3. **Next steps:**
   - The context has been copied to clipboard (if successful) and saved to the audit trail
   - Paste it into your reasoning model of choice (Gemini Deep Think, o3, etc.)
   - When you have the response, run `/reason transform` to convert it into actionable work

4. **Size info:** Approximate character/word count of the document, so the user knows if it fits model context windows.

---

## Subcommand: `transform`

### Step 1: LOAD

Read the **reasoning-craft** skill and the **strategic-planner** skill. The reasoning-craft skill defines the output format contract and parsing rules. The strategic-planner skill provides the methodology for validating hierarchy and issue sizing.

### Step 2: GET RESPONSE

Obtain the reasoning model's response:

- If `--input FILE` was provided, read the file
- Otherwise, ask the user: "Please paste the reasoning model's response, or provide a file path to it."
  - If user pastes text, save it to `.claude/reason-response.tmp.md`
  - If user provides a file path, read that file

### Step 3: FIND AUDIT

Look for the matching audit trail from the gather step:

1. Glob `strategic-reasoning/*/context.md` and find the most recent one
2. If `--slug` was provided, match against it
3. Read the context.md to understand what was originally asked (the question and which subsystems/Linear items were included)

If no audit trail found, proceed without it — transform can work standalone.

### Step 4: PARSE

Apply **best-effort section-marker parsing** as defined in the reasoning-craft skill:

1. Scan for `## Summary`, `## Linear Hierarchy`, `## Subsystem Updates`, `## ADR:`, `## Immediate Plan`
2. Extract content for each found section
3. For `## Linear Hierarchy`, parse the structured format:
   - Extract initiatives, projects, milestones, issues
   - For each issue line: extract complexity marker, title, subsystems, description
4. For `## Subsystem Updates`, parse each update block
5. For `## ADR: {title}`, extract the full ADR content

Report what was found:
```
Parsed sections:
- Summary: found (N paragraphs)
- Linear Hierarchy: found (N initiatives, N projects, N milestones, N issues)
- Subsystem Updates: found (N updates)
- ADR: found — "{title}"
- Immediate Plan: found (N steps)
```

If a section is missing or couldn't be parsed, report it but continue with what's available.

### Step 5: PROPOSE

Present the available actions to the user:

**1. Create Linear Hierarchy** (if `## Linear Hierarchy` was parsed)
- Show the parsed hierarchy in a readable tree format
- Note total issue count and complexity distribution ([S]/[M]/[L])
- Ask: "Create this hierarchy in Linear? I'll expand each issue into harness-consumable format."

**2. Update Subsystem YAMLs** (if `## Subsystem Updates` was parsed)
- Show each proposed update
- Ask: "Apply these subsystem spec updates?"

**3. Create ADR** (if `## ADR:` was parsed)
- Show the ADR title and summary
- Ask: "Save this ADR to the audit trail?"

**4. Save to Audit Trail** (always available)
- The raw response and a summary of actions taken

Use a single AskUserQuestion with multiSelect to let the user choose which actions to execute.

### Step 6: EXECUTE

For each confirmed action:

#### Create Linear Hierarchy

For each issue in the parsed hierarchy:

1. **Expand to harness-consumable format:**
   - `## Goal` — from the parsed description
   - `## Subsystems` — from the parsed subsystems list
   - `## Acceptance Criteria` — infer testable assertions from the goal and description
   - `## Constraints` — load from the referenced subsystem specs' `invariants` (read the YAML files)
   - `## Done When` — load from the referenced subsystem specs' `tests.tier0`

2. **Show the expanded issue** to the user before creating it

3. **Create in Linear** using the MCP tools:
   - Create milestones first (if they don't exist)
   - Create issues under the correct milestone
   - Set appropriate labels and priority based on complexity marker

Process in batches — show 3-5 issues at a time and confirm before creating.

#### Update Subsystem YAMLs

For each proposed update:
1. Read the current YAML file
2. Show the diff (what will change)
3. Apply the edit

#### Create ADR

1. Save to `strategic-reasoning/{slug}/adr-{kebab-title}.md`
2. Format with standard ADR structure

### Step 7: SUMMARY

Report what was created:

1. **Linear items created:**
   - Number of initiatives, projects, milestones, issues
   - Link to the project in Linear (if available)

2. **Files modified:**
   - Subsystem YAMLs updated (if any)
   - ADR created (if any)

3. **Audit trail:**
   - Save the response to `strategic-reasoning/{slug}/response.md`
   - Save an actions summary to `strategic-reasoning/{slug}/actions.md`

4. **Next steps:**
   - "Run `/harness start --project {project_id}` to begin autonomous execution of the created issues"
   - "Review the created issues in Linear to adjust priorities or add details"
   - "Run `/reason gather` again if you need deeper analysis on a specific area"

---

## Notes

- The gather step is intentionally **model-agnostic** — it produces a document you can paste into any frontier reasoning model.
- The transform step is **best-effort** — it handles imperfect formatting gracefully and reports what it couldn't parse.
- The audit trail creates a decision history: question → context → reasoning → actions. This is valuable for understanding WHY certain architectural decisions were made.
- If the reasoning model's response doesn't follow the output format contract perfectly, transform will extract what it can. Missing sections are skipped, not treated as errors.
- The expanded Linear issues follow the same harness-consumable format as `/strategic-plan`, making them immediately executable by `/harness start`.
