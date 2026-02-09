---
name: reflect
description: Capture learnings from a work session into Linear project documents
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__linear-server__get_document
  - mcp__linear-server__list_documents
  - mcp__linear-server__list_projects
  - mcp__linear-server__get_project
  - mcp__linear-server__create_document
  - mcp__linear-server__update_document
  - mcp__linear-server__create_issue
argument-hint: "[project_name] [focus text]"
---

# Reflect Command

Capture learnings from the current work session into Linear project documents. Splits learnings into cross-cutting patterns (Management doc) and project-specific knowledge (per-project "Updates & Learnings" doc).

**User input:** $ARGUMENTS

## Workflow

### 1. Gather Session Context

Analyze the current session for:
- What commands/skills were used
- What decisions were made
- What friction occurred (corrections, retries, misunderstandings)
- What worked well
- What was missing

If the user provided focus text, prioritize that observation.

### 2. Read Current Knowledge (avoid duplicates)

1. **Management doc:** Use `mcp__linear-server__list_documents` with `projectId: "78be1839-6b2f-4310-a8d2-209f8fed436a"` and find "Work Patterns & Communication" by title. Read it with `mcp__linear-server__get_document`.
2. **Project doc (if project specified):** Use `mcp__linear-server__list_projects` to find the project by name, then `mcp__linear-server__list_documents` with the project ID to find "Updates & Learnings". Read it if it exists.

This prevents adding duplicate rules.

### 3. Classify Learnings

For each potential learning, classify:

| Category | Target | Example |
|----------|--------|---------|
| **Cross-cutting** | Management "Work Patterns & Communication" doc | Communication tone rules, reporting patterns, general workflow heuristics |
| **Project-specific** | Project "Updates & Learnings" doc | Project context, domain-specific decisions, stakeholder preferences |
| **Plugin improvement** | Compound project issue | Missing features, bugs, structural improvements to work-toolkit |

### 4. Format as Heuristics

Convert observations into 1-line testable rules:

```
[Specific, actionable learning statement] [src:YYYY-MM-DD__context] [type:rule|feature|fix]
```

**Quality filter — only include learnings that are:**
- Specific enough to act on
- Testable (can verify compliance)
- Likely to recur
- Worth the encoding cost

Reject vague observations like "be more careful" or "remember to check."

### 5. Update Management Doc

If cross-cutting learnings exist:
1. Read current content of the Management doc
2. Append new rules to the relevant section (Communication, Reporting, Meeting Preparation, or Work Patterns)
3. Use `mcp__linear-server__update_document` to write back the full updated content

### 6. Update/Create Project "Updates & Learnings" Doc

If project-specific learnings exist:

**If doc exists:** Read current content, prepend new dated section (reverse chronological), update via `mcp__linear-server__update_document`.

**If doc doesn't exist:** Create via `mcp__linear-server__create_document` with this format:

```markdown
# Updates & Learnings

Project-specific knowledge captured from work sessions.

---

## YYYY-MM-DD
- [Learning] [src:YYYY-MM-DD__context] [type:rule]
- [Learning] [src:YYYY-MM-DD__context] [type:rule]
```

**Subsequent reflects** prepend new dated sections at the top (after the header), keeping reverse chronological order:

```markdown
# Updates & Learnings

Project-specific knowledge captured from work sessions.

---

## YYYY-MM-DD (newer)
- [New learning] [src:YYYY-MM-DD__context] [type:rule]

---

## YYYY-MM-DD (older)
- [Previous learning] [src:YYYY-MM-DD__context] [type:rule]
```

### 7. Create Compound Issues for Plugin Improvements

For any plugin improvement learnings, create an issue in the Compound project:
- Team: MB90
- Project: Compound
- Labels: compound-learning
- Title: `[work-toolkit] YYYY-MM-DD: [brief description]`
- Body: Standard compound-learning format with proposed changes

### 8. Report Summary

Report to user:
- Count of learnings captured (X cross-cutting, Y project-specific, Z plugin improvements)
- Which documents were updated/created (with Linear URLs if available)
- Highest priority item
- Brief list of what was captured

## Important Notes

- If user provided focus text, make that the PRIMARY learning
- Ground all observations in what actually happened this session
- Be specific — vague learnings have no value
- Quality over quantity — 3 good learnings > 10 vague ones
- Include source references for traceability
- Do not duplicate rules that already exist in the Management doc or project doc
