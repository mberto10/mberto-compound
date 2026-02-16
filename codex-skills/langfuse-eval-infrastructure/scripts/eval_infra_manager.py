#!/usr/bin/env python3
"""
Langfuse Evaluation Infrastructure Manager

Canonical evaluation-infrastructure contract (eval_infra_v1) with Langfuse as source of truth.

Commands:
  assess         Validate dataset infra readiness
  bootstrap      Ensure dataset + judges + metadata contract
  ensure-judges  Create missing judge prompts idempotently
  baseline       Verify baseline or run one baseline experiment
  export         Export local snapshots and compatibility config
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

def _import_or_exit(module_name: str, search_paths: List[Path], symbol: str):
    for path in search_paths:
        if path.exists():
            sys.path.insert(0, str(path))
            try:
                module = __import__(module_name, fromlist=[symbol])
                return getattr(module, symbol)
            except Exception:
                continue
    print(
        f"ERROR: Could not import {symbol} from {module_name}. "
        "Install required Langfuse Codex skills (langfuse-data-retrieval, langfuse-experiment-runner).",
        file=sys.stderr,
    )
    raise SystemExit(1)


_here = Path(__file__).resolve()
_codex_home = Path.home() / ".codex" / "skills"

# Shared Langfuse client
get_langfuse_client = _import_or_exit(
    "langfuse_client",
    [
        _here.parent,  # local fallback
        _codex_home / "langfuse-data-retrieval" / "scripts",
    ],
    "get_langfuse_client",
)

# Experiment runner for baseline execution
run_experiment = _import_or_exit(
    "experiment_runner",
    [
        _here.parent,  # local fallback
        _codex_home / "langfuse-experiment-runner" / "scripts",
    ],
    "run_experiment",
)


SCHEMA_VERSION = "eval_infra_v1"
DEFAULT_SCORE_SCALE = "0-1"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9\-]+", "-", name.lower()).strip("-")


def normalize_score(value: Any, fallback: float = 0.8) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return fallback

    if v < 0:
        return 0.0
    if v <= 1.0:
        return v
    if v <= 10.0:
        return v / 10.0
    return 1.0


def normalize_dimensions(raw_dimensions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for item in raw_dimensions:
        raw_name = str(item.get("name", "")).strip()
        if not raw_name:
            continue

        name = normalize_name(raw_name)
        judge_prompt = str(item.get("judge_prompt") or f"judge-{name}")
        threshold = normalize_score(item.get("threshold", 0.8), fallback=0.8)

        try:
            weight = float(item.get("weight", 1.0))
        except (TypeError, ValueError):
            weight = 1.0

        critical = bool(item.get("critical", False))

        normalized.append(
            {
                "name": name,
                "judge_prompt": judge_prompt,
                "threshold": round(threshold, 4),
                "weight": round(weight, 4),
                "critical": critical,
            }
        )

    return normalized


def deep_merge(base: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        if (
            key in merged
            and isinstance(merged[key], dict)
            and isinstance(value, dict)
        ):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def as_dict(obj: Any) -> Dict[str, Any]:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    try:
        return dict(obj)
    except Exception:
        return {}


def get_dataset(dataset_name: str) -> Optional[Any]:
    client = get_langfuse_client()
    try:
        return client.get_dataset(dataset_name)
    except Exception:
        return None


def get_dataset_metadata(dataset_name: str) -> Tuple[Optional[Any], Dict[str, Any]]:
    dataset = get_dataset(dataset_name)
    if not dataset:
        return None, {}

    metadata = getattr(dataset, "metadata", None)
    if isinstance(metadata, dict):
        return dataset, metadata

    ds_dict = as_dict(dataset)
    return dataset, ds_dict.get("metadata") or {}


def create_dataset_if_missing(dataset_name: str, description: Optional[str], metadata: Dict[str, Any]) -> Dict[str, Any]:
    client = get_langfuse_client()
    dataset = get_dataset(dataset_name)
    if dataset:
        return {"status": "exists", "name": dataset_name}

    try:
        created = client.create_dataset(name=dataset_name, description=description, metadata=metadata)
        return {
            "status": "created",
            "name": dataset_name,
            "id": getattr(created, "id", None),
        }
    except Exception as exc:
        return {"status": "error", "name": dataset_name, "error": str(exc)}


def update_dataset_metadata(dataset_name: str, metadata_patch: Dict[str, Any]) -> Dict[str, Any]:
    client = get_langfuse_client()
    dataset, existing = get_dataset_metadata(dataset_name)
    if not dataset:
        return {"status": "error", "error": f"Dataset '{dataset_name}' not found"}

    merged = deep_merge(existing, metadata_patch)
    dataset_id = getattr(dataset, "id", None) or as_dict(dataset).get("id")

    attempts = []

    if hasattr(client, "api") and hasattr(client.api, "datasets"):
        ds_api = client.api.datasets
        if hasattr(ds_api, "update"):
            attempts.extend(
                [
                    lambda: ds_api.update(dataset_id, metadata=merged),
                    lambda: ds_api.update(id=dataset_id, metadata=merged),
                    lambda: ds_api.update(name=dataset_name, metadata=merged),
                ]
            )
        if hasattr(ds_api, "patch"):
            attempts.extend(
                [
                    lambda: ds_api.patch(dataset_id, metadata=merged),
                    lambda: ds_api.patch(id=dataset_id, metadata=merged),
                ]
            )

    if hasattr(dataset, "update"):
        attempts.append(lambda: dataset.update(metadata=merged))

    errors: List[str] = []
    for attempt in attempts:
        try:
            attempt()
            return {"status": "updated", "metadata": merged}
        except Exception as exc:
            errors.append(str(exc))

    # No supported update path.
    return {
        "status": "warning",
        "metadata": merged,
        "error": "Could not update dataset metadata via SDK/API. Update manually in Langfuse UI.",
        "details": errors[:3],
    }


def prompt_exists(prompt_name: str) -> bool:
    client = get_langfuse_client()
    try:
        prompt = client.get_prompt(prompt_name, label="production")
        return bool(prompt)
    except Exception:
        return False


def default_judge_prompt(dimension_name: str) -> str:
    title = dimension_name.replace("-", " ")
    return (
        f"Rate the {title} of this response on a scale of 0-10.\n\n"
        "INPUT:\n{{input}}\n\n"
        "EXPECTED (if available):\n{{expected_output}}\n\n"
        "RESPONSE TO EVALUATE:\n{{output}}\n\n"
        "Respond with ONLY valid JSON:\n"
        "{\"score\": <0-10>, \"reasoning\": \"<brief explanation>\"}"
    )


def ensure_judge_prompts(dimensions: List[Dict[str, Any]]) -> Dict[str, Any]:
    client = get_langfuse_client()
    created: List[str] = []
    existing: List[str] = []
    failed: List[Dict[str, str]] = []

    for dim in dimensions:
        prompt_name = dim["judge_prompt"]
        if prompt_exists(prompt_name):
            existing.append(prompt_name)
            continue

        try:
            client.create_prompt(
                name=prompt_name,
                type="text",
                prompt=default_judge_prompt(dim["name"]),
                config={"model": "gpt-4o", "temperature": 0, "max_tokens": 120},
                labels=["production"],
            )
            created.append(prompt_name)
        except Exception as exc:
            failed.append({"prompt": prompt_name, "error": str(exc)})

    return {
        "created": created,
        "existing": existing,
        "failed": failed,
        "ready": len(failed) == 0,
    }


def build_metadata(
    agent_name: str,
    entry_point: str,
    dimensions: List[Dict[str, Any]],
    baseline: Optional[Dict[str, Any]] = None,
    previous: Optional[Dict[str, Any]] = None,
    judges_ready: Optional[bool] = None,
) -> Dict[str, Any]:
    prev = previous or {}
    prev_baseline = prev.get("baseline") if isinstance(prev, dict) else None
    baseline_block = baseline or prev_baseline or {
        "run_name": "",
        "created_at": "",
        "metrics": {},
    }

    judges = [d["judge_prompt"] for d in dimensions]
    baseline_ready = bool(baseline_block.get("run_name")) and bool(baseline_block.get("metrics"))

    return {
        "schema_version": SCHEMA_VERSION,
        "agent": {
            "name": agent_name,
            "entry_point": entry_point,
        },
        "score_scale": DEFAULT_SCORE_SCALE,
        "dimensions": dimensions,
        "judge_prompts": judges,
        "baseline": baseline_block,
        "status": {
            "dataset_ready": True,
            "judges_ready": bool(judges_ready) if judges_ready is not None else True,
            "baseline_ready": baseline_ready,
        },
    }


def summarize_status(dataset_name: str, agent_name: str) -> Dict[str, Any]:
    dataset, metadata = get_dataset_metadata(dataset_name)
    if not dataset:
        return {
            "dataset": dataset_name,
            "agent": agent_name,
            "exists": False,
            "schema_ok": False,
            "message": f"Dataset '{dataset_name}' does not exist",
        }

    schema_ok = metadata.get("schema_version") == SCHEMA_VERSION
    dimensions = metadata.get("dimensions") if isinstance(metadata.get("dimensions"), list) else []
    judges = metadata.get("judge_prompts") if isinstance(metadata.get("judge_prompts"), list) else []

    missing_prompts = [p for p in judges if not prompt_exists(p)]

    baseline = metadata.get("baseline") if isinstance(metadata.get("baseline"), dict) else {}
    baseline_name = baseline.get("run_name")
    baseline_metrics = baseline.get("metrics") if isinstance(baseline.get("metrics"), dict) else {}

    runs = getattr(dataset, "runs", []) or []
    run_names = {getattr(r, "name", "") for r in runs}
    baseline_run_present = bool(baseline_name and baseline_name in run_names)

    return {
        "dataset": dataset_name,
        "agent": agent_name,
        "exists": True,
        "schema_ok": schema_ok,
        "score_scale": metadata.get("score_scale"),
        "dimensions": dimensions,
        "judges": judges,
        "missing_prompts": missing_prompts,
        "baseline": {
            "run_name": baseline_name,
            "created_at": baseline.get("created_at"),
            "metrics": baseline_metrics,
            "run_present": baseline_run_present,
            "ready": bool(baseline_name and baseline_metrics and baseline_run_present),
        },
        "metadata": metadata,
    }


def yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return json.dumps(str(value))


def to_yaml_lines(value: Any, indent: int = 0) -> List[str]:
    prefix = " " * indent

    if isinstance(value, dict):
        lines: List[str] = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.extend(to_yaml_lines(item, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(item)}")
        return lines

    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                lines.append(f"{prefix}-")
                lines.extend(to_yaml_lines(item, indent + 2))
            else:
                lines.append(f"{prefix}- {yaml_scalar(item)}")
        return lines

    return [f"{prefix}{yaml_scalar(value)}"]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def export_snapshots(agent_name: str, dataset_name: str, snapshot_dir: str) -> Dict[str, Any]:
    dataset, metadata = get_dataset_metadata(dataset_name)
    if not dataset:
        return {"status": "error", "error": f"Dataset '{dataset_name}' not found"}
    if metadata.get("schema_version") != SCHEMA_VERSION:
        return {
            "status": "error",
            "error": f"Dataset '{dataset_name}' has no {SCHEMA_VERSION} metadata",
        }

    ds_dict = as_dict(dataset)
    snapshot = {
        "source": {
            "langfuse": {
                "host": os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
            },
            "dataset": {
                "name": dataset_name,
                "id": getattr(dataset, "id", None) or ds_dict.get("id"),
            },
        },
        "evaluation": {
            "score_scale": metadata.get("score_scale", DEFAULT_SCORE_SCALE),
            "dimensions": metadata.get("dimensions", []),
            "baseline": metadata.get("baseline", {}),
        },
        "generated_at": utc_now(),
        "compat": {
            "legacy_config_path": f".claude/agent-eval/{agent_name}.yaml",
        },
    }

    base = Path(snapshot_dir)
    json_path = base / f"{agent_name}.json"
    yaml_path = base / f"{agent_name}.yaml"

    write_text(json_path, json.dumps(snapshot, indent=2))
    write_text(yaml_path, "\n".join(to_yaml_lines(snapshot)) + "\n")

    legacy = {
        "agent": {"name": agent_name},
        "evaluation": {
            "dataset": dataset_name,
            "score_scale": metadata.get("score_scale", DEFAULT_SCORE_SCALE),
            "dimensions": metadata.get("dimensions", []),
            "baseline": metadata.get("baseline", {}),
        },
        "source_of_truth": "langfuse",
        "generated_at": snapshot["generated_at"],
        "deprecated": True,
    }
    legacy_path = Path(".claude/agent-eval") / f"{agent_name}.yaml"
    write_text(legacy_path, "\n".join(to_yaml_lines(legacy)) + "\n")

    return {
        "status": "exported",
        "json_path": str(json_path),
        "yaml_path": str(yaml_path),
        "legacy_path": str(legacy_path),
    }


def format_assess(result: Dict[str, Any]) -> str:
    lines = ["# Eval Infra Status", ""]
    lines.append(f"**Dataset:** `{result.get('dataset')}`")
    lines.append(f"**Agent:** `{result.get('agent')}`")

    if not result.get("exists"):
        lines.append(f"**Status:** ❌ {result.get('message')}")
        return "\n".join(lines)

    lines.append(f"**Schema:** {'✅' if result.get('schema_ok') else '❌'} ({SCHEMA_VERSION})")
    lines.append(f"**Score Scale:** `{result.get('score_scale', 'n/a')}`")

    dims = result.get("dimensions", [])
    lines.append(f"**Dimensions:** {len(dims)}")
    if dims:
        lines.append("")
        lines.append("| Name | Judge Prompt | Threshold | Weight | Critical |")
        lines.append("|------|--------------|-----------|--------|----------|")
        for d in dims:
            lines.append(
                f"| {d.get('name')} | `{d.get('judge_prompt')}` | {d.get('threshold')} | {d.get('weight')} | {d.get('critical')} |"
            )

    missing = result.get("missing_prompts", [])
    lines.append("")
    lines.append(f"**Judges Ready:** {'✅' if not missing else '❌'}")
    if missing:
        lines.append(f"Missing prompt(s): {', '.join('`'+m+'`' for m in missing)}")

    baseline = result.get("baseline", {})
    lines.append("")
    lines.append(f"**Baseline Run:** `{baseline.get('run_name') or '-'}`")
    lines.append(f"**Baseline Metrics:** {len(baseline.get('metrics') or {})}")
    lines.append(f"**Baseline Ready:** {'✅' if baseline.get('ready') else '❌'}")

    return "\n".join(lines)


def cmd_assess(args: argparse.Namespace) -> int:
    result = summarize_status(args.dataset, args.agent)
    print(format_assess(result))
    return 0


def cmd_bootstrap(args: argparse.Namespace) -> int:
    try:
        raw_dimensions = json.loads(args.dimensions)
        if not isinstance(raw_dimensions, list):
            raise ValueError("dimensions must be a JSON list")
    except Exception as exc:
        print(f"Error: invalid --dimensions JSON: {exc}", file=sys.stderr)
        return 1

    dimensions = normalize_dimensions(raw_dimensions)
    if not dimensions:
        print("Error: at least one valid dimension is required", file=sys.stderr)
        return 1

    base_metadata = build_metadata(
        agent_name=args.agent,
        entry_point=args.entry_point or "",
        dimensions=dimensions,
        baseline=None,
        previous=None,
        judges_ready=False,
    )

    create_result = create_dataset_if_missing(args.dataset, args.description, base_metadata)
    if create_result.get("status") == "error":
        print(f"Error: {create_result.get('error')}", file=sys.stderr)
        return 1

    judges_result = ensure_judge_prompts(dimensions)

    _, existing_metadata = get_dataset_metadata(args.dataset)
    merged_metadata = build_metadata(
        agent_name=args.agent,
        entry_point=args.entry_point or existing_metadata.get("agent", {}).get("entry_point", ""),
        dimensions=dimensions,
        baseline=existing_metadata.get("baseline"),
        previous=existing_metadata,
        judges_ready=judges_result.get("ready"),
    )
    merged_metadata["status"]["dataset_ready"] = True

    update_result = update_dataset_metadata(args.dataset, merged_metadata)

    print("# Eval Infra Bootstrap")
    print("")
    print(f"**Dataset:** `{args.dataset}` ({create_result.get('status')})")
    print(f"**Agent:** `{args.agent}`")
    print(f"**Score Scale:** `{DEFAULT_SCORE_SCALE}`")
    print("")
    print(f"**Judges Created:** {len(judges_result.get('created', []))}")
    print(f"**Judges Existing:** {len(judges_result.get('existing', []))}")
    print(f"**Judges Failed:** {len(judges_result.get('failed', []))}")

    if judges_result.get("failed"):
        for failed in judges_result["failed"]:
            print(f"- ❌ `{failed['prompt']}`: {failed['error']}")

    print("")
    print(f"**Metadata Update:** {update_result.get('status')}")
    if update_result.get("status") != "updated":
        print(f"- {update_result.get('error', 'No details available')}")
        for detail in update_result.get("details", []):
            print(f"- detail: {detail}")

    return 0


def cmd_ensure_judges(args: argparse.Namespace) -> int:
    try:
        raw_dimensions = json.loads(args.dimensions)
        if not isinstance(raw_dimensions, list):
            raise ValueError("dimensions must be a JSON list")
    except Exception as exc:
        print(f"Error: invalid --dimensions JSON: {exc}", file=sys.stderr)
        return 1

    dimensions = normalize_dimensions(raw_dimensions)
    result = ensure_judge_prompts(dimensions)

    print("# Ensure Judges")
    print("")
    print(f"**Dataset:** `{args.dataset}`")
    print(f"**Created:** {len(result.get('created', []))}")
    print(f"**Existing:** {len(result.get('existing', []))}")
    print(f"**Failed:** {len(result.get('failed', []))}")

    for prompt in result.get("created", []):
        print(f"- ✅ created `{prompt}`")
    for prompt in result.get("existing", []):
        print(f"- ℹ️ existing `{prompt}`")
    for failed in result.get("failed", []):
        print(f"- ❌ `{failed['prompt']}`: {failed['error']}")

    return 0


def cmd_baseline(args: argparse.Namespace) -> int:
    status = summarize_status(args.dataset, args.agent)
    if not status.get("exists"):
        print(f"Error: {status.get('message')}", file=sys.stderr)
        return 1

    if args.task_script:
        run_name = args.run_name or f"baseline-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        result = run_experiment(
            dataset_name=args.dataset,
            run_name=run_name,
            task_script=args.task_script,
            evaluator_script=None,
            use_langfuse_judges=True,
            judge_names=None,
            max_concurrency=args.max_concurrency,
            run_description="Baseline evaluation run",
            metadata={"eval_infra": SCHEMA_VERSION, "sample_size_requested": args.sample_size},
        )

        if result.get("status") != "completed":
            print(f"Error running baseline: {result.get('message')}", file=sys.stderr)
            return 1

        _, existing_metadata = get_dataset_metadata(args.dataset)
        patch = {
            "baseline": {
                "run_name": run_name,
                "created_at": utc_now(),
                "metrics": result.get("score_averages", {}),
            },
            "status": {
                "baseline_ready": True,
            },
        }
        update_result = update_dataset_metadata(args.dataset, patch)

        print("# Baseline Run")
        print("")
        print(f"**Dataset:** `{args.dataset}`")
        print(f"**Run Name:** `{run_name}`")
        print(f"**Items:** {result.get('total_items', 0)}")
        print(f"**Score Scale:** `{result.get('score_scale', DEFAULT_SCORE_SCALE)}`")
        print(f"**Metadata Update:** {update_result.get('status')}")

        if args.sample_size:
            print("")
            print("_Note: sample-size is recorded for traceability; full dataset run is currently used by the SDK helper._")

        return 0

    baseline = status.get("baseline", {})
    print("# Baseline Status")
    print("")
    print(f"**Dataset:** `{args.dataset}`")
    print(f"**Run Name:** `{baseline.get('run_name') or '-'}`")
    print(f"**Metrics Count:** {len(baseline.get('metrics') or {})}")
    print(f"**Run Present in Dataset:** {'✅' if baseline.get('run_present') else '❌'}")
    print(f"**Baseline Ready:** {'✅' if baseline.get('ready') else '❌'}")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    result = export_snapshots(args.agent, args.dataset, args.output_dir)
    if result.get("status") != "exported":
        print(f"Error: {result.get('error')}", file=sys.stderr)
        return 1

    print("# Eval Infra Export")
    print("")
    print(f"**JSON:** `{result['json_path']}`")
    print(f"**YAML:** `{result['yaml_path']}`")
    print(f"**Legacy Compat:** `{result['legacy_path']}`")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage Langfuse eval infrastructure")
    sub = parser.add_subparsers(dest="command", required=True)

    assess = sub.add_parser("assess", help="Assess evaluation infrastructure readiness")
    assess.add_argument("--agent", required=True, help="Agent name")
    assess.add_argument("--dataset", required=True, help="Dataset name")

    bootstrap = sub.add_parser("bootstrap", help="Bootstrap dataset + judges + metadata")
    bootstrap.add_argument("--agent", required=True, help="Agent name")
    bootstrap.add_argument("--dataset", required=True, help="Dataset name")
    bootstrap.add_argument("--dimensions", required=True, help="JSON list of dimension objects")
    bootstrap.add_argument("--entry-point", default="", help="Agent invocation/entry point")
    bootstrap.add_argument("--description", default="", help="Dataset description when creating")

    ensure = sub.add_parser("ensure-judges", help="Create missing judge prompts")
    ensure.add_argument("--dataset", required=True, help="Dataset name")
    ensure.add_argument("--dimensions", required=True, help="JSON list of dimension objects")

    baseline = sub.add_parser("baseline", help="Verify or run baseline")
    baseline.add_argument("--agent", required=True, help="Agent name")
    baseline.add_argument("--dataset", required=True, help="Dataset name")
    baseline.add_argument("--task-script", help="Task script path for executing baseline")
    baseline.add_argument("--run-name", help="Optional baseline run name")
    baseline.add_argument("--sample-size", type=int, default=5, help="Requested sample size metadata")
    baseline.add_argument("--max-concurrency", type=int, default=3, help="Experiment concurrency")

    export = sub.add_parser("export", help="Export infra snapshots")
    export.add_argument("--agent", required=True, help="Agent name")
    export.add_argument("--dataset", required=True, help="Dataset name")
    export.add_argument("--output-dir", default=".claude/eval-infra", help="Output directory")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "assess":
        raise SystemExit(cmd_assess(args))
    if args.command == "bootstrap":
        raise SystemExit(cmd_bootstrap(args))
    if args.command == "ensure-judges":
        raise SystemExit(cmd_ensure_judges(args))
    if args.command == "baseline":
        raise SystemExit(cmd_baseline(args))
    if args.command == "export":
        raise SystemExit(cmd_export(args))

    raise SystemExit(1)


if __name__ == "__main__":
    main()
