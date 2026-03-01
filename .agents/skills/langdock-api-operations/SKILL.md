---
name: langdock-api-operations
description: Use when the user asks to create, get, update, or chat with Langdock assistants; list Langdock models; upload, list, update, delete, or search knowledge-folder files; or export Langdock usage data (users, assistants, workflows, projects, models). Run the wrapper dispatcher instead of composing ad hoc API commands.
---

# Langdock API Operations

Execute Langdock API operations through the wrapper dispatcher script:

```bash
bash /Users/max/mberto-compound/codex-skills/langdock-api-operations/scripts/langdock_ops.sh <domain> <operation> [args...]
```

## Domains and Operations

- `agent`: `create`, `get`, `update`, `chat`, `models`, `upload`
- `knowledge`: `upload`, `update`, `list`, `delete`, `search`
- `export`: `users`, `agents`, `workflows`, `projects`, `models`

See full argument mapping in:

- `/Users/max/mberto-compound/codex-skills/langdock-api-operations/references/operations-map.md`

## Environment

- Required: `LANGDOCK_API_KEY`
- Optional override: `LANGDOCK_PLUGIN_ROOT`
  - If unset, the wrapper falls back to `/Users/max/mberto-compound/plugins/langdock-dev`

## Standard Workflow

1. Identify requested domain and operation.
2. Translate user inputs into CLI flags using `operations-map.md`.
3. Run the dispatcher script once with pass-through args.
4. Return stdout as-is for success.
5. If command fails, return stderr and actionable next step.

## Examples

```bash
# list models
bash /Users/max/mberto-compound/codex-skills/langdock-api-operations/scripts/langdock_ops.sh agent models

# search knowledge folders
bash /Users/max/mberto-compound/codex-skills/langdock-api-operations/scripts/langdock_ops.sh knowledge search --query "quarterly revenue" --limit 5

# export users usage data
bash /Users/max/mberto-compound/codex-skills/langdock-api-operations/scripts/langdock_ops.sh export users --from 2026-02-01 --to 2026-02-10 --timezone Europe/Berlin
```
