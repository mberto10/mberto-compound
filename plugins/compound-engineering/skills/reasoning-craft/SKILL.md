---
name: Reasoning Craft
description: This skill should be used when the user wants to "reason about architecture", "get strategic analysis", "use a reasoning model", "prepare context for deep think", "transform reasoning output", or when Claude needs to assemble codebase context for frontier reasoning models and transform their responses into actionable work items.
---

# Reasoning Craft

## Purpose

Bridge the gap between codebase knowledge and frontier reasoning models. This skill defines:

1. **How to assemble context** — structured documents that give reasoning models the information they need
2. **The output format contract** — what the reasoning model's response must look like
3. **How to transform responses** — parsing rules for converting reasoning output into Linear issues, YAML updates, and ADRs

The `/reason` command provides the **workflow**. This skill provides the **methodology**.

---

## Context Assembly

The `gather_context.py` helper assembles a structured markdown document with these sections:

| Section | Source | Purpose |
|---------|--------|---------|
| Question | User input | What the reasoning model should analyze |
| Subsystem Knowledge | `subsystems_knowledge/**/*.yaml` | Technical boundaries, invariants, dependencies, gaps |
| Linear Project State | Linear MCP tools | Current work state, what's planned, what exists |
| Recent Commits | `git log` | Active areas, momentum, recent decisions |
| Response Instructions | Template file | How to structure the response |

### Subsystem Scoping

When specific subsystems are requested, the helper resolves **transitive dependencies** up to 2 hops via `dependencies.compile_time` and `dependencies.runtime`. This ensures the reasoning model sees the full dependency context, not just the directly requested subsystems.

When `--all-subsystems` is used, all YAMLs are included. Use this for broad strategic questions; use specific subsystems for focused architecture questions.

### Linear Context

Claude fetches Linear data via MCP tools and serializes it to a temporary markdown file before invoking the helper. The format should be:

```markdown
### Initiative: {title}
Status: {status}

#### Project: {title}
Status: {status} | Lead: {lead}

##### Milestone: {title}
Status: {status} | Target: {date}

- [{status}] {issue title} (ID: {id})
  Priority: {priority} | Assignee: {assignee}
```

---

## Output Format Contract

The transform step uses best-effort section-marker parsing. Templates encourage the reasoning model to use these section headers when its analysis produces actionable work, but none are strictly required. The transform step will look for these sections and extract what it finds. Include whichever are relevant to the analysis.

### Parseable Sections

#### `## Summary`
Executive summary of the analysis. Typically 2-3 paragraphs.

#### `## Linear Hierarchy`
Proposed work breakdown using this format:

```
Initiative: {title}
  Project: {title}
    Milestone: {title} — {what is true after}
      - [S] {issue title} | Subsystems: {list} | {one-line description}
      - [M] {issue title} | Subsystems: {list} | {one-line description}
      - [L] {issue title} | Subsystems: {list} | {one-line description}
```

**Complexity markers:**
- `[S]` — Small: 1-2 change groups, single subsystem, straightforward
- `[M]` — Medium: 3-5 change groups, 1-2 subsystems, some complexity
- `[L]` — Large: 5+ change groups, multiple subsystems, consider splitting

Each issue line must include:
- Complexity marker in brackets
- Issue title (concise, imperative)
- `Subsystems:` with comma-separated subsystem IDs
- One-line description after the pipe

#### `## Subsystem Updates`
Proposed changes to subsystem YAML specs:

```
Subsystem: {id}
  Update: {section} — {what to add/change}
  Reason: {why this is needed}
```

#### `## ADR: {title}`
Architecture Decision Record with fields:
- **Status:** Proposed
- **Context:** Why this decision is needed
- **Decision:** What we decided
- **Consequences:** Trade-offs and implications
- **Rollback Plan:** (for migrations) How to revert

#### `## Immediate Plan`
Top 3-5 ordered next steps, each referencing specific subsystems or Linear items.

---

## Transform Parsing Rules

The transform step uses **best-effort section-marker parsing**. It does NOT require perfect formatting — it extracts what it can and reports what it found.

### Section Detection

Scan for `## ` headers matching the contract sections. Content between one `## ` header and the next belongs to that section.

### Linear Hierarchy Parsing

For each line in the `## Linear Hierarchy` section:

1. **Initiative:** Lines starting with `Initiative:` → extract title
2. **Project:** Lines starting with `Project:` (possibly indented) → extract title
3. **Milestone:** Lines starting with `Milestone:` (possibly indented) → extract title and "what is true after" (after the `—`)
4. **Issue:** Lines starting with `- [S]`, `- [M]`, or `- [L]` → extract:
   - Complexity from bracket
   - Title (text before first `|`)
   - Subsystems (text after `Subsystems:` before next `|`)
   - Description (remaining text)

### Issue Expansion

When creating Linear issues from parsed items, expand each into the harness-consumable template:

```markdown
## Goal
{issue description}

## Subsystems
{subsystem list from parsed line}

## Acceptance Criteria
- [ ] {derived from description — Claude infers testable assertions}

## Constraints
{loaded from referenced subsystem specs' invariants}

## Done When
{loaded from referenced subsystem specs' tests.tier0}
```

### Subsystem Update Parsing

For each block in `## Subsystem Updates`:
1. Extract subsystem ID from `Subsystem:` line
2. Extract section and change from `Update:` line
3. Extract rationale from `Reason:` line

### ADR Parsing

Extract the ADR title from the `## ADR: {title}` header. Content is preserved as-is for the ADR file.

---

## Audit Trail

All reasoning sessions are saved to an audit trail for traceability:

```
strategic-reasoning/
  {timestamp}-{slug}/
    context.md       — the assembled context document (gather output)
    response.md      — the reasoning model's raw response (transform input)
    actions.md       — what was created/modified (transform output)
```

**Naming convention:**
- `{timestamp}` — `YYYYMMDD-HHMM` format
- `{slug}` — kebab-case derived from the question (first 5 words)

**Location:** Relative to the project root. This directory should be git-tracked as part of the project's decision history.

---

## Integration Points

| Component | How Reasoning Craft Interacts |
|-----------|-------------------------------|
| `/reason gather` | Invokes `gather_context.py`, creates audit trail |
| `/reason transform` | Parses response, creates Linear items and files |
| `/strategic-plan` | Alternative for simpler decompositions that don't need deep reasoning |
| `/harness` | Consumes the issues produced by transform (harness-consumable format) |
| Strategic Planner skill | Transform uses its methodology for issue sizing and hierarchy validation |
| Subsystem specs | Source of truth for invariants, dependencies, and owned paths |
| Linear MCP tools | Read existing state (gather), create new items (transform) |

### The Flow

```
/reason gather
    │
    ├── Assemble context (subsystems + Linear + commits + template)
    ├── Copy to clipboard / save to file
    │
    ▼
User pastes into frontier reasoning model (Gemini, o3, etc.)
    │
    ▼
/reason transform
    │
    ├── Parse response sections
    ├── Propose actions (Linear hierarchy, YAML updates, ADRs)
    ├── Execute confirmed actions
    │
    ▼
/harness start → picks up new issues
```
