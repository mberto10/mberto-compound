# Local `.agents` Skills

These skills are workspace-local and are meant to be consumed directly from `.agents/skills/`.

## Structure

Each skill may contain:

- `SKILL.md`
- `references/`
- `scripts/`
- `templates/`
- `assets/`

## Source Of Truth

For compound-engineering behavior in this repo, prefer the local skill directories here over older global `~/.codex/skills/*` copies. The local versions are the ones paired with the local workflows and runner state model.

## Shared Reference

Compound-engineering skills that need the core methodology should use:

`/Users/bruhn/.codex/worktrees/a7a7/mberto-compound/.agents/references/compounding-methodology.md`
