---
name: update-youtrack-epic
description: Generate KW update from Linear and post to YouTrack epic
allowed-tools:
  - Bash
  - Read
argument-hint: "<project_name> [--youtrack-only|--linear-only]"
---

# Update YouTrack Epic Command

Generate a KW (Kalenderwoche) update from Linear project activity and post to both YouTrack and Linear.

## Workflow

1. **Get current KW**: `date +%V`

2. **Fetch Linear activity** for the project:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py project-activity "<project_name>"
   ```

3. **Find matching YouTrack epic**:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "project: AI Type: Story \"<project_name>\""
   ```

4. **Generate KW update** in format:
   ```markdown
   **KW[XX] Update**

   **Erledigt:**
   - [Completed items from Linear]

   **In Arbeit:**
   - [In progress items]

   **Nächste Schritte:**
   - [Planned items]
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
