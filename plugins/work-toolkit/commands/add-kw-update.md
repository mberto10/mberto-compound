---
name: add-kw-update
description: Add an entry to the current week's KW update on a YouTrack epic
allowed-tools: Bash, Read
argument-hint: "<project_name> <section> <content>"
---

# Add KW Update Command

Quickly add an entry to the current week's KW update on a YouTrack epic. Automatically handles creating new KW comments or updating existing ones.

## Arguments

- `<project_name>`: Name of the project (matches YouTrack epic)
- `<section>`: One of `update`, `blocker`, `next`
- `<content>`: The text to add (as a bullet point)

## Workflow

### 1. Find the Epic

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py find-epic "<project_name>"
```

Extract the epic ID (e.g., `AI-301`).

### 2. Get Current KW

```bash
date +%V
```

### 3. Check for Existing KW Comment

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments <epic_id> --full
```

Search comments for one that starts with `## KW{current_week}` or `KW{current_week}`.

### 4a. If KW Comment EXISTS → Update It

Parse the existing comment and add the new content to the appropriate section:

| Section Arg | Comment Section |
|-------------|-----------------|
| `update` | `**Updates:**` |
| `blocker` | `**Blocker:**` |
| `next` | `**Next Steps:**` |

**Rules for updating:**
- Add new bullet point under the matching section
- Keep all other sections unchanged
- Preserve the comment structure

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py update-comment <epic_id> <comment_id> "<updated_text>"
```

### 4b. If NO KW Comment → Create New

Create a new comment following the standard KW format (see `youtrack-documentation-guide.md`):

```markdown
## KW{number}

**Updates:**
- [content if section=update]

**Blocker:** [content if section=blocker, else "Keine"]

**Next Steps:**
- [content if section=next]
```

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comment <epic_id> "<new_comment_text>"
```

### 5. Confirm Success

Report what was done:
- Which epic was updated
- Whether comment was created or updated
- The content that was added

## Section Mapping

| Argument | Section Header | Default if Empty |
|----------|---------------|------------------|
| `update` | `**Updates:**` | (empty list) |
| `blocker` | `**Blocker:**` | `Keine` |
| `next` | `**Next Steps:**` | (empty list) |

## Examples

```bash
# Add a completed item
/add-kw-update "Customer Support Chatbot" update "System prompt v2 deployed"

# Add a blocker
/add-kw-update "Checkout Chatbot" blocker "Warten auf API credentials"

# Add next step
/add-kw-update "AI Change Management" next "Stakeholder demo am Freitag"

# Clear a blocker (replaces with Keine)
/add-kw-update "Customer Support Chatbot" blocker "Keine"
```

## Important Notes

- **German language**: All content should be in German (see documentation guide)
- **No Linear references**: Do not include Linear issue IDs in YouTrack comments
- **One bullet per call**: Each invocation adds one bullet point
- **Idempotent for blockers**: Setting blocker to "Keine" replaces the entire blocker section

## Reference

See `skills/youtrack-dashboard/references/youtrack-documentation-guide.md` for full KW format specification.
