#!/usr/bin/env python3
"""
Codex wrappers for Claude-style langfuse-analyzer commands and skill parity.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

LANGFUSE_CODEX_SKILLS = [
    "langfuse-agent-advisor",
    "langfuse-agent-eval",
    "langfuse-agent-eval-setup",
    "langfuse-eval-infrastructure",
    "langfuse-annotation-manager",
    "langfuse-data-retrieval",
    "langfuse-dataset-management",
    "langfuse-dataset-setup",
    "langfuse-experiment-runner",
    "langfuse-instrumentation-setup",
    "langfuse-prompt-management",
    "langfuse-score-analytics",
    "langfuse-session-analysis",
    "langfuse-trace-analysis",
]

CLAUDE_TO_CODEX_SKILL_MAP = {
    "agent-advisor": "langfuse-agent-advisor",
    "annotation-manager": "langfuse-annotation-manager",
    "data-retrieval": "langfuse-data-retrieval",
    "dataset-management": "langfuse-dataset-management",
    "experiment-runner": "langfuse-experiment-runner",
    "instrumentation-setup": "langfuse-instrumentation-setup",
    "prompt-management": "langfuse-prompt-management",
    "score-analytics": "langfuse-score-analytics",
    "session-analysis": "langfuse-session-analysis",
    "trace-analysis": "langfuse-trace-analysis",
    "eval-infrastructure": "langfuse-eval-infrastructure",
    "schema-validator": "(no codex skill port in this repo)",
}


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
    def has_required(path: Path) -> bool:
        return (
            (path / "plugins" / "langfuse-analyzer").exists()
            and (path / "codex-skills").exists()
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
            if has_required(probe):
                return probe

    eprint("ERROR: Could not resolve repo root. Pass --repo-root or set MBERTO_COMPOUND_ROOT.")
    raise SystemExit(2)


def get_paths(repo_root: Path) -> Dict[str, Path]:
    paths = {
        "tracing_context": repo_root
        / "plugins"
        / "langfuse-analyzer"
        / "skills"
        / "eval-infrastructure"
        / "helpers"
        / "tracing_context_collector.py",
        "eval_infra": repo_root
        / "plugins"
        / "langfuse-analyzer"
        / "skills"
        / "eval-infrastructure"
        / "helpers"
        / "eval_infra_manager.py",
        "experiment_runner": repo_root
        / "plugins"
        / "langfuse-analyzer"
        / "skills"
        / "experiment-runner"
        / "helpers"
        / "experiment_runner.py",
        "dataset_manager": repo_root
        / "plugins"
        / "langfuse-analyzer"
        / "skills"
        / "dataset-management"
        / "helpers"
        / "dataset_manager.py",
        "codex_skills_root": repo_root / "codex-skills",
    }

    missing = [name for name, p in paths.items() if name != "codex_skills_root" and not p.exists()]
    if missing:
        for name in missing:
            eprint(f"ERROR: Missing helper path '{name}': {paths[name]}")
        raise SystemExit(2)

    return paths


def run_python(
    script: Path,
    args: List[str],
    cwd: Path,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    cmd = [sys.executable, str(script), *args]
    return subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        capture_output=capture,
        check=False,
    )


def normalize_dataset(agent: str, dataset: Optional[str]) -> str:
    return dataset if dataset else f"{agent}-eval"


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


def resolve_path(repo_root: Path, raw: str) -> Path:
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = repo_root / path
    return path


def resolve_instructions_text(repo_root: Path, instructions: Optional[str]) -> str:
    if not instructions:
        return "No custom instructions provided."

    maybe_path = resolve_path(repo_root, instructions)
    if maybe_path.exists() and maybe_path.is_file():
        return maybe_path.read_text(encoding="utf-8").strip() or "(empty file)"

    return instructions


def read_json_file(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            return raw
    except Exception:
        return {}
    return {}


def build_initial_doc(
    agent: str,
    dataset: str,
    instructions_text: str,
    context: Dict[str, Any],
) -> str:
    summary = context.get("summary") if isinstance(context.get("summary"), dict) else {}

    entry_points = summary.get("entry_point_candidates") if isinstance(summary, dict) else []
    score_names = summary.get("score_name_candidates") if isinstance(summary, dict) else []
    metadata_keys = summary.get("metadata_key_candidates") if isinstance(summary, dict) else []

    if not isinstance(entry_points, list):
        entry_points = []
    if not isinstance(score_names, list):
        score_names = []
    if not isinstance(metadata_keys, list):
        metadata_keys = []

    def bullet(values: List[str], fallback: str = "- (none)") -> str:
        if not values:
            return fallback
        return "\n".join(f"- {v}" for v in values)

    lines = [
        f"# Initial Eval Infrastructure: {agent}",
        "",
        "## 1. Scope and Optimization Intent",
        "- Feature/output in scope: TODO",
        "- Objective statement: TODO",
        "- Success criteria: TODO",
        "",
        "## 2. Custom Instructions (User-Provided)",
        instructions_text,
        "",
        "## 3. Tracing Implementation Context (Observed)",
        "### Entry Point Candidates",
        bullet([str(v) for v in entry_points]),
        "",
        "### Existing Score Name Candidates",
        bullet([str(v) for v in score_names]),
        "",
        "### Metadata Key Candidates (for slices)",
        bullet([str(v) for v in metadata_keys]),
        "",
        "## 4. Proposed Evaluation Contract (Initial Draft)",
        f"- dataset name: `{dataset}`",
        "- canonical score scale: `0-1`",
        "- dimensions: TODO (name, threshold, weight, critical)",
        "- candidate judge prompts: TODO (judge-*)",
        "- slice plan: TODO",
        "- baseline plan: TODO",
        "",
        "## 5. Open Questions and Risks",
        "- Missing instrumentation: TODO",
        "- Ambiguous metrics: TODO",
        "- Judge reliability concerns: TODO",
        "- Data quality gaps: TODO",
        "",
        "## 6. Next Commands",
        f"- /agent-eval-setup --agent {agent} --dataset {dataset}",
        f"- /agent-eval-infra status --agent {agent} --dataset {dataset}",
    ]

    return "\n".join(lines) + "\n"


def resolve_dataset_from_config(repo_root: Path, agent: str) -> Optional[str]:
    yaml = load_yaml_module()
    candidates = [
        repo_root / ".claude" / "agent-eval" / f"{agent}.yaml",
        repo_root / ".codex" / "agent-eval" / f"{agent}.yaml",
    ]

    for path in candidates:
        if not path.exists():
            continue
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                continue
            evaluation = data.get("evaluation")
            if isinstance(evaluation, dict):
                dataset = evaluation.get("dataset")
                if isinstance(dataset, str) and dataset.strip():
                    return dataset.strip()
        except Exception:
            continue

    return None


def run_eval_infra_action(
    repo_root: Path,
    eval_infra_script: Path,
    action: str,
    agent: str,
    dataset: str,
    dimensions: Optional[str],
    entry_point: Optional[str],
    description: Optional[str],
    task_script: Optional[str],
    run_name: Optional[str],
    sample_size: Optional[int],
    max_concurrency: Optional[int],
    output_dir: Optional[str],
) -> int:
    cmd = [action, "--agent", agent, "--dataset", dataset]

    if action in {"bootstrap", "ensure-judges"}:
        if not dimensions:
            eprint("ERROR: dimensions are required for bootstrap/ensure-judges")
            return 2
        cmd.extend(["--dimensions", dimensions])

    if action == "bootstrap":
        if entry_point:
            cmd.extend(["--entry-point", entry_point])
        if description:
            cmd.extend(["--description", description])

    if action == "baseline":
        if task_script:
            cmd.extend(["--task-script", task_script])
        if run_name:
            cmd.extend(["--run-name", run_name])
        if sample_size is not None:
            cmd.extend(["--sample-size", str(sample_size)])
        if max_concurrency is not None:
            cmd.extend(["--max-concurrency", str(max_concurrency)])

    if action == "export" and output_dir:
        cmd.extend(["--output-dir", output_dir])

    result = run_python(eval_infra_script, cmd, cwd=repo_root)
    return result.returncode


def handle_agent_eval_init(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    context_out = (
        resolve_path(repo_root, args.context_out)
        if args.context_out
        else repo_root / ".claude" / "eval-infra" / f"{args.agent}-tracing-context.json"
    )
    output_path = (
        resolve_path(repo_root, args.output)
        if args.output
        else repo_root / ".claude" / "eval-infra" / f"{args.agent}-initial.md"
    )

    scan_args = [
        "scan",
        "--agent",
        args.agent,
        "--root",
        str(repo_root),
        "--out",
        str(context_out),
    ]
    if args.max_hits is not None:
        scan_args.extend(["--max-hits", str(args.max_hits)])

    scan = run_python(paths["tracing_context"], scan_args, cwd=repo_root)
    if scan.returncode != 0:
        return scan.returncode

    context = read_json_file(context_out)
    instructions_text = resolve_instructions_text(repo_root, args.instructions)
    doc = build_initial_doc(args.agent, dataset, instructions_text, context)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(doc, encoding="utf-8")

    summary = context.get("summary") if isinstance(context, dict) else {}
    dimensions_guess = 0
    if isinstance(summary, dict):
        candidates = summary.get("score_name_candidates")
        if isinstance(candidates, list):
            dimensions_guess = len(candidates)

    print("# Agent Eval Init")
    print("")
    print(f"doc: {output_path}")
    print(f"tracing_context: {context_out}")
    print(f"dataset: {dataset}")
    print(f"proposed_dimensions_count: {dimensions_guess}")
    return 0


def handle_agent_eval_infra(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    dimensions = parse_dimensions_json(args.dimensions_json, args.dimensions_file)
    action = "assess" if args.action == "status" else args.action

    return run_eval_infra_action(
        repo_root=repo_root,
        eval_infra_script=paths["eval_infra"],
        action=action,
        agent=args.agent,
        dataset=dataset,
        dimensions=dimensions,
        entry_point=args.entry_point,
        description=args.description,
        task_script=args.task_script,
        run_name=args.run_name,
        sample_size=args.sample_size,
        max_concurrency=args.max_concurrency,
        output_dir=args.output_dir,
    )


def handle_agent_eval_setup(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    dimensions = parse_dimensions_json(args.dimensions_json, args.dimensions_file)
    if not dimensions:
        eprint("ERROR: agent-eval-setup requires dimensions via --dimensions-json or --dimensions-file")
        return 2

    if not args.skip_scan:
        context_out = repo_root / ".claude" / "eval-infra" / f"{args.agent}-tracing-context.json"
        scan = run_python(
            paths["tracing_context"],
            [
                "scan",
                "--agent",
                args.agent,
                "--root",
                str(repo_root),
                "--out",
                str(context_out),
            ],
            cwd=repo_root,
        )
        if scan.returncode != 0:
            return scan.returncode

    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "bootstrap",
        args.agent,
        dataset,
        dimensions,
        args.entry_point,
        args.description,
        None,
        None,
        None,
        None,
        None,
    )
    if rc != 0:
        return rc

    baseline_task = args.task_script if args.task_script else None
    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "baseline",
        args.agent,
        dataset,
        None,
        None,
        None,
        baseline_task,
        args.run_name,
        args.sample_size,
        args.max_concurrency,
        None,
    )
    if rc != 0:
        return rc

    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "export",
        args.agent,
        dataset,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        args.output_dir,
    )
    if rc != 0:
        return rc

    print("\nsetup_complete: true")
    print(f"dataset: {dataset}")
    print(f"next: /agent-eval --agent {args.agent}")
    return 0


def add_trace_ids_from_file(path: Path) -> List[str]:
    if not path.exists():
        return []
    values: List[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        values.append(line)
    return values


def handle_setup_dataset(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    dimensions = parse_dimensions_json(args.dimensions_json, args.dimensions_file)
    if not dimensions:
        eprint("ERROR: setup-dataset requires dimensions via --dimensions-json or --dimensions-file")
        return 2

    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "bootstrap",
        args.agent,
        dataset,
        dimensions,
        args.entry_point,
        args.description,
        None,
        None,
        None,
        None,
        None,
    )
    if rc != 0:
        return rc

    trace_ids = list(args.trace_id or [])
    if args.trace_file:
        trace_ids.extend(add_trace_ids_from_file(resolve_path(repo_root, args.trace_file)))

    for trace_id in trace_ids:
        cmd = [
            "add-trace",
            "--dataset",
            dataset,
            "--trace-id",
            trace_id,
        ]
        if args.expected_score is not None:
            cmd.extend(["--expected-score", str(args.expected_score)])
        if args.failure_reason:
            cmd.extend(["--failure-reason", args.failure_reason])

        result = run_python(paths["dataset_manager"], cmd, cwd=repo_root)
        if result.returncode != 0:
            return result.returncode

    if args.task_script:
        rc = run_eval_infra_action(
            repo_root,
            paths["eval_infra"],
            "baseline",
            args.agent,
            dataset,
            None,
            None,
            None,
            args.task_script,
            args.run_name,
            args.sample_size,
            args.max_concurrency,
            None,
        )
        if rc != 0:
            return rc

    if not args.skip_export:
        rc = run_eval_infra_action(
            repo_root,
            paths["eval_infra"],
            "export",
            args.agent,
            dataset,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            args.output_dir,
        )
        if rc != 0:
            return rc

    print("\nsetup_dataset_complete: true")
    print(f"dataset: {dataset}")
    print(f"trace_ids_added: {len(trace_ids)}")
    return 0


def get_cycle_label(cycle: Optional[int]) -> str:
    if cycle is not None:
        return str(cycle)
    return datetime.utcnow().strftime("%Y%m%d-%H%M%S")


def handle_agent_eval(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = args.dataset or resolve_dataset_from_config(repo_root, args.agent) or normalize_dataset(args.agent, None)

    cycle_label = get_cycle_label(args.cycle)
    run_name = args.run_name or f"{args.agent}-cycle-{cycle_label}"

    run_output = ""
    run_stderr = ""
    analysis_output = ""

    if not args.analyze_only:
        if not args.task_script:
            eprint("ERROR: --task-script is required unless --analyze-only is used")
            return 2

        run_cmd = [
            "run",
            "--dataset",
            dataset,
            "--run-name",
            run_name,
            "--task-script",
            args.task_script,
            "--max-concurrency",
            str(args.max_concurrency),
        ]
        if args.evaluator_script:
            run_cmd.extend(["--evaluator-script", args.evaluator_script])

        if not args.no_langfuse_judges:
            run_cmd.append("--use-langfuse-judges")

        if args.judges:
            run_cmd.extend(["--judges", *args.judges])

        if args.description:
            run_cmd.extend(["--description", args.description])

        run_result = run_python(paths["experiment_runner"], run_cmd, cwd=repo_root, capture=True)
        run_output = (run_result.stdout or "").strip()
        run_stderr = (run_result.stderr or "").strip()

        if run_stderr:
            eprint(run_stderr)

        if run_result.returncode != 0:
            if run_output:
                print(run_output)
            return run_result.returncode

    if not args.quick:
        analyze_cmd = [
            "analyze",
            "--dataset",
            dataset,
            "--run-name",
            run_name,
            "--show-failures",
        ]
        if args.score_threshold is not None:
            analyze_cmd.extend(["--score-threshold", str(args.score_threshold)])
        if args.score_name:
            analyze_cmd.extend(["--score-name", args.score_name])

        analysis_result = run_python(paths["experiment_runner"], analyze_cmd, cwd=repo_root, capture=True)
        analysis_output = (analysis_result.stdout or "").strip()
        if analysis_result.stderr:
            eprint((analysis_result.stderr or "").strip())
        if analysis_result.returncode != 0:
            return analysis_result.returncode

    lines = [
        f"# Evaluation: {args.agent} - Cycle {cycle_label}",
        "",
        "## Run",
        run_output if run_output else "(analyze-only mode; no run executed)",
    ]

    if not args.quick:
        lines.extend(["", "## Analysis", analysis_output if analysis_output else "(no analysis output)"])

    report = "\n".join(lines).rstrip() + "\n"

    if args.output == "stdout":
        print(report)
    else:
        report_path = (
            resolve_path(repo_root, args.report_path)
            if args.report_path
            else repo_root / ".claude" / "agent-eval" / args.agent / "reports" / f"cycle-{cycle_label}.md"
        )
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report, encoding="utf-8")
        print(f"report: {report_path}")
        print(f"dataset: {dataset}")
        print(f"run_name: {run_name}")

    return 0


def handle_optimize_bootstrap(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    dataset = normalize_dataset(args.agent, args.dataset)
    dimensions = parse_dimensions_json(args.dimensions_json, args.dimensions_file)

    print("# Step: assess")
    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "assess",
        args.agent,
        dataset,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    if rc != 0:
        return rc

    if dimensions:
        print("\n# Step: bootstrap")
        rc = run_eval_infra_action(
            repo_root,
            paths["eval_infra"],
            "bootstrap",
            args.agent,
            dataset,
            dimensions,
            args.entry_point,
            args.description,
            None,
            None,
            None,
            None,
            None,
        )
        if rc != 0:
            return rc

    if args.task_script:
        print("\n# Step: baseline")
        rc = run_eval_infra_action(
            repo_root,
            paths["eval_infra"],
            "baseline",
            args.agent,
            dataset,
            None,
            None,
            None,
            args.task_script,
            args.run_name,
            args.sample_size,
            args.max_concurrency,
            None,
        )
        if rc != 0:
            return rc

    print("\n# Step: export")
    rc = run_eval_infra_action(
        repo_root,
        paths["eval_infra"],
        "export",
        args.agent,
        dataset,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        args.output_dir,
    )
    if rc != 0:
        return rc

    print("\n# Next")
    print(f"Run: /optimize {args.agent}")
    return 0


def handle_skills_status(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    codex_home = Path(args.dest).expanduser()
    source_root = paths["codex_skills_root"]

    print("Langfuse Skill Parity")
    print("")
    print("Claude skill -> Codex skill mapping:")
    for claude, codex in CLAUDE_TO_CODEX_SKILL_MAP.items():
        print(f"- {claude} -> {codex}")

    print("\nCodex skill install status:")
    for skill in LANGFUSE_CODEX_SKILLS:
        src = source_root / skill
        dst = codex_home / skill
        src_state = "source:ok" if src.exists() else "source:missing"
        dst_state = "installed" if dst.exists() else "not-installed"
        print(f"- {skill}: {src_state}, {dst_state}")

    return 0


def handle_skills_sync(args: argparse.Namespace) -> int:
    repo_root = find_repo_root(args.repo_root)
    paths = get_paths(repo_root)

    source_root = paths["codex_skills_root"]
    dest_root = Path(args.dest).expanduser()
    dest_root.mkdir(parents=True, exist_ok=True)

    if args.skills:
        selected = args.skills
    elif args.all:
        selected = LANGFUSE_CODEX_SKILLS
    else:
        selected = [
            s for s in LANGFUSE_CODEX_SKILLS
            if not (dest_root / s).exists()
        ]

    if not selected:
        print("No skills selected for sync.")
        return 0

    copied: List[str] = []
    skipped: List[str] = []
    missing: List[str] = []

    for skill in selected:
        src = source_root / skill
        dst = dest_root / skill

        if not src.exists():
            missing.append(skill)
            continue

        if dst.exists() and not args.overwrite:
            skipped.append(skill)
            continue

        shutil.copytree(src, dst, dirs_exist_ok=True)
        copied.append(skill)

    print("Skill Sync Result")
    print(f"- copied: {len(copied)}")
    print(f"- skipped: {len(skipped)}")
    print(f"- missing-source: {len(missing)}")

    if copied:
        print("\nCopied:")
        for skill in copied:
            print(f"- {skill}")

    if skipped:
        print("\nSkipped (already installed; use --overwrite to merge/update):")
        for skill in skipped:
            print(f"- {skill}")

    if missing:
        print("\nMissing in repo source:")
        for skill in missing:
            print(f"- {skill}")

    print("\nRestart Codex to pick up new skills.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Codex wrappers for langfuse-analyzer commands and skill parity"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    init = sub.add_parser("agent-eval-init", help="Create initial eval infra markdown doc from tracing scan")
    init.add_argument("--repo-root", help="Path to mberto-compound repository")
    init.add_argument("--agent", required=True, help="Agent name")
    init.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    init.add_argument("--instructions", help="Inline text or path to instructions file")
    init.add_argument("--output", help="Output markdown path (default .claude/eval-infra/<agent>-initial.md)")
    init.add_argument("--context-out", help="Tracing context JSON path")
    init.add_argument("--max-hits", type=int, help="Max hits per search group")
    init.set_defaults(func=handle_agent_eval_init)

    infra = sub.add_parser("agent-eval-infra", help="Run eval infra actions: status/bootstrap/baseline/export")
    infra.add_argument("--repo-root", help="Path to mberto-compound repository")
    infra.add_argument("--action", required=True, choices=["status", "assess", "bootstrap", "baseline", "export", "ensure-judges"], help="Infra action")
    infra.add_argument("--agent", required=True, help="Agent name")
    infra.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    infra.add_argument("--dimensions-json", help="Dimensions JSON list")
    infra.add_argument("--dimensions-file", help="Path to dimensions JSON file")
    infra.add_argument("--entry-point", help="Agent entry point")
    infra.add_argument("--description", help="Dataset description")
    infra.add_argument("--task-script", help="Task script for baseline run")
    infra.add_argument("--run-name", help="Baseline run name")
    infra.add_argument("--sample-size", type=int, help="Baseline sample size metadata")
    infra.add_argument("--max-concurrency", type=int, help="Baseline max concurrency")
    infra.add_argument("--output-dir", default=".claude/eval-infra", help="Export output dir")
    infra.set_defaults(func=handle_agent_eval_infra)

    setup = sub.add_parser("agent-eval-setup", help="Bootstrap eval infra end-to-end")
    setup.add_argument("--repo-root", help="Path to mberto-compound repository")
    setup.add_argument("--agent", required=True, help="Agent name")
    setup.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    setup.add_argument("--dimensions-json", help="Dimensions JSON list")
    setup.add_argument("--dimensions-file", help="Path to dimensions JSON file")
    setup.add_argument("--entry-point", help="Agent entry point")
    setup.add_argument("--description", help="Dataset description")
    setup.add_argument("--task-script", help="Task script for baseline")
    setup.add_argument("--run-name", help="Baseline run name")
    setup.add_argument("--sample-size", type=int, help="Baseline sample size metadata")
    setup.add_argument("--max-concurrency", type=int, help="Baseline max concurrency")
    setup.add_argument("--output-dir", default=".claude/eval-infra", help="Export output dir")
    setup.add_argument("--skip-scan", action="store_true", help="Skip tracing context scan")
    setup.set_defaults(func=handle_agent_eval_setup)

    ds = sub.add_parser("setup-dataset", help="Bootstrap dataset + optional trace curation + export")
    ds.add_argument("--repo-root", help="Path to mberto-compound repository")
    ds.add_argument("--agent", required=True, help="Agent name")
    ds.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    ds.add_argument("--dimensions-json", help="Dimensions JSON list")
    ds.add_argument("--dimensions-file", help="Path to dimensions JSON file")
    ds.add_argument("--entry-point", help="Agent entry point")
    ds.add_argument("--description", help="Dataset description")
    ds.add_argument("--trace-id", action="append", help="Trace ID to add (repeatable)")
    ds.add_argument("--trace-file", help="File containing trace IDs, one per line")
    ds.add_argument("--expected-score", type=float, help="Expected score when adding traces")
    ds.add_argument("--failure-reason", help="Failure reason metadata when adding traces")
    ds.add_argument("--task-script", help="Task script for baseline")
    ds.add_argument("--run-name", help="Baseline run name")
    ds.add_argument("--sample-size", type=int, help="Baseline sample size metadata")
    ds.add_argument("--max-concurrency", type=int, help="Baseline max concurrency")
    ds.add_argument("--output-dir", default=".claude/eval-infra", help="Export output dir")
    ds.add_argument("--skip-export", action="store_true", help="Skip export step")
    ds.set_defaults(func=handle_setup_dataset)

    eval_cmd = sub.add_parser("agent-eval", help="Run evaluation cycle and write markdown report")
    eval_cmd.add_argument("--repo-root", help="Path to mberto-compound repository")
    eval_cmd.add_argument("--agent", required=True, help="Agent name")
    eval_cmd.add_argument("--dataset", help="Dataset name (optional; tries config first)")
    eval_cmd.add_argument("--task-script", help="Task script path for experiment run")
    eval_cmd.add_argument("--evaluator-script", help="Evaluator script path")
    eval_cmd.add_argument("--judges", nargs="+", help="Specific Langfuse judge prompt names")
    eval_cmd.add_argument("--no-langfuse-judges", action="store_true", help="Disable auto/use of Langfuse judge prompts")
    eval_cmd.add_argument("--run-name", help="Explicit run name")
    eval_cmd.add_argument("--cycle", type=int, help="Cycle number label")
    eval_cmd.add_argument("--quick", action="store_true", help="Skip analyze step")
    eval_cmd.add_argument("--analyze-only", action="store_true", help="Skip run and analyze an existing run-name")
    eval_cmd.add_argument("--score-threshold", type=float, help="Analyze: failure threshold")
    eval_cmd.add_argument("--score-name", help="Analyze: score name")
    eval_cmd.add_argument("--max-concurrency", type=int, default=5, help="Run max concurrency")
    eval_cmd.add_argument("--description", help="Run description")
    eval_cmd.add_argument("--output", choices=["local", "stdout"], default="local")
    eval_cmd.add_argument("--report-path", help="Custom report path")
    eval_cmd.set_defaults(func=handle_agent_eval)

    ob = sub.add_parser("optimize-bootstrap", help="Langfuse-side optimize bootstrap")
    ob.add_argument("--repo-root", help="Path to mberto-compound repository")
    ob.add_argument("--agent", required=True, help="Agent name")
    ob.add_argument("--dataset", help="Dataset name (default: <agent>-eval)")
    ob.add_argument("--dimensions-json", help="Dimensions JSON list")
    ob.add_argument("--dimensions-file", help="Path to dimensions JSON file")
    ob.add_argument("--entry-point", help="Agent entry point")
    ob.add_argument("--description", help="Dataset description")
    ob.add_argument("--task-script", help="Task script for baseline")
    ob.add_argument("--run-name", help="Baseline run name")
    ob.add_argument("--sample-size", type=int, help="Baseline sample size metadata")
    ob.add_argument("--max-concurrency", type=int, help="Baseline max concurrency")
    ob.add_argument("--output-dir", default=".claude/eval-infra", help="Export output dir")
    ob.set_defaults(func=handle_optimize_bootstrap)

    status = sub.add_parser("skills-status", help="Show Langfuse Claude->Codex skill parity status")
    status.add_argument("--repo-root", help="Path to mberto-compound repository")
    status.add_argument("--dest", default="~/.codex/skills", help="Codex skills install directory")
    status.set_defaults(func=handle_skills_status)

    sync = sub.add_parser("skills-sync", help="Install/copy Langfuse Codex skills into ~/.codex/skills")
    sync.add_argument("--repo-root", help="Path to mberto-compound repository")
    sync.add_argument("--dest", default="~/.codex/skills", help="Codex skills install directory")
    sync.add_argument("--all", action="store_true", help="Sync all known Langfuse Codex skills")
    sync.add_argument("--skills", nargs="+", help="Specific skill names to sync")
    sync.add_argument("--overwrite", action="store_true", help="Merge/update if destination already exists")
    sync.set_defaults(func=handle_skills_sync)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
