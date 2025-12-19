---
name: weekly-email
description: Compile weekly Lenkungsausschuss update from YouTrack KW comments
allowed-tools:
  - Bash
  - Read
argument-hint: "[--kw=XX]"
---

# Weekly Email Command

Compile weekly update email for Lenkungsausschuss from all YouTrack project KW comments.

## Workflow

1. **Get current or specified KW**:
   ```bash
   # Current week
   date +%V

   # Or use --kw=XX argument
   ```

2. **Fetch KW updates from all epics**:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/get_kw_updates.py --kw=XX
   ```

3. **Compile into email format**:
   ```
   Betreff: AI Team Status - KW [XX]

   Hallo zusammen,

   hier der wöchentliche Status unserer Projekte:

   ---

   ## [Project 1 Name]

   **Erledigt:**
   - [Items]

   **In Arbeit:**
   - [Items]

   **Nächste Schritte:**
   - [Items]

   ---

   ## [Project 2 Name]

   [...]

   ---

   Bei Fragen stehe ich gerne zur Verfügung.

   Beste Grüße
   [Name]
   ```

4. **Present draft** for review

## Options

- `--kw=XX`: Specify calendar week (default: current)

## Example

```bash
/weekly-email
/weekly-email --kw=50
```
