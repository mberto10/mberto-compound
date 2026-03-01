#!/usr/bin/env bash
set -euo pipefail

PROGRAM=""
WORKSPACE="$(pwd)"
NOTE=""
NOTE_FILE=""

usage() {
  cat << USAGE
Usage: $0 --program <name> [--workspace <path>] [--note <text>] [--note-file <path>]
USAGE
}

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
    --note)
      NOTE="${2:-}"
      shift 2
      ;;
    --note-file)
      NOTE_FILE="${2:-}"
      shift 2
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
STATUS="$PROGRAM_DIR/status.md"
HANDOFF_DIR="$PROGRAM_DIR/handoffs"

[[ -d "$PROGRAM_DIR" ]] || { echo "Missing program directory: $PROGRAM_DIR" >&2; exit 1; }
[[ -f "$STATUS" ]] || { echo "Missing status file: $STATUS" >&2; exit 1; }

if [[ -n "$NOTE_FILE" ]]; then
  [[ -f "$NOTE_FILE" ]] || { echo "Missing note file: $NOTE_FILE" >&2; exit 1; }
  NOTE="$(cat "$NOTE_FILE")"
fi

CURRENT=$(grep -E '^[[:space:]]*Current:[[:space:]]*' "$STATUS" | head -1 | sed -E 's/^[[:space:]]*Current:[[:space:]]*//')
NEXT=$(grep -E '^[[:space:]]*Next:[[:space:]]*' "$STATUS" | head -1 | sed -E 's/^[[:space:]]*Next:[[:space:]]*//')
BLOCKED=$(grep -E '^[[:space:]]*Blocked:[[:space:]]*' "$STATUS" | head -1 | sed -E 's/^[[:space:]]*Blocked:[[:space:]]*//')

mkdir -p "$HANDOFF_DIR"
STAMP_FILE="$(date +"%Y-%m-%d-%H%M%S")"
STAMP_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
HANDOFF="$HANDOFF_DIR/handoff-$STAMP_FILE.md"

cat > "$HANDOFF" << HANDOFF_MD
# Auto-Handoff

Generated: $STAMP_UTC
Program: $PROGRAM

## Resume From Here
1. Current: ${CURRENT:-unknown}
2. Next: ${NEXT:-unknown}
3. Blocked: ${BLOCKED:-none}

## Notes
${NOTE:-No additional notes provided.}
HANDOFF_MD

cat >> "$STATUS" << STATUS_APPEND

---
Last Handoff: $STAMP_UTC
Handoff File: $HANDOFF
STATUS_APPEND

echo "Wrote handoff: $HANDOFF"
