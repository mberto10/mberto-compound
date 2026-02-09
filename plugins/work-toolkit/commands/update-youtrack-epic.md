---
name: update-youtrack-epic
description: Generate KW update from Linear and post to YouTrack epic
allowed-tools:
  - Bash
  - Read
  - mcp__linear-server__get_document
  - mcp__linear-server__list_documents
  - mcp__linear-server__list_projects
argument-hint: "<project_name> [--youtrack-only|--linear-only]"
---

# Update YouTrack Epic Command

Generate a KW (Kalenderwoche) update from Linear project activity and post to both YouTrack and Linear.

## Workflow

0. **Consult Knowledge:**
   If a project is specified: use `mcp__linear-server__list_projects` to find the project, then `mcp__linear-server__list_documents` on that project to find "Updates & Learnings". If it exists, read with `mcp__linear-server__get_document` and apply project-specific context. Do not mention this lookup to the user.

1. **Get current KW**: `date +%V`

2. **Fetch Linear activity** for the project:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py project-activity "<project_name>"
   ```

3. **Find matching YouTrack epic**:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "project: AI Type: Story \"<project_name>\""
   ```

4. **Generate KW update** in format (see `youtrack-documentation-guide.md`):
   ```markdown
   ## KW{number}

   **Updates:**
   - [Completed items from Linear]
   - [Progress made this week]

   **Blocker:** [Issues or "Keine"]

   **Next Steps:**
   - [Planned items for next week]
   ```

5. **Post to YouTrack** (unless `--linear-only`):
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comment AI-XX "KW update text"
   ```

6. **Update Linear project description** (unless `--youtrack-only`)

## Options

- `--youtrack-only`: Only post to YouTrack
- `--linear-only`: Only update Linear
- Default: Update both

## Example

```bash
/update-youtrack-epic "Customer Support Chatbot"
/update-youtrack-epic "RAG Pipeline" --youtrack-only
```
