#!/usr/bin/env python3
"""
Codex wrappers for Claude-style optimization commands.

This script bridges the command surface to existing plugin helper scripts so the
same workflows can run in Codex without Claude-specific command routing.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def eprint(message: str) -> None:
    print(message, file=sys.stderr)


def load_yaml_module():
    try:
        import yaml  # type: ignore
    except ImportError:
        eprint("ERROR: PyYAML is required. Install with: pip install pyyaml")
        raise SystemExit(1)
    return yaml


def find_repo_root(explicit_root: Optional[str]) -> Path:
    """Resolve mberto-compound repo root containing both plugin directories."""

    def has_required_dirs(path: Path) -> bool:
        return (
            (path / ".agents" / "skills" / "langfuse-analyzer-commands").exists()
            and (path / ".agents" / "skills" / "agentic-optimization-commands").exists()
        )

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
            if has_required_dirs(probe):
                return probe

    eprint(
        "ERROR: Could not resolve repo root. Pass --repo-root or set MBERTO_COMPOUND_ROOT."
    )
    raise SystemExit(2)


def get_helper_paths(repo_root: Path) -> Dict[str, Path]:
    paths = {
        "eval_infra": repo_root
        / "plugins"
        / "langfuse-analyzer"
        / "skills"
        / "eval-infrastructure"
        / "helpers"
        / "eval_infra_manager.py",
        "contract_resolver": repo_root
        / "plugins"
        / "agentic-optimization-loop"
        / "skills"
        / "optimization-controller"
        / "helpers"
        / "contract_resolver.py",
        "loop_template": repo_root
        / "plugins"
        / "agentic-optimization-loop"
        / "skills"
        / "optimization-controller"
        / "references"
        / "loop-prompt-template.md",
    }

    missing = [name for name, path in paths.items() if not path.exists()]
    if missing:
        for name in missing:
            eprint(f"ERROR: Missing helper file '{name}': {paths[name]}")
        raise SystemExit(2)

    return paths


def run_python_script(
    script: Path,
    script_args: List[str],
    cwd: Path,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    cmd = [sys.executable, str(script), *script_args]
    return subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        capture_output=capture,
        check=False,
    )


def normalize_dataset(agent: str, dataset: Optional[str]) -> str:
    return dataset if dataset else f"{agent}-eval"


def resolve_lever_settings(
    lever_mode: str,
    max_levers: Optional[int],
) -> Tuple[str, int]:
    if lever_mode == "single":
        return "single", 1

    resolved = 3 if max_levers is None else max_levers
    if resolved < 1 or resolved > 5:
        eprint("ERROR: --max-levers must be between 1 and 5")
        raise SystemExit(2)
    return "multi", resolved


def parse_dimensions_json(dimensions_json: Optional[str], dimensions_file: Optional[str]) -> Optional[str]:
    if not dimensions_json and not dimensions_file:
        return None

    raw = dimensions_json
    if dimensions_file:
        raw = Path(dimensions_file).expanduser().read_text(encoding="utf-8")

    assert raw is not None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        eprint(f"ERROR: invalid dimensions JSON: {exc}")
        raise SystemExit(2)

    if not isinstance(parsed, list) or not parsed:
        eprint("ERROR: dimensions must be a non-empty JSON list")
        raise SystemExit(2)

    return json.dumps(parsed)


def load_journal(path: Path) -> Dict[str, Any]:
    yaml = load_yaml_module()
    if not path.exists():
        raise FileNotFoundError(path)

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValueError(f"Journal root must be an object: {path}")
    return raw


def save_journal(path: Path, data: Dict[str, Any]) -> None:
    yaml = load_yaml_module()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")


def ensure_journal_defaults(journal: Dict[str, Any], agent: str, lever_mode: str, max_levers: int) -> Dict[str, Any]:
    journal.setdefault("meta", {})
    meta = journal["meta"]
    if isinstance(meta, dict):
        meta.setdefault("agent_name", agent)
        meta.setdefault("started", str(date.today()))
        meta.setdefault("target", {})
        meta.setdefault("levers", {})
        meta.setdefault("constraints", [])

    journal.setdefault("current_phase", "init")
    journal.setdefault("current_iteration", 0)
    journal.setdefault("iterations", [])

    loop = journal.setdefault("loop", {})
    if isinstance(loop, dict):
        loop["lever_mode"] = lever_mode
        loop["max_levers"] = max_levers

    learnings = journal.setdefault("learnings", {})
    if isinstance(learnings, dict):
        learnings.setdefault("what_works", [])
        learnings.setdefault("what_fails", [])
        learnings.setdefault("patterns_discovered", [])

    return journal


def get_phase_next(phase: str) -> str:
    mapping = {
        "init": "hypothesize",
        "hypothesize": "experiment",
        "experiment": "analyze",
        "analyze": "compound",
        "compound": "hypothesize",
        "graduated": "graduated",
    }
    return mapping.get(phase, "hypothesize")


def extract_current_lever_set_size(journal: Dict[str, Any]) -> str:
    current_iteration = journal.get("current_iteration")
    iterations = journal.get("iterations") or []
    if not isinstance(iterations, list):
        return "-"

    for iteration in reversed(iterations):
        if not isinstance(iteration, dict):
            continue
        if current_iteration is not None and iteration.get("id") != current_iteration:
            continue

        if iteration.get("lever_set_size") is not None:
            return str(iteration["lever_set_size"])

        change = iteration.get("change")
        if isinstance(change, dict) and change.get("lever_set_size") is not None:
            return str(change["lever_set_size"])

        lever_set = iteration.get("lever_set")
        if isinstance(lever_set, list):
            return str(len(lever_set))

        if isinstance(change, dict) and isinstance(change.get("lever_set"), list):
            return str(len(change["lever_set"]))

        return "-"

    return "-"


def format_status_block(agent: str, journal: Dict[str, Any]) -> str:
    phase = str(journal.get("current_phase", "init"))
    iteration = journal.get("current_iteration", 0)
    loop = journal.get("loop") or {}
    lever_mode = loop.get("lever_mode", "single") if isinstance(loop, dict) else "single"
    max_levers = loop.get("max_levers", 1) if isinstance(loop, dict) else 1
    current_lever_set = extract_current_lever_set_size(journal)
    next_phase = get_phase_next(phase)

    meta = journal.get("meta") or {}
    target = meta.get("target") if isinstance(meta, dict) else {}
    levers = meta.get("levers") if isinstance(meta, dict) else {}

    main_knob = "-"
    if isinstance(levers, dict):
        knob = levers.get("main_knob")
        if isinstance(knob, dict):
            main_knob = f"{knob.get('type', '?')} @ {knob.get('location', '?')}"

    allowed_count = 0
    frozen_count = 0
    if isinstance(levers, dict):
        allowed = levers.get("allowed")
        frozen = levers.get("frozen")
        if isinstance(allowed, list):
            allowed_count = len(allowed)
        if isinstance(frozen, list):
            frozen_count = len(frozen)

    target_summary = "-"
    if isinstance(target, dict) and target:
        target_summary = (
            f"{target.get('metric', '?')}: {target.get('current', '?')} -> {target.get('goal', '?')}"
        )

    lines = [
        f"Optimization Status: {agent}",
        f"Phase: {phase}",
        f"Iteration: {iteration}",
        f"Lever mode: {lever_mode}",
        f"Max levers: {max_levers}",
        f"Current lever set size: {current_lever_set}",
        "Lever scope:",
        f"  main_knob: {main_knob}",
        f"  allowed: {allowed_count}",
        f"  frozen: {frozen_count}",
        f"Target: {target_summary}",
        f"Next action: {next_phase}",
    ]
    return "\n".join(lines)


def run_contract_preflight(
    repo_root: Path,
    helper_paths: Dict[str, Path],
    agent: str,
    contract_path: Optional[str],
    validate_live: bool,
) -> Dict[str, Any]:
    args = ["resolve", "--agent", agent, "--format", "json"]
    if contract_path:
        args.extend(["--path", contract_path])
    if validate_live:
        args.append("--validate-live")

    result = run_python_script(helper_paths["contract_resolver"], args, cwd=repo_root, capture=True)

    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        eprint(result.stderr.strip())

    if result.returncode != 0:
        raise SystemExit(result.returncode)

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        eprint(f"ERROR: failed to parse contract_resolver JSON output: {exc}")
        raise SystemExit(3)

    contract = payload.get("contract")
    if not isinstance(contract, dict):
        eprint("ERROR: contract_resolver output missing 'contract' object")
        raise SystemExit(3)

    return contract


def format_dataset(contract: Dict[str, Any]) -> str:
    dataset = contract.get("dataset")
    if not isinstance(dataset, dict):
        return "- unknown"
    name = dataset.get("name", "-")
    ds_id = dataset.get("id", "-")
    return f"- name: {name}\n- id: {ds_id}"


def format_graders(contract: Dict[str, Any]) -> str:
    dimensions = contract.get("dimensions")
    if not isinstance(dimensions, list) or not dimensions:
        return "- none"

    lines: List[str] = []
    for dim in dimensions:
        if not isinstance(dim, dict):
            continue
        lines.append(
            f"- {dim.get('name', 'unknown')} (judge: {dim.get('judge_prompt', '-')}, threshold: {dim.get('threshold', '-')})"
        )
    return "\n".join(lines) if lines else "- none"


def format_baseline(contract: Dict[str, Any]) -> str:
    baseline = contract.get("baseline")
    if not isinstance(baseline, dict):
        return "- none"

    run_name = baseline.get("run_name", "-")
    metrics = baseline.get("metrics")
    lines = [f"- run_name: {run_name}"]
    if isinstance(metrics, dict) and metrics:
        for key, value in metrics.items():
            lines.append(f"- metric {key}: {value}")
    else:
        lines.append("- metrics: none")
    return "\n".join(lines)


def format_hard_boundaries(contract: Dict[str, Any]) -> str:
    dimensions = contract.get("dimensions")
    if not isinstance(dimensions, list):
        return "- none"

    critical = [d for d in dimensions if isinstance(d, dict) and d.get("critical")]
    if not critical:
        return "- none"

    return "\n".join(
        f"- {d.get('name', 'unknown')} >= {d.get('threshold', '?')}"
        for d in critical
    )


def format_regression_guards(journal: Dict[str, Any]) -> str:
    meta = journal.get("meta")
    if not isinstance(meta, dict):
        return "- none declared"

    constraints = meta.get("constraints")
    if not isinstance(constraints, list) or not constraints:
        return "- none declared"

    lines: List[str] = []
    for item in constraints:
        if not isinstance(item, dict):
            continue
        lines.append(f"- {item.get('metric', '?')} {item.get('limit', '?')}")
    return "\n".join(lines) if lines else "- none declared"


def format_frozen_scope(journal: Dict[str, Any]) -> str:
    meta = journal.get("meta")
    if not isinstance(meta, dict):
        return "- none declared"

    levers = meta.get("levers")
    if not isinstance(levers, dict):
        return "- none declared"

    frozen = levers.get("frozen")
    if not isinstance(frozen, list) or not frozen:
        return "- none declared"

    return "\n".join(f"- {item}" for item in frozen)


def render_cloud_prompt(template_text: str, values: Dict[str, str]) -> str:
    rendered = template_text
    for key, value in values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


def extract_template_markdown(template_source: str) -> str:
    match = re.search(r"```markdown\n(.*?)```", template_source, flags=re.DOTALL)
    if match:
        return match.group(1).strip()
    return template_source.strip()


def handle_optimize_bootstrap(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    helper_paths = get_helper_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    dimensions = parse_dimensions_json(args.dimensions_json, args.dimensions_file)

    if not args.skip_assess:
        print("# Step: assess")
        assess = run_python_script(
            helper_paths["eval_infra"],
            ["assess", "--agent", args.agent, "--dataset", dataset],
            cwd=repo_root,
        )
        if assess.returncode != 0:
            return assess.returncode

        print("\n# Step: bootstrap")
        bootstrap_args = [
            "bootstrap",
            "--agent",
            args.agent,
            "--dataset",
            dataset,
        ]
        
        if dimensions:
            bootstrap_args.extend(["--dimensions", dimensions])

        if args.entry_point:
            bootstrap_args.extend(["--entry-point", args.entry_point])
        if args.description:
            bootstrap_args.extend(["--description", args.description])

        bootstrap = run_python_script(helper_paths["eval_infra"], bootstrap_args, cwd=repo_root)
        if bootstrap.returncode != 0:
            return bootstrap.returncode

    should_run_baseline = args.run_baseline or bool(args.task_script)
    if should_run_baseline:
        print("\n# Step: baseline")
        baseline_args = ["baseline", "--agent", args.agent, "--dataset", dataset]
        if args.task_script:
            baseline_args.extend(["--task-script", args.task_script])
        if args.run_name:
            baseline_args.extend(["--run-name", args.run_name])
        if args.sample_size is not None:
            baseline_args.extend(["--sample-size", str(args.sample_size)])
        if args.max_concurrency is not None:
            baseline_args.extend(["--max-concurrency", str(args.max_concurrency)])

        baseline = run_python_script(helper_paths["eval_infra"], baseline_args, cwd=repo_root)
        if baseline.returncode != 0:
            return baseline.returncode

    if not args.skip_export:
        print("\n# Step: export")
        export = run_python_script(
            helper_paths["eval_infra"],
            [
                "export",
                "--agent",
                args.agent,
                "--dataset",
                dataset,
                "--output-dir",
                args.output_dir,
            ],
            cwd=repo_root,
        )
        if export.returncode != 0:
            return export.returncode

    print("\n# Next")
    print(
        "Run: python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py "
        f"optimize --agent {args.agent} --lever-mode single"
    )
    return 0


def handle_optimize_preflight(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    helper_paths = get_helper_paths(repo_root)
    contract = run_contract_preflight(
        repo_root=repo_root,
        helper_paths=helper_paths,
        agent=args.agent,
        contract_path=args.contract_path,
        validate_live=args.validate_live,
    )

    if args.summary:
        dataset = contract.get("dataset") if isinstance(contract, dict) else {}
        baseline = contract.get("baseline") if isinstance(contract, dict) else {}
        dimensions = contract.get("dimensions") if isinstance(contract, dict) else []

        print("\nContract Summary")
        if isinstance(dataset, dict):
            print(f"- Dataset: {dataset.get('name', '-')} ({dataset.get('id', '-')})")
        print(f"- Score scale: {contract.get('score_scale', '-')}")
        if isinstance(baseline, dict):
            print(f"- Baseline run: {baseline.get('run_name', '-')}")
        if isinstance(dimensions, list):
            print(f"- Dimensions: {len(dimensions)}")

    return 0


def handle_optimize(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    helper_paths = get_helper_paths(repo_root)

    lever_mode, max_levers = resolve_lever_settings(args.lever_mode, args.max_levers)

    run_contract_preflight(
        repo_root=repo_root,
        helper_paths=helper_paths,
        agent=args.agent,
        contract_path=args.contract_path,
        validate_live=args.validate_live,
    )

    if args.journal_path:
        journal_path = Path(args.journal_path)
        if not journal_path.is_absolute():
            journal_path = repo_root / journal_path
    else:
        journal_path = repo_root / ".claude" / "optimization-loops" / args.agent / "journal.yaml"

    if journal_path.exists():
        try:
            journal = load_journal(journal_path)
        except Exception as exc:
            eprint(f"ERROR: failed to parse journal at {journal_path}: {exc}")
            return 2
    else:
        if not args.init_journal:
            eprint(f"ERROR: journal not found: {journal_path}")
            eprint("Hint: re-run with --init-journal to create a minimal journal skeleton.")
            return 2
        journal = {}

    journal = ensure_journal_defaults(journal, args.agent, lever_mode, max_levers)
    save_journal(journal_path, journal)

    print(f"\nJournal: {journal_path}")
    print(format_status_block(args.agent, journal))
    return 0


def handle_optimize_status(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)

    journal_root = Path(args.journal_root)
    if not journal_root.is_absolute():
        journal_root = repo_root / journal_root

    if args.agent:
        journal_path = journal_root / args.agent / "journal.yaml"
        if not journal_path.exists():
            eprint(f"ERROR: journal not found: {journal_path}")
            return 2

        try:
            journal = load_journal(journal_path)
        except Exception as exc:
            eprint(f"ERROR: failed to parse {journal_path}: {exc}")
            return 2

        print(format_status_block(args.agent, journal))
        return 0

    paths = sorted(journal_root.glob("*/journal.yaml"))
    if not paths:
        print(f"No journals found under {journal_root}")
        return 0

    print("Optimization Journals")
    for path in paths:
        agent = path.parent.name
        try:
            journal = load_journal(path)
            phase = str(journal.get("current_phase", "init"))
            iteration = journal.get("current_iteration", 0)
            loop = journal.get("loop") if isinstance(journal.get("loop"), dict) else {}
            lever_mode = loop.get("lever_mode", "single")
            max_levers = loop.get("max_levers", 1)
            next_phase = get_phase_next(phase)
            print(
                f"- {agent}: phase={phase}, iter={iteration}, lever_mode={lever_mode}, "
                f"max_levers={max_levers}, next={next_phase}"
            )
        except Exception as exc:
            print(f"- {agent}: ERROR parsing journal ({exc})")

    return 0


def handle_cloud_optimize(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    helper_paths = get_helper_paths(repo_root)

    lever_mode, max_levers = resolve_lever_settings(args.lever_mode, args.max_levers)

    contract = run_contract_preflight(
        repo_root=repo_root,
        helper_paths=helper_paths,
        agent=args.agent,
        contract_path=args.contract_path,
        validate_live=args.validate_live,
    )

    if args.journal_path:
        journal_path = Path(args.journal_path)
        if not journal_path.is_absolute():
            journal_path = repo_root / journal_path
    else:
        journal_path = repo_root / ".claude" / "optimization-loops" / args.agent / "journal.yaml"

    journal: Dict[str, Any] = {}
    if journal_path.exists():
        try:
            journal = load_journal(journal_path)
        except Exception as exc:
            eprint(f"WARNING: failed to parse journal {journal_path}: {exc}")

    template_source = helper_paths["loop_template"].read_text(encoding="utf-8")
    template = extract_template_markdown(template_source)

    meta = journal.get("meta") if isinstance(journal.get("meta"), dict) else {}
    target = meta.get("target") if isinstance(meta, dict) and isinstance(meta.get("target"), dict) else {}
    levers = meta.get("levers") if isinstance(meta, dict) and isinstance(meta.get("levers"), dict) else {}
    main_knob = levers.get("main_knob") if isinstance(levers.get("main_knob"), dict) else {}

    values = {
        "GOAL_METRIC": str(target.get("metric", "quality")),
        "CURRENT_VALUE": str(target.get("current", "-")),
        "GOAL_TARGET": str(target.get("goal", "-")),
        "MAIN_KNOB_TYPE": str(main_knob.get("type", "-")),
        "MAIN_KNOB_LOCATION": str(main_knob.get("location", "-")),
        "MAX_ITERATIONS": str(args.iterations),
        "LEVER_MODE": lever_mode,
        "MAX_LEVERS": str(max_levers),
        "DATASET": format_dataset(contract),
        "GRADERS": format_graders(contract),
        "BASELINE": format_baseline(contract),
        "HARD_BOUNDARIES": format_hard_boundaries(contract),
        "REGRESSION_GUARDS": format_regression_guards(journal),
        "FROZEN": format_frozen_scope(journal),
    }

    rendered = render_cloud_prompt(template, values)

    if args.out:
        out_path = Path(args.out)
        if not out_path.is_absolute():
            out_path = repo_root / out_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered + "\n", encoding="utf-8")
        print(f"Saved cloud prompt: {out_path}")

    print("\n# Cloud Optimize Prompt\n")
    print(rendered)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Codex wrappers for Claude-style optimization commands"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    bootstrap = sub.add_parser("optimize-bootstrap", help="Bootstrap/validate eval infra and export snapshots")
    bootstrap.add_argument("--repo-root", help="Path to mberto-compound repository")
    bootstrap.add_argument("--agent", required=True, help="Agent name")
    bootstrap.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    bootstrap.add_argument("--dimensions-json", help="Dimensions JSON list")
    bootstrap.add_argument("--dimensions-file", help="Path to dimensions JSON file")
    bootstrap.add_argument("--entry-point", help="Agent entry point string")
    bootstrap.add_argument("--description", help="Dataset description")
    bootstrap.add_argument("--run-baseline", action="store_true", help="Run baseline step")
    bootstrap.add_argument("--task-script", help="Task script for baseline")
    bootstrap.add_argument("--run-name", help="Optional baseline run name")
    bootstrap.add_argument("--sample-size", type=int, help="Baseline sample-size metadata")
    bootstrap.add_argument("--max-concurrency", type=int, help="Baseline max concurrency")
    bootstrap.add_argument("--output-dir", default=".claude/eval-infra", help="Export directory")
    bootstrap.add_argument("--skip-assess", action="store_true", help="Skip assess step")
    bootstrap.add_argument("--skip-export", action="store_true", help="Skip export step")
    bootstrap.set_defaults(func=handle_optimize_bootstrap)

    preflight = sub.add_parser("optimize-preflight", help="Run contract resolver preflight")
    preflight.add_argument("--repo-root", help="Path to mberto-compound repository")
    preflight.add_argument("--agent", required=True, help="Agent name")
    preflight.add_argument("--contract-path", help="Explicit contract path")
    preflight.add_argument("--validate-live", action="store_true", help="Validate live Langfuse identifiers")
    preflight.add_argument("--summary", action="store_true", help="Print compact post-check summary")
    preflight.set_defaults(func=handle_optimize_preflight)

    optimize = sub.add_parser("optimize", help="Codex wrapper for /optimize preflight + journal state")
    optimize.add_argument("--repo-root", help="Path to mberto-compound repository")
    optimize.add_argument("--agent", required=True, help="Agent name")
    optimize.add_argument("--contract-path", help="Explicit contract path")
    optimize.add_argument("--validate-live", action="store_true", help="Validate live Langfuse identifiers")
    optimize.add_argument("--lever-mode", choices=["single", "multi"], default="single")
    optimize.add_argument("--max-levers", type=int, help="Max levers for multi mode (1..5)")
    optimize.add_argument("--journal-path", help="Override journal path")
    optimize.add_argument("--init-journal", action="store_true", help="Create journal if missing")
    optimize.set_defaults(func=handle_optimize)

    status = sub.add_parser("optimize-status", help="Read optimization status from journals")
    status.add_argument("--repo-root", help="Path to mberto-compound repository")
    status.add_argument("--agent", help="Agent name (omit to list all)")
    status.add_argument("--journal-root", default=".claude/optimization-loops", help="Journal root directory")
    status.set_defaults(func=handle_optimize_status)

    cloud = sub.add_parser("cloud-optimize", help="Generate cloud-ready optimize prompt")
    cloud.add_argument("--repo-root", help="Path to mberto-compound repository")
    cloud.add_argument("--agent", required=True, help="Agent name")
    cloud.add_argument("--contract-path", help="Explicit contract path")
    cloud.add_argument("--validate-live", action="store_true", help="Validate live Langfuse identifiers")
    cloud.add_argument("--journal-path", help="Override journal path")
    cloud.add_argument("--iterations", type=int, default=5, help="Max optimization iterations")
    cloud.add_argument("--lever-mode", choices=["single", "multi"], default="single")
    cloud.add_argument("--max-levers", type=int, help="Max levers for multi mode (1..5)")
    cloud.add_argument("--out", help="Write rendered prompt to file")
    cloud.set_defaults(func=handle_cloud_optimize)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
