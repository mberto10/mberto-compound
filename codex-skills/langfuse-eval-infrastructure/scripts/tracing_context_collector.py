#!/usr/bin/env python3
"""
Tracing Context Collector

Scans a codebase for Langfuse instrumentation and evaluation-related signals.
Produces a compact JSON artifact for interview-driven eval-infra initialization.
"""

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Set


SEARCH_GROUPS = {
    "langfuse_usage": r"langfuse|Langfuse",
    "instrumentation": r"trace_id|trace\(|span\(|generation|observe|observation|instrument",
    "evaluation": r"grader|judge|metric|score|threshold|baseline|eval[_-]?infra|dataset[_-]?run",
    "dataset_signals": r"dataset|expected_output|ground_truth|failure|slice|metadata",
}


def run_rg(root: Path, pattern: str, max_hits: int) -> List[Dict[str, Any]]:
    cmd = [
        "rg",
        "-n",
        "--no-heading",
        "--hidden",
        "--glob",
        "!.git",
        "--glob",
        "!node_modules",
        "--glob",
        "!.venv",
        "--glob",
        "!dist",
        "--glob",
        "!build",
        pattern,
        str(root),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode not in (0, 1):
        return []

    hits: List[Dict[str, Any]] = []
    for line in proc.stdout.splitlines():
        parts = line.split(":", 2)
        if len(parts) != 3:
            continue
        file_path, line_no, snippet = parts
        try:
            line_int = int(line_no)
        except ValueError:
            continue
        hits.append(
            {
                "file": file_path,
                "line": line_int,
                "snippet": snippet.strip(),
            }
        )
        if len(hits) >= max_hits:
            break
    return hits


def unique_files(hits: List[Dict[str, Any]]) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for h in hits:
        f = h.get("file")
        if isinstance(f, str) and f not in seen:
            seen.add(f)
            ordered.append(f)
    return ordered


def extract_score_names(hits: List[Dict[str, Any]]) -> List[str]:
    names: Set[str] = set()
    score_patterns = [
        re.compile(r"score[_-]?name\s*[:=]\s*['\"]([^'\"]+)['\"]"),
        re.compile(r"name\s*[:=]\s*['\"]([^'\"]+)['\"]"),
    ]
    for h in hits:
        snippet = h.get("snippet", "")
        if not isinstance(snippet, str):
            continue
        if "score" not in snippet.lower() and "metric" not in snippet.lower():
            continue
        for pat in score_patterns:
            match = pat.search(snippet)
            if match:
                names.add(match.group(1).strip())
    return sorted(names)


def extract_metadata_keys(hits: List[Dict[str, Any]]) -> List[str]:
    keys: Set[str] = set()
    patterns = [
        re.compile(r"metadata\[['\"]([^'\"]+)['\"]\]"),
        re.compile(r"metadata\.get\(['\"]([^'\"]+)['\"]"),
        re.compile(r"['\"]metadata['\"]\s*:\s*\{"),
    ]
    for h in hits:
        snippet = h.get("snippet", "")
        if not isinstance(snippet, str):
            continue
        for pat in patterns:
            match = pat.search(snippet)
            if match and match.groups():
                keys.add(match.group(1).strip())
    return sorted(keys)


def rank_entry_points(agent: str, files: List[str]) -> List[str]:
    scored: List[tuple[int, str]] = []
    agent_l = agent.lower()
    for f in files:
        p = f.lower()
        score = 0
        if agent_l and agent_l in p:
            score += 3
        if "agent" in p:
            score += 2
        if "main" in p or "entry" in p or "runner" in p:
            score += 1
        if score > 0:
            scored.append((score, f))
    scored.sort(key=lambda x: (-x[0], x[1]))
    return [f for _, f in scored[:10]]


def build_summary(agent: str, root: Path, max_hits: int) -> Dict[str, Any]:
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    all_hits: List[Dict[str, Any]] = []

    for key, pattern in SEARCH_GROUPS.items():
        hits = run_rg(root=root, pattern=pattern, max_hits=max_hits)
        grouped[key] = hits
        all_hits.extend(hits)

    files = unique_files(all_hits)
    score_names = extract_score_names(grouped.get("evaluation", []))
    metadata_keys = extract_metadata_keys(grouped.get("dataset_signals", []))
    entry_points = rank_entry_points(agent=agent, files=files)

    return {
        "agent": agent,
        "root": str(root.resolve()),
        "summary": {
            "total_hit_files": len(files),
            "entry_point_candidates": entry_points,
            "score_name_candidates": score_names,
            "metadata_key_candidates": metadata_keys,
        },
        "hits": grouped,
    }


def cmd_scan(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    if not root.exists():
        print(json.dumps({"status": "error", "error": f"root not found: {root}"}, indent=2))
        return 2

    payload = build_summary(agent=args.agent, root=root, max_hits=args.max_hits)
    payload["status"] = "ok"

    out_path = None
    if args.out:
        out_path = Path(args.out)
    else:
        out_path = Path(".claude/eval-infra") / f"{args.agent}-tracing-context.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(
        json.dumps(
            {
                "status": "ok",
                "agent": args.agent,
                "output": str(out_path),
                "entry_point_candidates": payload["summary"]["entry_point_candidates"],
                "score_name_candidates": payload["summary"]["score_name_candidates"],
                "metadata_key_candidates": payload["summary"]["metadata_key_candidates"],
            },
            indent=2,
        )
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Collect tracing/eval context from codebase")
    sub = parser.add_subparsers(dest="command", required=True)

    scan = sub.add_parser("scan", help="Scan repository for Langfuse tracing/eval context")
    scan.add_argument("--agent", required=True, help="Agent name")
    scan.add_argument("--root", default=".", help="Repository root to scan")
    scan.add_argument("--max-hits", type=int, default=80, help="Max hits per search group")
    scan.add_argument("--out", help="Optional output JSON path")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "scan":
        raise SystemExit(cmd_scan(args))
    raise SystemExit(1)


if __name__ == "__main__":
    main()

