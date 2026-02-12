#!/bin/bash
# Runtime configuration for continuous-compound markdown-only hooks.

set -e

if [ "${CC_RUNTIME_CONFIG_LOADED:-0}" = "1" ]; then
  return 0
fi

cc_detect_workspace_root() {
  if [ -n "${CONTINUOUS_COMPOUND_WORKSPACE_DIR:-}" ]; then
    echo "$CONTINUOUS_COMPOUND_WORKSPACE_DIR"
    return 0
  fi

  if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "$git_root"
    return 0
  fi

  echo "${PWD:-.}"
}

cc_collect_deprecated_env_warnings() {
  local warnings=""

  if [ -n "${CONTINUOUS_COMPOUND_BACKEND:-}" ]; then
    warnings+="CONTINUOUS_COMPOUND_BACKEND is ignored; runtime is markdown-only.\n"
  fi
  if [ -n "${CONTINUOUS_COMPOUND_TEAM_KEY:-}" ]; then
    warnings+="CONTINUOUS_COMPOUND_TEAM_KEY is ignored; Linear runtime was removed.\n"
  fi
  if [ -n "${CONTINUOUS_COMPOUND_LINEAR_API_URL:-}" ]; then
    warnings+="CONTINUOUS_COMPOUND_LINEAR_API_URL is ignored; Linear runtime was removed.\n"
  fi
  if [ -n "${LINEAR_API_KEY:-}" ]; then
    warnings+="LINEAR_API_KEY is ignored by this plugin; runtime is markdown-only.\n"
  fi

  printf "%b" "$warnings"
}

CC_PROGRAM_NAME="${CONTINUOUS_COMPOUND_PROGRAM:-_autonomous}"
CC_WORKSPACE_ROOT="$(cc_detect_workspace_root)"
CC_PROGRAM_DIR="${CONTINUOUS_COMPOUND_PROGRAM_DIR:-$CC_WORKSPACE_ROOT/programs/$CC_PROGRAM_NAME}"
CC_DEPRECATED_ENV_WARNINGS="$(cc_collect_deprecated_env_warnings)"

export CC_PROGRAM_NAME
export CC_WORKSPACE_ROOT
export CC_PROGRAM_DIR
export CC_DEPRECATED_ENV_WARNINGS
export CC_RUNTIME_CONFIG_LOADED=1
