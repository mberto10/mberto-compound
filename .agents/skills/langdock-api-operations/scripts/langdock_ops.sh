#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  langdock_ops.sh <domain> <operation> [args...]

Domains:
  agent      create|get|update|chat|models|upload
  knowledge  upload|update|list|delete|search
  export     users|agents|workflows|projects|models

Environment:
  LANGDOCK_API_KEY      Required
  LANGDOCK_PLUGIN_ROOT  Optional override; default fallback:
                        /Users/max/mberto-compound/plugins/langdock-dev
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }
[[ $# -lt 2 ]] && { usage; exit 2; }

DOMAIN="$1"
OPERATION="$2"
shift 2

[[ -n "${LANGDOCK_API_KEY:-}" ]] || die "LANGDOCK_API_KEY is required."

require_cmd python3
python3 -c "import requests" >/dev/null 2>&1 || die "Python package 'requests' is required. Install with: pip install requests"

PLUGIN_ROOT="${LANGDOCK_PLUGIN_ROOT:-/Users/max/mberto-compound/plugins/langdock-dev}"
[[ -d "$PLUGIN_ROOT" ]] || die "Langdock plugin root not found: $PLUGIN_ROOT"

case "$DOMAIN" in
  agent)
    TOOL="$PLUGIN_ROOT/tools/langdock_agent.py"
    case "$OPERATION" in
      create|get|update|chat|models|upload) ;;
      *) die "Unsupported agent operation: $OPERATION" ;;
    esac
    ;;
  knowledge)
    TOOL="$PLUGIN_ROOT/tools/langdock_knowledge.py"
    case "$OPERATION" in
      upload|update|list|delete|search) ;;
      *) die "Unsupported knowledge operation: $OPERATION" ;;
    esac
    ;;
  export)
    TOOL="$PLUGIN_ROOT/tools/langdock_export.py"
    case "$OPERATION" in
      users|agents|workflows|projects|models) ;;
      *) die "Unsupported export operation: $OPERATION" ;;
    esac
    ;;
  *)
    die "Unsupported domain: $DOMAIN"
    ;;
esac

[[ -f "$TOOL" ]] || die "Tool file not found: $TOOL"

exec python3 "$TOOL" "$OPERATION" "$@"
