#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat << USAGE
Usage: $0 --program <name> [--workspace <path>] [--force]
USAGE
}

PROGRAM=""
WORKSPACE="$(pwd)"
FORCE="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --program)
      PROGRAM="${2:-}"
      shift 2
      ;;
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --force)
      FORCE="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROGRAM" ]]; then
  echo "--program is required" >&2
  usage
  exit 1
fi

PROGRAM_DIR="$WORKSPACE/programs/$PROGRAM"

if [[ -d "$PROGRAM_DIR" && "$FORCE" != "1" ]]; then
  echo "Program directory already exists: $PROGRAM_DIR" >&2
  echo "Use --force to overwrite templates." >&2
  exit 1
fi

mkdir -p "$PROGRAM_DIR/handoffs" "$PROGRAM_DIR/evidence"

cat > "$PROGRAM_DIR/contract.md" << CONTRACT
---
program_id: $PROGRAM
name: $PROGRAM
---

# Program Contract

## Purpose

## Goal

## Success Criteria
- 

## Scope
### In
- 

### Out
- 

## Constraints
- 

## Verification
- 
CONTRACT

cat > "$PROGRAM_DIR/tasks.md" << 'TASKS'
# Tasks

## Milestone 1
- [>] Define first implementation slice
- [ ] Execute first implementation slice
- [ ] Verify first implementation slice
TASKS

cat > "$PROGRAM_DIR/status.md" << 'STATUS'
# Program Status
Current: Define first implementation slice
Next: Execute first implementation slice
Blocked: none
STATUS

cat > "$PROGRAM_DIR/risks.md" << 'RISKS'
# Risks

- 
RISKS

cat > "$PROGRAM_DIR/decision-log.md" << 'DECISIONS'
# Decision Log

- 
DECISIONS

echo "Scaffolded markdown program at: $PROGRAM_DIR"
