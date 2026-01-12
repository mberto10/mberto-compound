---
name: weekly-email
description: Compile weekly Lenkungsausschuss update from YouTrack KW comments
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
argument-hint: "[--kw=XX]"
---

# Weekly Email Command

Compile weekly update email for Lenkungsausschuss from YouTrack project KW comments.

**Key principle:** Curate 5-6 most significant projects, don't dump all updates.

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

3. **Curate and prioritize projects**:

   From all fetched updates, select 5-6 most significant projects using these criteria:

   **Priority order:**
   1. **Blockers present** - Projects with active blockers need visibility
   2. **Substantial progress** - Meaningful milestones achieved, not just "minor updates"
   3. **Strategic importance** - High-visibility or leadership-attention projects
   4. **Cross-team dependencies** - Updates that affect other teams

   **Exclude:**
   - Projects with only "waiting for feedback" or "no changes" status
   - Minor maintenance updates unless strategically relevant

   **Present selection to user** using AskUserQuestion with the ranked list. Let user adjust selection before generating email.

4. **Compile into email format** (only selected projects):
   ```
   Betreff: KI-Lenkungsausschuss Updates - KW [XX]

   Hallo Lieber Lenkungsausschuss,

   Im folgenden findet Ihr eine Zusammenfassung der wichtigsten Updates aus dem GenAI Team für KW[XX]:

   ---

   ## [Project 1 Name]

   **Updates:**
   - [Progress items from KW comment]

   **Blocker:** [Issues or "Keine"]

   **Next Steps:**
   - [Planned items]

   ---

   ## [Project 2 Name]

   [...]

   ---

   Bei Fragen wendet euch jederzeit gerne an Sina oder mich.
   ```

5. **Present draft** for final review

## Operational Rules

- KW patterns vary: users write `KW2`, `KW02`, `KW 02`, or `KW 2`. The helper script handles all variants. [src:2026-01-12]
- Target 5-6 projects per email. A Lenkungsausschuss update should be scannable, not exhaustive. [src:2026-01-12]
- Always show user the project selection before generating the final email. [src:2026-01-12]
- Use exact template phrasing - greeting: "Hallo Lieber Lenkungsausschuss,", intro: "Im folgenden findet Ihr eine Zusammenfassung der wichtigsten Updates aus dem GenAI Team für KW[XX]:", closing: "Bei Fragen meldet euch jederzeit gerne an Sina oder mich." [src:2026-01-12]

## Options

- `--kw=XX`: Specify calendar week (default: current)

## Example

```bash
/weekly-email
/weekly-email --kw=50
```
