#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PLUGINS_DIR="$REPO_ROOT/plugins"
AGENTS_DIR="$REPO_ROOT/.agents"
SKILLS_DIR="$AGENTS_DIR/skills"
WORKFLOWS_DIR="$AGENTS_DIR/workflows"

DRY_RUN=false
CLEAN=false
PLUGINS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --clean)   CLEAN=true ;;
    --help|-h)
      echo "Usage: sync-agents.sh [--dry-run] [--clean] [plugin ...]"
      echo ""
      echo "Copies skills and commands from plugins/ into .agents/"
      echo ""
      echo "  --dry-run       Show what would be done without making changes"
      echo "  --clean         Remove .agents entries that have no matching plugin source"
      echo "  plugin ...      Only sync these plugins (default: all)"
      echo ""
      echo "Examples:"
      echo "  sync-agents.sh                              # sync all plugins"
      echo "  sync-agents.sh compound-engineering          # sync one plugin"
      echo "  sync-agents.sh work-toolkit writing-studio   # sync specific plugins"
      echo "  sync-agents.sh --dry-run compound-engineering"
      exit 0
      ;;
    -*) echo "Unknown option: $arg" >&2; exit 1 ;;
    *)  PLUGINS+=("$arg") ;;
  esac
done

# If no plugins specified, discover all
if [ ${#PLUGINS[@]} -eq 0 ]; then
  for d in "$PLUGINS_DIR"/*/; do
    PLUGINS+=("$(basename "$d")")
  done
fi

# Validate plugin names
for p in "${PLUGINS[@]}"; do
  if [ ! -d "$PLUGINS_DIR/$p" ]; then
    echo "Error: plugin '$p' not found in $PLUGINS_DIR" >&2
    exit 1
  fi
done

mkdir -p "$SKILLS_DIR" "$WORKFLOWS_DIR"

synced_skills=()
synced_workflows=()

for plugin_name in "${PLUGINS[@]}"; do
  # Sync skills: plugins/<plugin>/skills/<skill>/ -> .agents/skills/<plugin>-<skill>/
  for skill_dir in "$PLUGINS_DIR/$plugin_name"/skills/*/; do
    [ -d "$skill_dir" ] || continue

    skill_name="$(basename "$skill_dir")"
    target="$SKILLS_DIR/${plugin_name}-${skill_name}"

    synced_skills+=("${plugin_name}-${skill_name}")

    if "$DRY_RUN"; then
      echo "[dry-run] copy skill: ${plugin_name}-${skill_name}"
    else
      rm -rf "$target"
      cp -R "$skill_dir" "$target"
      echo "copied skill: ${plugin_name}-${skill_name}"
    fi
  done

  # Sync workflows: plugins/<plugin>/commands/<cmd>.md -> .agents/workflows/<plugin>-<cmd>.md
  for cmd_file in "$PLUGINS_DIR/$plugin_name"/commands/*.md; do
    [ -f "$cmd_file" ] || continue

    cmd_name="$(basename "$cmd_file")"
    target="$WORKFLOWS_DIR/${plugin_name}-${cmd_name}"

    synced_workflows+=("${plugin_name}-${cmd_name}")

    if "$DRY_RUN"; then
      echo "[dry-run] copy workflow: ${plugin_name}-${cmd_name}"
    else
      cp "$cmd_file" "$target"
      echo "copied workflow: ${plugin_name}-${cmd_name}"
    fi
  done
done

# Clean stale entries (only for synced plugins)
if "$CLEAN"; then
  for plugin_name in "${PLUGINS[@]}"; do
    # Clean skills belonging to this plugin
    for entry in "$SKILLS_DIR"/"${plugin_name}"-*/; do
      [ -d "$entry" ] || continue
      name="$(basename "$entry")"
      found=false
      for s in "${synced_skills[@]}"; do
        [ "$s" = "$name" ] && found=true && break
      done
      if ! "$found"; then
        if "$DRY_RUN"; then
          echo "[dry-run] would remove stale skill: $name"
        else
          rm -rf "$entry"
          echo "removed stale skill: $name"
        fi
      fi
    done

    # Clean workflows belonging to this plugin
    for entry in "$WORKFLOWS_DIR"/"${plugin_name}"-*.md; do
      [ -f "$entry" ] || continue
      name="$(basename "$entry")"
      found=false
      for w in "${synced_workflows[@]}"; do
        [ "$w" = "$name" ] && found=true && break
      done
      if ! "$found"; then
        if "$DRY_RUN"; then
          echo "[dry-run] would remove stale workflow: $name"
        else
          rm "$entry"
          echo "removed stale workflow: $name"
        fi
      fi
    done
  done
fi

echo ""
echo "Done. Synced ${#synced_skills[@]} skills and ${#synced_workflows[@]} workflows."
