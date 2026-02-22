#!/usr/bin/env python3
"""
Read and compare baseline/candidate run metrics using normalized 0-1 semantics.
Read-only helper.
"""

import argparse
import json
from typing import Any, Dict, List, Optional

from contract_resolver import _as_dict, normalize_score, normalize_contract, load_snapshot, _resolve_snapshot_path
from contract_resolver import validate_contract_shape
from trace_retriever import retrieve_dataset_run_scores


def _collect_scores_rest(dataset_name: str, run_name: str) -> Dict[str, List[float]]:
    """Aggregate per-item scores from a dataset run via REST API.

    Returns a dict mapping score name -> list of normalized float values.
    """
    result = retrieve_dataset_run_scores(dataset_name, run_name)
    by_name: Dict[str, List[float]] = {}
    for item in result.get("items", []):
        for score in item.get("scores", []):
            name = score.get("name")
            value = score.get("value")
            if not name:
                continue
            if isinstance(value, (int, float)):
                by_name.setdefault(name, []).append(normalize_score(value))
    return by_name


def _mean(values: List[float]) -> Optional[float]:
    if not values:
        return None
    return sum(values) / len(values)


def cmd_compare(args: argparse.Namespace) -> int:
    path = _resolve_snapshot_path(args.agent, args.path)
    raw = load_snapshot(path)
    contract = normalize_contract(raw, args.agent, str(path))

    shape_errors = validate_contract_shape(contract)
    if shape_errors:
        print(json.dumps({"status": "error", "errors": shape_errors}, indent=2))
        return 2

    dataset_name = _as_dict(contract.get("dataset")).get("name")

    baseline_scores = _collect_scores_rest(dataset_name, args.baseline_run)
    candidate_scores = _collect_scores_rest(dataset_name, args.candidate_run)

    if not baseline_scores and not candidate_scores:
        print(
            json.dumps(
                {
                    "status": "error",
                    "error": "no scores found for baseline or candidate run",
                    "baseline_run": args.baseline_run,
                    "candidate_run": args.candidate_run,
                },
                indent=2,
            )
        )
        return 4

    dimensions = contract.get("dimensions") or []
    rows = []

    for dim in dimensions:
        if not isinstance(dim, dict):
            continue
        name = dim.get("name")
        if not name:
            continue
        b_mean = _mean(baseline_scores.get(name, []))
        c_mean = _mean(candidate_scores.get(name, []))
        if b_mean is None and c_mean is None:
            continue
        delta = None
        if b_mean is not None and c_mean is not None:
            delta = c_mean - b_mean

        threshold = normalize_score(dim.get("threshold", 0.0))
        guard_pass = c_mean is None or c_mean >= threshold

        rows.append(
            {
                "dimension": name,
                "baseline_mean": b_mean,
                "candidate_mean": c_mean,
                "delta": delta,
                "threshold": threshold,
                "critical": bool(dim.get("critical", False)),
                "guard_pass": guard_pass,
            }
        )

    payload = {
        "status": "ok",
        "dataset": dataset_name,
        "baseline_run": args.baseline_run,
        "candidate_run": args.candidate_run,
        "score_scale": "0-1",
        "rows": rows,
    }

    print(json.dumps(payload, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read normalized run metrics")
    sub = parser.add_subparsers(dest="command", required=True)

    compare = sub.add_parser("compare", help="Compare baseline and candidate runs")
    compare.add_argument("--agent", required=True, help="Agent name")
    compare.add_argument("--baseline-run", required=True, help="Baseline run name")
    compare.add_argument("--candidate-run", required=True, help="Candidate run name")
    compare.add_argument("--path", help="Explicit contract snapshot path")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "compare":
        raise SystemExit(cmd_compare(args))

    raise SystemExit(1)


if __name__ == "__main__":
    main()
