#!/usr/bin/env python3
"""Codex wrappers for Claude-style compound-engineering command routing."""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


WORKFLOW_BY_COMMAND: Dict[str, str] = {
    "plan": "compound-engineering-plan.md",
    "work": "compound-engineering-work.md",
    "review": "compound-engineering-review.md",
    "discover": "compound-engineering-discover.md",
    "consolidate": "compound-engineering-consolidate.md",
    "explore-subsystem": "compound-engineering-explore-subsystem.md",
    "strategic-plan": "compound-engineering-strategic-plan.md",
    "harness": "compound-engineering-harness.md",
    "reason": "compound-engineering-reason.md",
    "chain": "compound-engineering-chain.md",
    "ship": "compound-engineering-ship.md",
    "linear-context": "compound-engineering-linear_context.md",
}

ALIASES: Dict[str, str] = {
    "explore_subsystem": "explore-subsystem",
    "strategic_plan": "strategic-plan",
    "linear_context": "linear-context",
}

RUNNER_REL = (
    Path(".agents")
    / "skills"
    / "compound-engineering-commands"
    / "scripts"
    / "compound_engineering_runner.py"
)


def eprint(message: str) -> None:
    print(message, file=sys.stderr)


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


def normalize_command(raw: str) -> str:
    command = raw.strip().lower()
    if command in WORKFLOW_BY_COMMAND:
        return command
    if command in ALIASES:
        return ALIASES[command]
    valid = ", ".join(sorted([*WORKFLOW_BY_COMMAND.keys(), *ALIASES.keys(), "list"]))
    eprint(f"ERROR: Unknown command '{raw}'. Valid values: {valid}")
    raise SystemExit(2)


def render_prompt(canonical_command: str, args_text: str, workflow_relpath: str) -> str:
    slash_cmd = f"/{canonical_command}"
    if args_text:
        slash_cmd = f"{slash_cmd} {args_text}"

    return "\n".join(
        [
            f"Execute the workflow in `{workflow_relpath}`.",
            f"Requested command: `{slash_cmd}`.",
            "Follow the workflow contract exactly and execute steps in this conversation.",
            "If required arguments are missing, ask concise clarifying questions as defined by the workflow.",
        ]
    )


def print_list() -> None:
    print("Available compound-engineering wrappers:\n")
    max_len = max(len(k) for k in WORKFLOW_BY_COMMAND)
    for command in sorted(WORKFLOW_BY_COMMAND):
        workflow = WORKFLOW_BY_COMMAND[command]
        print(f"  {command.ljust(max_len)} -> .agents/workflows/{workflow}")


def _tokens(args_text: str) -> List[str]:
    if not args_text.strip():
        return []
    return shlex.split(args_text)


def _first_non_flag(tokens: List[str]) -> Optional[str]:
    for token in tokens:
        if not token.startswith("-"):
            return token
    return None


def derive_runner_intent(canonical: str, args_text: str) -> Optional[Dict[str, Any]]:
    tokens = _tokens(args_text)

    if canonical == "chain":
        if not tokens:
            return {"action": "chain-status", "args": [], "source": "default_status"}

        head = tokens[0].lower()
        rest = tokens[1:]

        if head == "status":
            return {"action": "chain-status", "args": [], "source": "status"}

        if head == "stop":
            return {"action": "chain-stop", "args": [], "source": "stop"}

        if head in {"start", "init"}:
            intent_args: List[str] = []
            if "--force" in rest:
                intent_args.append("--force")
            return {"action": "chain-init", "args": intent_args, "source": head}

        if head == "advance":
            parser = argparse.ArgumentParser(add_help=False)
            parser.add_argument("--event")
            ns, unknown = parser.parse_known_args(rest)
            event = ns.event
            if not event:
                first = _first_non_flag(unknown)
                if first:
                    event = first
            if event:
                return {
                    "action": "chain-advance",
                    "args": ["--event", event],
                    "source": "advance",
                }

        return None

    if canonical == "harness":
        if not tokens:
            head = "start"
            rest = []
        elif tokens[0].startswith("-"):
            head = "start"
            rest = tokens
        else:
            head = tokens[0].lower()
            rest = tokens[1:]

        if head == "status":
            return {"action": "harness-status", "args": [], "source": "status"}

        if head == "stop":
            return {"action": "harness-stop", "args": [], "source": "stop"}

        if head in {"start", "init"}:
            parser = argparse.ArgumentParser(add_help=False)
            parser.add_argument("--project")
            parser.add_argument("--team", default="MB90")
            parser.add_argument("--label", default="ready")
            parser.add_argument("--max", dest="max_short", type=int, default=10)
            parser.add_argument("--max-iterations", dest="max_long", type=int)
            parser.add_argument("--discover-interval", type=int, default=5)
            parser.add_argument("--resume", action="store_true")
            parser.add_argument("--force", action="store_true")

            ns, _ = parser.parse_known_args(rest)
            max_iterations = ns.max_long if ns.max_long is not None else ns.max_short

            intent_args: List[str] = [
                "--team",
                ns.team,
                "--label",
                ns.label,
                "--max-iterations",
                str(max_iterations),
                "--discover-interval",
                str(ns.discover_interval),
            ]
            if ns.project:
                intent_args.extend(["--project", ns.project])
            if ns.resume:
                intent_args.append("--resume")
            if ns.force:
                intent_args.append("--force")

            return {
                "action": "harness-init",
                "args": intent_args,
                "source": head,
            }

        if head == "claim":
            parser = argparse.ArgumentParser(add_help=False)
            parser.add_argument("--issue-id")
            ns, unknown = parser.parse_known_args(rest)
            issue = ns.issue_id or _first_non_flag(unknown)
            if issue:
                return {
                    "action": "harness-claim",
                    "args": ["--issue-id", issue],
                    "source": "claim",
                }
            return None

        if head == "record":
            parser = argparse.ArgumentParser(add_help=False)
            parser.add_argument("--event")
            parser.add_argument("--issue-id")
            parser.add_argument("--friction", action="append", default=[])
            ns, unknown = parser.parse_known_args(rest)

            event = ns.event or _first_non_flag(unknown)
            if not event:
                return None

            intent_args = ["--event", event]
            if ns.issue_id:
                intent_args.extend(["--issue-id", ns.issue_id])
            for friction in ns.friction:
                intent_args.extend(["--friction", friction])

            return {
                "action": "harness-record",
                "args": intent_args,
                "source": "record",
            }

        return None

    return None


def execute_runner(repo_root: Path, intent: Dict[str, Any]) -> Dict[str, Any]:
    runner = repo_root / RUNNER_REL
    if not runner.exists():
        return {
            "applied": False,
            "ok": False,
            "error": f"runner_not_found: {runner}",
        }

    cmd = [
        sys.executable,
        str(runner),
        str(intent["action"]),
        "--json",
        *[str(x) for x in intent.get("args", [])],
    ]

    proc = subprocess.run(
        cmd,
        cwd=str(repo_root),
        text=True,
        capture_output=True,
        check=False,
    )

    parsed: Optional[Dict[str, Any]] = None
    raw_stdout = proc.stdout.strip()
    if raw_stdout:
        try:
            maybe = json.loads(raw_stdout)
            if isinstance(maybe, dict):
                parsed = maybe
        except Exception:
            parsed = None

    return {
        "applied": True,
        "ok": proc.returncode == 0,
        "intent": intent,
        "command": cmd,
        "returncode": proc.returncode,
        "parsed": parsed,
        "stdout": raw_stdout,
        "stderr": proc.stderr.strip(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Codex wrappers for compound-engineering command parity"
    )
    parser.add_argument(
        "command",
        help="Command to route (or 'list')",
    )
    parser.add_argument(
        "--args",
        default="",
        help="Raw argument string to append to the command",
    )
    parser.add_argument(
        "--repo-root",
        help="Path to the mberto-compound repository root",
    )
    parser.add_argument(
        "--print-workflow",
        action="store_true",
        help="Print the full workflow markdown after the wrapper output",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON output",
    )
    parser.add_argument(
        "--out",
        help="Optional output file path for the generated invocation prompt",
    )
    parser.add_argument(
        "--state-mode",
        choices=["auto", "off", "only"],
        default="auto",
        help="Runner execution mode for /chain and /harness (default: auto)",
    )

    args = parser.parse_args()

    if args.command == "list":
        print_list()
        return 0

    canonical = normalize_command(args.command)
    repo_root = find_repo_root(args.repo_root)

    workflow_rel = Path(".agents") / "workflows" / WORKFLOW_BY_COMMAND[canonical]
    workflow_path = repo_root / workflow_rel
    if not workflow_path.exists():
        eprint(f"ERROR: Workflow file not found: {workflow_path}")
        return 2

    prompt = render_prompt(canonical, args.args.strip(), str(workflow_rel))

    payload: Dict[str, Any] = {
        "command": canonical,
        "args": args.args,
        "repo_root": str(repo_root),
        "workflow": str(workflow_path),
        "workflow_rel": str(workflow_rel),
        "invocation_prompt": prompt,
        "state_mode": args.state_mode,
    }

    runner_result: Optional[Dict[str, Any]] = None
    if canonical in {"chain", "harness"} and args.state_mode != "off":
        intent = derive_runner_intent(canonical, args.args)
        if intent is not None:
            runner_result = execute_runner(repo_root, intent)
            payload["state_runner"] = runner_result
        else:
            payload["state_runner"] = {
                "applied": False,
                "ok": True,
                "reason": "no_intent_derived_from_args",
            }

    if args.out:
        out_path = Path(args.out).expanduser()
        if not out_path.is_absolute():
            out_path = repo_root / out_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(prompt + "\n", encoding="utf-8")
        payload["out"] = str(out_path)

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"Command: /{canonical}")
        print(f"Workflow: {workflow_path}")
        if args.args.strip():
            print(f"Arguments: {args.args.strip()}")
        else:
            print("Arguments: (none)")

        if "state_runner" in payload:
            sr = payload["state_runner"]
            print("\nState Runner:")
            if sr.get("applied"):
                intent = sr.get("intent", {})
                print(f"- Action: {intent.get('action')}")
                print(f"- Ok: {sr.get('ok')}")
                parsed = sr.get("parsed")
                if isinstance(parsed, dict):
                    if "message" in parsed:
                        print(f"- Message: {parsed.get('message')}")
                    if "next_action" in parsed and parsed.get("next_action"):
                        print(f"- Next Action: {parsed.get('next_action')}")
                    if "stop_reason" in parsed and parsed.get("stop_reason"):
                        print(f"- Stop Reason: {parsed.get('stop_reason')}")
                if sr.get("stderr"):
                    print(f"- stderr: {sr.get('stderr')}")
            else:
                print(f"- {sr.get('reason', 'not_applied')}")

        if args.state_mode != "only":
            print("\nPrompt:")
            print(prompt)

            if args.out:
                print(f"\nWrote prompt file: {payload['out']}")

    if args.print_workflow and args.state_mode != "only":
        print("\n--- WORKFLOW MARKDOWN ---\n")
        print(workflow_path.read_text(encoding="utf-8"))

    if runner_result and runner_result.get("applied") and not runner_result.get("ok"):
        return int(runner_result.get("returncode") or 1)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
