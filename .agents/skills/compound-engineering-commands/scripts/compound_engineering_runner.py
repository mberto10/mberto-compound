#!/usr/bin/env python3
"""Hookless chain/harness state runner for compound-engineering workflows in Codex."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_STATE_DIR = Path("compound-state") / "compound-engineering"
CHAIN_STATE_FILE = "work-chain-state.local.json"
HARNESS_STATE_FILE = "harness-state.local.json"


def eprint(message: str) -> None:
    print(message, file=sys.stderr)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def has_required_layout(path: Path) -> bool:
    return (path / ".agents" / "workflows" / "compound-engineering-plan.md").exists()


def find_repo_root(explicit_root: Optional[str]) -> Path:
    candidates: List[Path] = []

    if explicit_root:
        candidates.append(Path(explicit_root).expanduser().resolve())

    env_root = os.getenv("MBERTO_COMPOUND_ROOT")
    if env_root:
        candidates.append(Path(env_root).expanduser().resolve())

    candidates.append(Path.cwd().resolve())
    candidates.append(Path(__file__).resolve().parent)

    seen: set[Path] = set()
    for candidate in candidates:
        for probe in [candidate, *candidate.parents]:
            if probe in seen:
                continue
            seen.add(probe)
            if has_required_layout(probe):
                return probe

    eprint(
        "ERROR: Could not resolve repo root. Pass --repo-root or set MBERTO_COMPOUND_ROOT."
    )
    raise SystemExit(2)


def state_path(repo_root: Path, default_name: str, explicit: Optional[str]) -> Path:
    if explicit:
        p = Path(explicit).expanduser()
        if not p.is_absolute():
            p = repo_root / p
        return p
    return repo_root / DEFAULT_STATE_DIR / default_name


def load_json(path: Path, default: Dict[str, Any]) -> Dict[str, Any]:
    if not path.exists():
        return default
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            return raw
    except Exception as exc:
        raise ValueError(f"Failed to parse state file {path}: {exc}")
    raise ValueError(f"State file root must be an object: {path}")


def save_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def print_payload(payload: Dict[str, Any], as_json: bool) -> None:
    if as_json:
        print(json.dumps(payload, indent=2))
        return

    # Compact human-readable format
    for key in [
        "ok",
        "operation",
        "state_path",
        "message",
        "next_action",
        "should_continue",
        "stop_reason",
    ]:
        if key in payload and payload[key] is not None:
            print(f"{key}: {payload[key]}")

    state = payload.get("state")
    if isinstance(state, dict):
        fields = ["active", "stage", "iteration", "max_iterations", "consecutive_failures"]
        available = {k: state.get(k) for k in fields if k in state}
        if available:
            print(f"state: {available}")


def default_chain_state() -> Dict[str, Any]:
    ts = now_iso()
    return {
        "active": True,
        "stage": "idle",
        "created_at": ts,
        "updated_at": ts,
        "history": [
            {
                "event": "init",
                "from": None,
                "to": "idle",
                "at": ts,
            }
        ],
    }


def add_chain_history(state: Dict[str, Any], event: str, prev: Optional[str], new: str, details: Optional[Dict[str, Any]] = None) -> None:
    history = state.setdefault("history", [])
    if not isinstance(history, list):
        history = []
        state["history"] = history
    item: Dict[str, Any] = {"event": event, "from": prev, "to": new, "at": now_iso()}
    if details:
        item["details"] = details
    history.append(item)


def chain_transition(state: Dict[str, Any], event: str) -> Tuple[str, Optional[str], str]:
    stage = str(state.get("stage", "idle"))
    active = bool(state.get("active", False))

    if not active:
        return stage, None, "chain_inactive"

    if stage == "idle" and event == "work_complete":
        return "pending_review", "/review", "work_complete_triggered_review"

    if stage == "pending_review" and event == "review_pass":
        return "pending_discover", "/discover", "review_pass_triggered_discover"

    if stage == "pending_review" and event == "review_fail":
        state["active"] = False
        return "done", None, "review_failed_chain_stopped"

    if stage == "pending_discover" and event == "discovery_complete":
        state["active"] = False
        return "done", None, "discovery_complete_chain_finished"

    return stage, None, "event_ignored_for_stage"


def run_chain_init(repo_root: Path, state_file: Path, force: bool, as_json: bool) -> int:
    if state_file.exists() and not force:
        state = load_json(state_file, default_chain_state())
        payload = {
            "ok": True,
            "operation": "chain-init",
            "state_path": str(state_file),
            "message": "state_exists",
            "state": state,
        }
        print_payload(payload, as_json)
        return 0

    state = default_chain_state()
    save_json(state_file, state)
    payload = {
        "ok": True,
        "operation": "chain-init",
        "state_path": str(state_file),
        "message": "initialized",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_chain_status(state_file: Path, as_json: bool) -> int:
    if not state_file.exists():
        payload = {
            "ok": True,
            "operation": "chain-status",
            "state_path": str(state_file),
            "message": "no_state_file",
            "state": None,
        }
        print_payload(payload, as_json)
        return 0

    state = load_json(state_file, default_chain_state())
    payload = {
        "ok": True,
        "operation": "chain-status",
        "state_path": str(state_file),
        "message": "ok",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_chain_stop(state_file: Path, as_json: bool) -> int:
    if not state_file.exists():
        payload = {
            "ok": True,
            "operation": "chain-stop",
            "state_path": str(state_file),
            "message": "no_state_file",
            "state": None,
        }
        print_payload(payload, as_json)
        return 0

    state = load_json(state_file, default_chain_state())
    prev = state.get("stage")
    state["active"] = False
    state["updated_at"] = now_iso()
    add_chain_history(state, "stop", str(prev) if prev is not None else None, str(state.get("stage", "idle")))
    save_json(state_file, state)
    payload = {
        "ok": True,
        "operation": "chain-stop",
        "state_path": str(state_file),
        "message": "stopped",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_chain_advance(state_file: Path, event: str, as_json: bool) -> int:
    if not state_file.exists():
        payload = {
            "ok": True,
            "operation": "chain-advance",
            "state_path": str(state_file),
            "message": "no_state_file",
            "next_action": None,
            "state": None,
        }
        print_payload(payload, as_json)
        return 0

    state = load_json(state_file, default_chain_state())
    prev = str(state.get("stage", "idle"))
    new_stage, next_action, transition = chain_transition(state, event)
    state["stage"] = new_stage
    state["updated_at"] = now_iso()
    add_chain_history(state, event, prev, new_stage, {"transition": transition, "next_action": next_action})
    save_json(state_file, state)

    payload = {
        "ok": True,
        "operation": "chain-advance",
        "state_path": str(state_file),
        "message": transition,
        "next_action": next_action,
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def default_harness_state(project: Optional[str], team: str, label: str, max_iterations: int, discover_interval: int) -> Dict[str, Any]:
    ts = now_iso()
    return {
        "active": True,
        "iteration": 1,
        "max_iterations": max_iterations,
        "consecutive_failures": 0,
        "discover_interval": discover_interval,
        "linear_project": project or "",
        "linear_team": team,
        "linear_filter_labels": [label],
        "linear_done_status": "Done",
        "linear_in_progress_status": "In Progress",
        "completed_issues": [],
        "failed_issues": [],
        "skipped_issues": [],
        "friction_log": [],
        "current_issue": None,
        "created_at": ts,
        "updated_at": ts,
    }


def append_unique(items: List[Any], value: Any) -> List[Any]:
    if value is None:
        return items
    if value not in items:
        items.append(value)
    return items


def run_harness_init(
    state_file: Path,
    project: Optional[str],
    team: str,
    label: str,
    max_iterations: int,
    discover_interval: int,
    force: bool,
    resume: bool,
    as_json: bool,
) -> int:
    if state_file.exists() and not force:
        state = load_json(
            state_file,
            default_harness_state(project, team, label, max_iterations, discover_interval),
        )
        if resume:
            state["active"] = True
            state["updated_at"] = now_iso()
            save_json(state_file, state)
            message = "resumed_existing_state"
        else:
            message = "state_exists"

        payload = {
            "ok": True,
            "operation": "harness-init",
            "state_path": str(state_file),
            "message": message,
            "state": state,
        }
        print_payload(payload, as_json)
        return 0

    state = default_harness_state(project, team, label, max_iterations, discover_interval)
    save_json(state_file, state)
    payload = {
        "ok": True,
        "operation": "harness-init",
        "state_path": str(state_file),
        "message": "initialized",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_harness_status(state_file: Path, as_json: bool) -> int:
    if not state_file.exists():
        payload = {
            "ok": True,
            "operation": "harness-status",
            "state_path": str(state_file),
            "message": "no_state_file",
            "state": None,
        }
        print_payload(payload, as_json)
        return 0

    state = load_json(state_file, default_harness_state(None, "MB90", "ready", 10, 5))
    payload = {
        "ok": True,
        "operation": "harness-status",
        "state_path": str(state_file),
        "message": "ok",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_harness_stop(state_file: Path, as_json: bool) -> int:
    if not state_file.exists():
        payload = {
            "ok": True,
            "operation": "harness-stop",
            "state_path": str(state_file),
            "message": "no_state_file",
            "state": None,
        }
        print_payload(payload, as_json)
        return 0

    state = load_json(state_file, default_harness_state(None, "MB90", "ready", 10, 5))
    state["active"] = False
    state["updated_at"] = now_iso()
    save_json(state_file, state)
    payload = {
        "ok": True,
        "operation": "harness-stop",
        "state_path": str(state_file),
        "message": "stopped",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_harness_claim(state_file: Path, issue_id: str, as_json: bool) -> int:
    state = load_json(state_file, default_harness_state(None, "MB90", "ready", 10, 5))
    state["current_issue"] = issue_id
    state["updated_at"] = now_iso()
    save_json(state_file, state)
    payload = {
        "ok": True,
        "operation": "harness-claim",
        "state_path": str(state_file),
        "message": "claimed",
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def run_harness_record(
    state_file: Path,
    event: str,
    issue_id: Optional[str],
    friction: List[str],
    as_json: bool,
) -> int:
    state = load_json(state_file, default_harness_state(None, "MB90", "ready", 10, 5))

    completed = state.setdefault("completed_issues", [])
    failed = state.setdefault("failed_issues", [])
    skipped = state.setdefault("skipped_issues", [])
    friction_log = state.setdefault("friction_log", [])

    if not isinstance(completed, list):
        completed = []
        state["completed_issues"] = completed
    if not isinstance(failed, list):
        failed = []
        state["failed_issues"] = failed
    if not isinstance(skipped, list):
        skipped = []
        state["skipped_issues"] = skipped
    if not isinstance(friction_log, list):
        friction_log = []
        state["friction_log"] = friction_log

    if event == "issue_complete":
        append_unique(completed, issue_id)
        state["consecutive_failures"] = 0
        state["iteration"] = int(state.get("iteration", 1)) + 1
        state["current_issue"] = None

    elif event == "issue_failed":
        append_unique(failed, issue_id)
        state["consecutive_failures"] = int(state.get("consecutive_failures", 0)) + 1
        state["iteration"] = int(state.get("iteration", 1)) + 1
        state["current_issue"] = None

    elif event == "issue_skipped":
        append_unique(skipped, issue_id)
        state["consecutive_failures"] = 0
        state["iteration"] = int(state.get("iteration", 1)) + 1
        state["current_issue"] = None

    elif event in {"harness_done", "harness_pause", "harness_stop"}:
        state["active"] = False

    if friction:
        friction_log.append(
            {
                "issue": issue_id,
                "iteration": state.get("iteration"),
                "points": friction,
                "at": now_iso(),
            }
        )

    stop_reason = None
    if int(state.get("max_iterations", 0)) > 0 and int(state.get("iteration", 1)) > int(state.get("max_iterations", 0)):
        state["active"] = False
        stop_reason = "max_iterations_reached"

    if int(state.get("consecutive_failures", 0)) >= 3:
        state["active"] = False
        stop_reason = "consecutive_failures_limit"

    if event == "harness_done":
        stop_reason = "queue_empty"
    elif event == "harness_pause":
        stop_reason = "paused_for_context"
    elif event == "harness_stop":
        stop_reason = "manual_stop"

    completed_count = len(completed)
    discover_interval = int(state.get("discover_interval", 0) or 0)
    should_discover = (
        event == "issue_complete"
        and discover_interval > 0
        and completed_count > 0
        and completed_count % discover_interval == 0
    )

    state["updated_at"] = now_iso()
    save_json(state_file, state)

    should_continue = bool(state.get("active", False)) and event in {
        "issue_complete",
        "issue_failed",
        "issue_skipped",
    }
    payload = {
        "ok": True,
        "operation": "harness-record",
        "state_path": str(state_file),
        "message": "recorded",
        "should_continue": should_continue,
        "should_discover": should_discover,
        "completed_count": completed_count,
        "stop_reason": stop_reason,
        "state": state,
    }
    print_payload(payload, as_json)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Hookless chain/harness state runner for compound-engineering workflows"
    )
    parser.add_argument("action")
    parser.add_argument("--repo-root", help="Path to the mberto-compound repository root")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    parser.add_argument("--state-file", help="Optional explicit state file path")

    # Chain options
    parser.add_argument("--event", help="Event for chain-advance or harness-record")

    # Harness init options
    parser.add_argument("--project", help="Linear project id/name for harness init")
    parser.add_argument("--team", default="MB90", help="Linear team id/name")
    parser.add_argument("--label", default="ready", help="Linear ready label")
    parser.add_argument("--max-iterations", type=int, default=10, help="Maximum harness iterations")
    parser.add_argument("--discover-interval", type=int, default=5, help="Discovery trigger interval")
    parser.add_argument("--force", action="store_true", help="Overwrite existing state during init")
    parser.add_argument("--resume", action="store_true", help="Resume existing harness state by setting active=true")

    # Harness record/claim options
    parser.add_argument("--issue-id", help="Issue id for harness claim/record")
    parser.add_argument("--friction", action="append", default=[], help="Friction note to append (repeatable)")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    repo_root = find_repo_root(args.repo_root)

    action = args.action.strip().lower()

    chain_state = state_path(repo_root, CHAIN_STATE_FILE, args.state_file if action.startswith("chain-") else None)
    harness_state = state_path(repo_root, HARNESS_STATE_FILE, args.state_file if action.startswith("harness-") else None)

    if action == "chain-init":
        return run_chain_init(repo_root, chain_state, args.force, args.json)

    if action == "chain-status":
        return run_chain_status(chain_state, args.json)

    if action == "chain-stop":
        return run_chain_stop(chain_state, args.json)

    if action == "chain-advance":
        if not args.event:
            eprint("ERROR: --event is required for chain-advance")
            return 2
        allowed = {"work_complete", "review_pass", "review_fail", "discovery_complete"}
        if args.event not in allowed:
            eprint(f"ERROR: invalid chain event '{args.event}'. Allowed: {sorted(allowed)}")
            return 2
        return run_chain_advance(chain_state, args.event, args.json)

    if action == "harness-init":
        return run_harness_init(
            harness_state,
            args.project,
            args.team,
            args.label,
            args.max_iterations,
            args.discover_interval,
            args.force,
            args.resume,
            args.json,
        )

    if action == "harness-status":
        return run_harness_status(harness_state, args.json)

    if action == "harness-stop":
        return run_harness_stop(harness_state, args.json)

    if action == "harness-claim":
        if not args.issue_id:
            eprint("ERROR: --issue-id is required for harness-claim")
            return 2
        return run_harness_claim(harness_state, args.issue_id, args.json)

    if action == "harness-record":
        if not args.event:
            eprint("ERROR: --event is required for harness-record")
            return 2
        allowed = {
            "issue_complete",
            "issue_failed",
            "issue_skipped",
            "harness_done",
            "harness_pause",
            "harness_stop",
        }
        if args.event not in allowed:
            eprint(f"ERROR: invalid harness event '{args.event}'. Allowed: {sorted(allowed)}")
            return 2
        return run_harness_record(harness_state, args.event, args.issue_id, args.friction, args.json)

    if action == "list":
        payload = {
            "ok": True,
            "operation": "list",
            "commands": [
                "chain-init",
                "chain-status",
                "chain-stop",
                "chain-advance",
                "harness-init",
                "harness-status",
                "harness-stop",
                "harness-claim",
                "harness-record",
            ],
            "default_chain_state": str(repo_root / DEFAULT_STATE_DIR / CHAIN_STATE_FILE),
            "default_harness_state": str(repo_root / DEFAULT_STATE_DIR / HARNESS_STATE_FILE),
        }
        print_payload(payload, args.json)
        return 0

    eprint(f"ERROR: unknown action '{action}'")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
