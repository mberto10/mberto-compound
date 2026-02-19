# Codex Skills

Local Codex skill library for install via the official skill installer.

## Layout

```
codex-skills/
  skill-name/
    SKILL.md
    references/
    scripts/
    assets/
```

## Install

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo mberto10/mberto-compound \
  --path codex-skills/skill-name
```

Multiple skills can be installed by repeating `--path`.

## Template

`skill-template/` is a starter you can copy and rename.
