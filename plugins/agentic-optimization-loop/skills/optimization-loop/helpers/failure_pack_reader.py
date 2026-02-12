#!/usr/bin/env python3
"""
Fetch low-scoring items from a dataset run for diagnosis/trace-pack generation.
Read-only helper.
"""

import argparse
import json
from typing import Any, Dict, List, Optional

from contract_resolver import _as_dict, normalize_score, normalize_contract, load_snapshot, _resolve_snapshot_path
from contract_resolver import validate_contract_shape


def _get_client():
    from contract_resolver import _resolve_langfuse_client

    return _resolve_langfuse_client()


def _find_run(dataset: Any, run_name: str) -> Optional[Any]:
    for run in (getattr(dataset, "runs", []) or []):
        if getattr(run, "name", None) == run_name:
            return run
    return None


def _score_for_dimension(item: Any, dimension_name: str) -> Optional[float]:
    for score in (getattr(item, "scores", []) or []):
        name = getattr(score, "name", None) or _as_dict(score).get("name")
        if name != dimension_name:
            continue
        value = getattr(score, "value", None)
        if value is None:
            value = _as_dict(score).get("value")
        if isinstance(value, (int, float)):
            return normalize_score(value)
    return None


def cmd_failures(args: argparse.Namespace) -> int:
    path = _resolve_snapshot_path(args.agent, args.path)
    raw = load_snapshot(path)
    contract = normalize_contract(raw, args.agent, str(path))

    shape_errors = validate_contract_shape(contract)
    if shape_errors:
        print(json.dumps({"status": "error", "errors": shape_errors}, indent=2))
        return 2

    dimensions = [d for d in (contract.get("dimensions") or []) if isinstance(d, dict)]
    if not dimensions:
        print(json.dumps({"status": "error", "error": "no dimensions in contract"}, indent=2))
        return 3

    dimension = args.dimension or dimensions[0].get("name")
    dim_obj = next((d for d in dimensions if d.get("name") == dimension), None)
    if not dim_obj:
        print(json.dumps({"status": "error", "error": f"unknown dimension: {dimension}"}, indent=2))
        return 4

    threshold = normalize_score(args.threshold) if args.threshold is not None else normalize_score(dim_obj.get("threshold", 0.8))

    dataset_name = _as_dict(contract.get("dataset")).get("name")
    client = _get_client()
    dataset = client.get_dataset(dataset_name)
    if not dataset:
        print(json.dumps({"status": "error", "error": f"dataset not found: {dataset_name}"}, indent=2))
        return 5

    run = _find_run(dataset, args.run_name)
    if not run:
        print(json.dumps({"status": "error", "error": f"run not found: {args.run_name}"}, indent=2))
        return 6

    failures: List[Dict[str, Any]] = []

    for item in (getattr(run, "items", []) or []):
        score = _score_for_dimension(item, dimension)
        if score is None or score >= threshold:
            continue

        item_dict = _as_dict(item)
        metadata = item_dict.get("metadata") or {}

        if args.slice_key and args.slice_value is not None:
            if str(metadata.get(args.slice_key)) != str(args.slice_value):
                continue

        failures.append(
            {
                "item_id": getattr(item, "id", None) or item_dict.get("id"),
                "trace_id": getattr(item, "trace_id", None) or item_dict.get("trace_id") or metadata.get("trace_id"),
                "dimension": dimension,
                "score": score,
                "threshold": threshold,
                "metadata": metadata,
            }
        )

    failures.sort(key=lambda x: x.get("score", 1.0))
    failures = failures[: args.top]

    payload = {
        "status": "ok",
        "dataset": dataset_name,
        "run_name": args.run_name,
        "dimension": dimension,
        "threshold": threshold,
        "count": len(failures),
        "failures": failures,
    }

    print(json.dumps(payload, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read failure packs from dataset runs")
    sub = parser.add_subparsers(dest="command", required=True)

    failures = sub.add_parser("failures", help="List low-scoring items for diagnosis")
    failures.add_argument("--agent", required=True, help="Agent name")
    failures.add_argument("--run-name", required=True, help="Dataset run name")
    failures.add_argument("--dimension", help="Dimension name (defaults to first contract dimension)")
    failures.add_argument("--threshold", type=float, help="Override threshold in canonical 0-1 terms")
    failures.add_argument("--slice-key", help="Optional metadata key filter")
    failures.add_argument("--slice-value", help="Optional metadata value filter")
    failures.add_argument("--top", type=int, default=20, help="Max failure items to return")
    failures.add_argument("--path", help="Explicit contract snapshot path")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "failures":
        raise SystemExit(cmd_failures(args))

    raise SystemExit(1)


if __name__ == "__main__":
    main()
