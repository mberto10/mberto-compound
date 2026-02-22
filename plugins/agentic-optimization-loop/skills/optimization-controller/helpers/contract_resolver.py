#!/usr/bin/env python3
"""
Resolve and validate optimization eval contracts.

Primary contract source is local snapshot from .claude/eval-infra/<agent>.yaml|json,
with optional live validation against Langfuse identifiers.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


def _load_yaml(text: str) -> Dict[str, Any]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError("PyYAML is required for YAML contracts. Install with: pip install pyyaml") from exc

    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise ValueError("YAML contract must be an object")
    return data


def _dump_yaml(data: Dict[str, Any]) -> str:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError("PyYAML is required for YAML output. Install with: pip install pyyaml") from exc

    return yaml.safe_dump(data, sort_keys=False)


def _as_dict(obj: Any) -> Dict[str, Any]:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    try:
        return dict(obj)
    except Exception:
        return {}


def normalize_score(value: Any) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 0.0
    if v < 0:
        return 0.0
    if v <= 1.0:
        return v
    if v <= 10.0:
        return v / 10.0
    return 1.0


def _resolve_snapshot_path(agent: str, explicit_path: Optional[str]) -> Path:
    if explicit_path:
        path = Path(explicit_path)
        if not path.exists():
            raise FileNotFoundError(f"CONTRACT_NOT_FOUND: {path}")
        return path

    yaml_path = Path(".claude/eval-infra") / f"{agent}.yaml"
    json_path = Path(".claude/eval-infra") / f"{agent}.json"

    if yaml_path.exists():
        return yaml_path
    if json_path.exists():
        return json_path

    raise FileNotFoundError(
        f"CONTRACT_NOT_FOUND: missing {yaml_path} and {json_path}"
    )


def load_snapshot(path: Path) -> Dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        data = json.loads(raw)
    else:
        data = _load_yaml(raw)

    if not isinstance(data, dict):
        raise ValueError("CONTRACT_PARSE_ERROR: contract root must be an object")
    return data


def normalize_contract(raw: Dict[str, Any], agent: str, source_path: str) -> Dict[str, Any]:
    """
    Normalize either of:
    1) eval snapshot schema (source/evaluation/compat)
    2) eval metadata schema (eval_infra_v1)
    """
    if "evaluation" in raw and "source" in raw:
        dataset = (_as_dict(raw.get("source")).get("dataset") or {})
        evaluation = _as_dict(raw.get("evaluation"))
        normalized = {
            "schema_version": "eval_contract_v1",
            "agent": agent,
            "source_path": source_path,
            "dataset": {
                "name": _as_dict(dataset).get("name"),
                "id": _as_dict(dataset).get("id"),
            },
            "score_scale": evaluation.get("score_scale"),
            "dimensions": evaluation.get("dimensions") or [],
            "baseline": evaluation.get("baseline") or {},
            "judge_prompts": [
                d.get("judge_prompt")
                for d in (evaluation.get("dimensions") or [])
                if isinstance(d, dict) and d.get("judge_prompt")
            ],
        }
        return normalized

    if raw.get("schema_version") == "eval_infra_v1":
        normalized = {
            "schema_version": "eval_infra_v1",
            "agent": _as_dict(raw.get("agent")).get("name") or agent,
            "source_path": source_path,
            "dataset": {
                "name": raw.get("dataset_name") or raw.get("dataset") or None,
                "id": raw.get("dataset_id") or None,
            },
            "source": raw.get("source") or {},
            "judges_external": raw.get("judges_external", False),
            "score_scale": raw.get("score_scale"),
            "dimensions": raw.get("dimensions") or [],
            "baseline": raw.get("baseline") or {},
            "judge_prompts": raw.get("judge_prompts") or [],
            "status": raw.get("status") or {},
        }
        return normalized

    raise ValueError("CONTRACT_INVALID: unsupported contract shape")


def validate_contract_shape(contract: Dict[str, Any]) -> List[str]:
    errors: List[str] = []

    dataset = _as_dict(contract.get("dataset"))
    source = _as_dict(contract.get("source"))
    is_live = source.get("type") == "live"
    is_dataset_required = not is_live

    if is_dataset_required and not dataset.get("name"):
        errors.append("dataset.name is required")

    score_scale = contract.get("score_scale")
    if score_scale != "0-1":
        errors.append("score_scale must be '0-1'")

    dimensions = contract.get("dimensions")
    if not isinstance(dimensions, list) or not dimensions:
        errors.append("dimensions must be a non-empty list")
    else:
        for idx, dim in enumerate(dimensions):
            if not isinstance(dim, dict):
                errors.append(f"dimensions[{idx}] must be object")
                continue
            if not dim.get("name"):
                errors.append(f"dimensions[{idx}].name is required")
            threshold = dim.get("threshold")
            if threshold is None:
                errors.append(f"dimensions[{idx}].threshold is required")
            else:
                n = normalize_score(threshold)
                if n < 0 or n > 1:
                    errors.append(f"dimensions[{idx}].threshold must normalize to [0,1]")

    baseline = _as_dict(contract.get("baseline"))
    status = _as_dict(contract.get("status"))
    
    # In live mode, baseline might not be ready yet
    if not is_live:
        if not baseline.get("run_name"):
            errors.append("baseline.run_name is required")
        if not isinstance(baseline.get("metrics"), dict):
            errors.append("baseline.metrics must be an object")

    return errors


def _fetch_dataset_run_names(dataset_name: str) -> Set[str]:
    """Fetch run names for a dataset via REST API.

    The Langfuse Python SDK does not populate dataset.runs, so we call
    GET /api/public/datasets/{name}/runs directly.
    """
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")

    if not public_key or not secret_key:
        return set()

    try:
        import urllib.request
        import base64

        credentials = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()
        url = f"{host.rstrip('/')}/api/public/datasets/{dataset_name}/runs"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return {r.get("name") for r in data.get("data", []) if r.get("name")}
    except Exception:
        return set()


def _resolve_langfuse_client():
    helper_dir = Path(__file__).resolve().parent
    sys.path.insert(0, str(helper_dir))
    from langfuse_client import get_langfuse_client  # type: ignore

    return get_langfuse_client()


def validate_live(contract: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    client = _resolve_langfuse_client()

    source = _as_dict(contract.get("source"))
    if source.get("type") == "live":
        # Skip dataset validation in live mode
        pass
    else:
        dataset_name = _as_dict(contract.get("dataset")).get("name")
        expected_dataset_id = _as_dict(contract.get("dataset")).get("id")

        try:
            dataset = client.get_dataset(dataset_name)
        except Exception as exc:
            return [f"could not fetch dataset '{dataset_name}': {exc}"]

        if not dataset:
            return [f"dataset '{dataset_name}' not found"]

        dataset_dict = _as_dict(dataset)
        actual_dataset_id = getattr(dataset, "id", None) or dataset_dict.get("id")
        if expected_dataset_id and actual_dataset_id and expected_dataset_id != actual_dataset_id:
            errors.append(
                f"dataset id mismatch: expected {expected_dataset_id}, got {actual_dataset_id}"
            )
        
        # Verify baseline exists in dataset via REST API
        # (SDK does not populate dataset.runs — see FAZ-204)
        baseline_name = _as_dict(contract.get("baseline")).get("run_name")
        if baseline_name:
            run_names = _fetch_dataset_run_names(dataset_name)
            if run_names and baseline_name not in run_names:
                errors.append(f"baseline run not found in dataset runs: {baseline_name}")
            elif not run_names:
                pass  # Could not fetch runs; skip check rather than false-negative

    # judge prompt checks
    if not contract.get("judges_external"):
        prompts = contract.get("judge_prompts") or []
        for name in prompts:
            try:
                prompt = client.get_prompt(name, label="production")
                if not prompt:
                    errors.append(f"judge prompt not found: {name}")
            except Exception as exc:
                errors.append(f"judge prompt check failed for {name}: {exc}")

    return errors


def cmd_resolve(args: argparse.Namespace) -> int:
    try:
        path = _resolve_snapshot_path(args.agent, args.path)
        raw = load_snapshot(path)
        contract = normalize_contract(raw, args.agent, str(path))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2

    shape_errors = validate_contract_shape(contract)
    if shape_errors:
        payload = {
            "status": "error",
            "error_code": "CONTRACT_INVALID",
            "errors": shape_errors,
            "remediation": [
                "/agent-eval-infra status --agent <agent> --dataset <dataset>",
                "/agent-eval-setup --agent <agent>",
            ],
        }
        print(json.dumps(payload, indent=2))
        return 3

    if args.validate_live:
        try:
            live_errors = validate_live(contract)
        except Exception as exc:
            payload = {
                "status": "error",
                "error_code": "CONTRACT_LIVE_VALIDATION_FAILED",
                "errors": [str(exc)],
            }
            print(json.dumps(payload, indent=2))
            return 4

        if live_errors:
            payload = {
                "status": "error",
                "error_code": "CONTRACT_LIVE_VALIDATION_FAILED",
                "errors": live_errors,
            }
            print(json.dumps(payload, indent=2))
            return 4

    output = {
        "status": "ok",
        "contract": contract,
    }

    if args.format == "yaml":
        print(_dump_yaml(output))
    else:
        print(json.dumps(output, indent=2))

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Resolve optimization eval contracts")
    sub = parser.add_subparsers(dest="command", required=True)

    resolve = sub.add_parser("resolve", help="Resolve and validate contract")
    resolve.add_argument("--agent", required=True, help="Agent name")
    resolve.add_argument("--path", help="Explicit contract path")
    resolve.add_argument("--validate-live", action="store_true", help="Validate identifiers in Langfuse")
    resolve.add_argument("--format", choices=["json", "yaml"], default="json")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "resolve":
        raise SystemExit(cmd_resolve(args))

    raise SystemExit(1)


if __name__ == "__main__":
    main()
