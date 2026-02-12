#!/usr/bin/env python3
"""
Langfuse Dataset Manager

CLI tool for creating and managing Langfuse datasets from production traces.
Used in optimization workflows to curate regression test sets.

COMMANDS:
    create      Create a new dataset
    add-trace   Add a single trace to a dataset
    add-batch   Add multiple traces from a file
    list        List all datasets
    get         Get items from a dataset
    set-metadata Update dataset metadata (idempotent merge by default)
    describe    Get dataset details including metadata contract fields

EXAMPLES:
    python dataset_manager.py create --name "checkout_regressions" --description "Failing traces"
    python dataset_manager.py add-trace --dataset "checkout_regressions" --trace-id abc123 --expected-score 9.0
    python dataset_manager.py list
    python dataset_manager.py get --name "checkout_regressions"
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add parent directory to path for langfuse_client import
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "data-retrieval" / "helpers"))
from langfuse_client import get_langfuse_client


# =============================================================================
# DATASET OPERATIONS
# =============================================================================

def create_dataset(
    name: str,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new Langfuse dataset.

    Args:
        name: Dataset name (recommend: {project}_{purpose} e.g., checkout_regressions)
        description: Human-readable description
        metadata: Additional metadata dict

    Returns:
        Created dataset info
    """
    client = get_langfuse_client()

    try:
        dataset = client.create_dataset(
            name=name,
            description=description,
            metadata=metadata or {}
        )
        return {
            "id": dataset.id if hasattr(dataset, "id") else None,
            "name": name,
            "description": description,
            "metadata": metadata,
            "status": "created"
        }
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg.lower() or "409" in error_msg:
            return {"error": f"Dataset '{name}' already exists", "status": "exists"}
        raise


def get_trace_input(trace_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch trace and extract input data for dataset item.

    Returns the trace input merged with metadata. All fields from the original
    trace are preserved for maximum flexibility.
    """
    client = get_langfuse_client()

    try:
        trace = client.api.trace.get(trace_id)
        if not trace:
            return None

        trace_dict = trace.dict() if hasattr(trace, "dict") else dict(trace)

        # Get trace input and metadata
        trace_input = trace_dict.get("input") or {}
        metadata = trace_dict.get("metadata") or {}

        # Merge metadata into input (trace_input takes precedence)
        item_input = {**metadata, **trace_input}

        # Store original for reference if there was input
        if trace_input:
            item_input["_original_input"] = trace_input

        return item_input

    except Exception as e:
        print(f"Warning: Could not fetch trace {trace_id}: {e}", file=sys.stderr)
        return None


def get_trace_score(trace_id: str, score_name: str = "quality_score") -> Optional[float]:
    """Get a specific score value for a trace."""
    client = get_langfuse_client()
    try:
        response = client.api.scores.get_many(trace_id=trace_id)
        if hasattr(response, "data") and response.data:
            for score in response.data:
                score_dict = score.dict() if hasattr(score, "dict") else dict(score)
                if score_dict.get("name") == score_name:
                    return score_dict.get("value")
        return None
    except Exception:
        return None


def add_trace_to_dataset(
    dataset_name: str,
    trace_id: str,
    expected_score: Optional[float] = None,
    expected_output: Optional[Dict[str, Any]] = None,
    failure_reason: Optional[str] = None
) -> Dict[str, Any]:
    """
    Add a trace to a dataset as a dataset item.

    Args:
        dataset_name: Target dataset name
        trace_id: Source trace ID
        expected_score: Convenience arg for min_score in expected output
        expected_output: Custom expected output dict (overrides expected_score)
        failure_reason: Optional reason why this trace was added (for regressions)

    Returns:
        Result dict with status
    """
    client = get_langfuse_client()

    # Get trace input
    trace_input = get_trace_input(trace_id)
    if trace_input is None:
        return {
            "trace_id": trace_id,
            "status": "error",
            "error": "Could not fetch trace input"
        }

    # Get original score for metadata
    original_score = get_trace_score(trace_id)

    # Build expected output
    final_expected_output = expected_output or {}
    if expected_score is not None and "min_score" not in final_expected_output:
        final_expected_output["min_score"] = expected_score

    # Build metadata
    item_metadata = {
        "source_trace_id": trace_id,
        "added_date": datetime.now().strftime("%Y-%m-%d"),
    }
    if original_score is not None:
        item_metadata["original_score"] = original_score
    if failure_reason:
        item_metadata["failure_reason"] = failure_reason

    try:
        item = client.create_dataset_item(
            dataset_name=dataset_name,
            input=trace_input,
            expected_output=final_expected_output,
            source_trace_id=trace_id,
            metadata=item_metadata
        )

        return {
            "trace_id": trace_id,
            "dataset": dataset_name,
            "item_id": item.id if hasattr(item, "id") else None,
            "status": "added",
            "input_fields": [k for k in trace_input.keys() if not k.startswith("_")],
            "original_score": original_score
        }
    except Exception as e:
        return {
            "trace_id": trace_id,
            "status": "error",
            "error": str(e)
        }


def add_batch_from_file(
    dataset_name: str,
    trace_file: str,
    expected_score: Optional[float] = None,
    expected_output: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Add multiple traces from a file (one trace ID per line).

    Returns summary of added/failed items.
    """
    try:
        with open(trace_file, "r") as f:
            trace_ids = [line.strip() for line in f if line.strip()]
    except Exception as e:
        return {"error": f"Could not read file {trace_file}: {e}"}

    if not trace_ids:
        return {"error": "No trace IDs found in file"}

    results = {
        "dataset": dataset_name,
        "total": len(trace_ids),
        "added": 0,
        "failed": 0,
        "items": []
    }

    for trace_id in trace_ids:
        result = add_trace_to_dataset(
            dataset_name=dataset_name,
            trace_id=trace_id,
            expected_score=expected_score,
            expected_output=expected_output
        )
        results["items"].append(result)
        if result.get("status") == "added":
            results["added"] += 1
        else:
            results["failed"] += 1

    return results


def list_datasets() -> List[Dict[str, Any]]:
    """List all datasets in the Langfuse project."""
    client = get_langfuse_client()

    datasets = []
    page = 1

    while True:
        try:
            response = client.api.datasets.list(limit=50, page=page)
            if not hasattr(response, "data") or not response.data:
                break

            for ds in response.data:
                ds_dict = ds.dict() if hasattr(ds, "dict") else dict(ds)
                datasets.append({
                    "name": ds_dict.get("name"),
                    "description": ds_dict.get("description"),
                    "item_count": ds_dict.get("items_count", 0),
                    "created_at": ds_dict.get("created_at"),
                    "metadata": ds_dict.get("metadata")
                })

            if len(response.data) < 50:
                break
            page += 1

        except Exception as e:
            print(f"Error listing datasets: {e}", file=sys.stderr)
            break

    return datasets


def get_dataset_items(name: str) -> Dict[str, Any]:
    """Get all items from a dataset."""
    client = get_langfuse_client()

    try:
        dataset = client.get_dataset(name)
        if not dataset:
            return {"error": f"Dataset '{name}' not found"}

        items = []
        for item in dataset.items:
            item_dict = item.dict() if hasattr(item, "dict") else dict(item)
            items.append({
                "id": item_dict.get("id"),
                "input": item_dict.get("input"),
                "expected_output": item_dict.get("expected_output"),
                "metadata": item_dict.get("metadata"),
                "status": item_dict.get("status")
            })

        return {
            "name": name,
            "item_count": len(items),
            "items": items
        }

    except Exception as e:
        return {"error": f"Could not get dataset '{name}': {e}"}


def deep_merge(base: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge dictionaries recursively."""
    merged = dict(base)
    for key, value in patch.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def set_dataset_metadata(
    name: str,
    metadata: Dict[str, Any],
    merge: bool = True
) -> Dict[str, Any]:
    """
    Update dataset metadata.

    If merge=True (default), merges patch into existing metadata.
    If merge=False, replaces metadata.
    """
    client = get_langfuse_client()

    try:
        dataset = client.get_dataset(name)
        if not dataset:
            return {"error": f"Dataset '{name}' not found", "status": "error"}

        dataset_dict = dataset.dict() if hasattr(dataset, "dict") else dict(dataset)
        existing = dataset_dict.get("metadata") or {}
        final_metadata = deep_merge(existing, metadata) if merge else metadata
        dataset_id = dataset_dict.get("id") or getattr(dataset, "id", None)

        errors: List[str] = []

        if hasattr(client, "api") and hasattr(client.api, "datasets"):
            datasets_api = client.api.datasets
            if hasattr(datasets_api, "update"):
                for call in (
                    lambda: datasets_api.update(dataset_id, metadata=final_metadata),
                    lambda: datasets_api.update(id=dataset_id, metadata=final_metadata),
                    lambda: datasets_api.update(name=name, metadata=final_metadata),
                ):
                    try:
                        call()
                        return {
                            "status": "updated",
                            "name": name,
                            "metadata": final_metadata,
                            "merge": merge,
                        }
                    except Exception as exc:
                        errors.append(str(exc))
            if hasattr(datasets_api, "patch"):
                for call in (
                    lambda: datasets_api.patch(dataset_id, metadata=final_metadata),
                    lambda: datasets_api.patch(id=dataset_id, metadata=final_metadata),
                ):
                    try:
                        call()
                        return {
                            "status": "updated",
                            "name": name,
                            "metadata": final_metadata,
                            "merge": merge,
                        }
                    except Exception as exc:
                        errors.append(str(exc))

        if hasattr(dataset, "update"):
            try:
                dataset.update(metadata=final_metadata)
                return {
                    "status": "updated",
                    "name": name,
                    "metadata": final_metadata,
                    "merge": merge,
                }
            except Exception as exc:
                errors.append(str(exc))

        return {
            "status": "warning",
            "name": name,
            "metadata": final_metadata,
            "merge": merge,
            "error": "Could not update metadata with available SDK methods. Update manually in Langfuse UI.",
            "details": errors[:3],
        }
    except Exception as e:
        return {"error": f"Could not update metadata for '{name}': {e}", "status": "error"}


def describe_dataset(name: str) -> Dict[str, Any]:
    """Get detailed dataset information including metadata and readiness hints."""
    client = get_langfuse_client()

    try:
        dataset = client.get_dataset(name)
        if not dataset:
            return {"error": f"Dataset '{name}' not found"}

        dataset_dict = dataset.dict() if hasattr(dataset, "dict") else dict(dataset)
        metadata = dataset_dict.get("metadata") or {}
        status = metadata.get("status") if isinstance(metadata.get("status"), dict) else {}
        dimensions = metadata.get("dimensions") if isinstance(metadata.get("dimensions"), list) else []
        baseline = metadata.get("baseline") if isinstance(metadata.get("baseline"), dict) else {}

        return {
            "name": name,
            "id": dataset_dict.get("id"),
            "description": dataset_dict.get("description"),
            "item_count": dataset_dict.get("items_count"),
            "schema_version": metadata.get("schema_version"),
            "score_scale": metadata.get("score_scale"),
            "dimensions": dimensions,
            "judge_prompts": metadata.get("judge_prompts", []),
            "baseline": baseline,
            "status": status,
            "metadata": metadata,
        }
    except Exception as e:
        return {"error": f"Could not describe dataset '{name}': {e}"}


# =============================================================================
# OUTPUT FORMATTING
# =============================================================================

def format_create_result(result: Dict[str, Any]) -> str:
    """Format dataset creation result as markdown."""
    lines = ["# Dataset Created", ""]

    if "error" in result:
        lines.append(f"**Status:** {result.get('status', 'error')}")
        lines.append(f"**Error:** {result['error']}")
    else:
        lines.append(f"**Name:** `{result.get('name')}`")
        if result.get("description"):
            lines.append(f"**Description:** {result['description']}")
        if result.get("metadata"):
            lines.append(f"**Metadata:** `{json.dumps(result['metadata'])}`")
        lines.append(f"**Status:** {result.get('status', 'created')}")

    return "\n".join(lines)


def format_add_result(result: Dict[str, Any]) -> str:
    """Format add-trace result as markdown."""
    lines = ["# Trace Added to Dataset", ""]

    if result.get("status") == "error":
        lines.append(f"**Trace ID:** `{result.get('trace_id')}`")
        lines.append(f"**Status:** error")
        lines.append(f"**Error:** {result.get('error')}")
    else:
        lines.append(f"**Trace ID:** `{result.get('trace_id')}`")
        lines.append(f"**Dataset:** `{result.get('dataset')}`")
        lines.append(f"**Item ID:** `{result.get('item_id')}`")
        lines.append(f"**Status:** {result.get('status')}")
        if result.get("original_score") is not None:
            lines.append(f"**Original Score:** {result['original_score']:.1f}")
        if result.get("input_fields"):
            lines.append(f"**Input Fields:** {', '.join(result['input_fields'])}")

    return "\n".join(lines)


def format_batch_result(result: Dict[str, Any]) -> str:
    """Format batch add result as markdown."""
    lines = ["# Batch Add Results", ""]

    if "error" in result:
        lines.append(f"**Error:** {result['error']}")
        return "\n".join(lines)

    lines.append(f"**Dataset:** `{result.get('dataset')}`")
    lines.append(f"**Total:** {result.get('total', 0)}")
    lines.append(f"**Added:** {result.get('added', 0)}")
    lines.append(f"**Failed:** {result.get('failed', 0)}")
    lines.append("")

    if result.get("items"):
        lines.append("## Item Results")
        lines.append("")
        lines.append("| Trace ID | Status | Score |")
        lines.append("|----------|--------|-------|")

        for item in result["items"]:
            trace_id = item.get("trace_id", "")[:12] + "..."
            status = "✅" if item.get("status") == "added" else "❌"
            score = item.get("original_score")
            score_str = f"{score:.1f}" if score is not None else "-"
            lines.append(f"| `{trace_id}` | {status} | {score_str} |")

    return "\n".join(lines)


def format_list_result(datasets: List[Dict[str, Any]]) -> str:
    """Format dataset list as markdown."""
    lines = ["# Langfuse Datasets", ""]

    if not datasets:
        lines.append("_No datasets found_")
        return "\n".join(lines)

    lines.append(f"**Total:** {len(datasets)}")
    lines.append("")
    lines.append("| Name | Description | Items |")
    lines.append("|------|-------------|-------|")

    for ds in datasets:
        name = ds.get("name", "")
        desc = (ds.get("description") or "")[:40]
        if len(ds.get("description") or "") > 40:
            desc += "..."
        count = ds.get("item_count", 0)
        lines.append(f"| `{name}` | {desc} | {count} |")

    return "\n".join(lines)


def format_get_result(result: Dict[str, Any]) -> str:
    """Format dataset items as markdown."""
    lines = ["# Dataset Items", ""]

    if "error" in result:
        lines.append(f"**Error:** {result['error']}")
        return "\n".join(lines)

    lines.append(f"**Dataset:** `{result.get('name')}`")
    lines.append(f"**Items:** {result.get('item_count', 0)}")
    lines.append("")

    items = result.get("items", [])
    if not items:
        lines.append("_No items in dataset_")
        return "\n".join(lines)

    for i, item in enumerate(items, 1):
        lines.append(f"## Item {i}")
        lines.append("")

        # Input summary - show first few non-internal fields
        input_data = item.get("input", {})
        display_fields = {k: v for k, v in input_data.items() if not k.startswith("_")}

        # Show up to 5 key fields
        for key, value in list(display_fields.items())[:5]:
            if isinstance(value, str) and len(value) > 60:
                value = value[:60] + "..."
            elif isinstance(value, dict):
                value = f"{{...}} ({len(value)} keys)"
            elif isinstance(value, list):
                value = f"[...] ({len(value)} items)"
            lines.append(f"**{key}:** {value}")

        if len(display_fields) > 5:
            lines.append(f"_...and {len(display_fields) - 5} more fields_")

        # Expected output
        expected = item.get("expected_output", {})
        if expected:
            exp_str = ", ".join(f"{k}={v}" for k, v in expected.items())
            lines.append(f"**Expected:** {exp_str}")

        # Metadata
        metadata = item.get("metadata", {})
        source_trace = metadata.get("source_trace_id", "")
        if source_trace:
            lines.append(f"**Source Trace:** `{source_trace[:20]}...`")

        original_score = metadata.get("original_score")
        if original_score is not None:
            lines.append(f"**Original Score:** {original_score:.1f}")

        lines.append("")

    return "\n".join(lines)


def format_set_metadata_result(result: Dict[str, Any]) -> str:
    """Format set-metadata result as markdown."""
    lines = ["# Dataset Metadata Update", ""]

    status = result.get("status", "error")
    lines.append(f"**Dataset:** `{result.get('name', '-')}`")
    lines.append(f"**Status:** {status}")
    lines.append(f"**Merge Mode:** {result.get('merge', True)}")

    if result.get("error"):
        lines.append(f"**Error:** {result['error']}")
    for detail in result.get("details", []):
        lines.append(f"- detail: {detail}")

    if result.get("metadata"):
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(result["metadata"], indent=2))
        lines.append("```")

    return "\n".join(lines)


def format_describe_result(result: Dict[str, Any]) -> str:
    """Format dataset description as markdown."""
    lines = ["# Dataset Description", ""]

    if "error" in result:
        lines.append(f"**Error:** {result['error']}")
        return "\n".join(lines)

    lines.append(f"**Name:** `{result.get('name')}`")
    if result.get("id"):
        lines.append(f"**ID:** `{result['id']}`")
    if result.get("description"):
        lines.append(f"**Description:** {result['description']}")
    lines.append(f"**Items:** {result.get('item_count', 0)}")
    lines.append(f"**Schema Version:** `{result.get('schema_version', '-')}`")
    lines.append(f"**Score Scale:** `{result.get('score_scale', '-')}`")
    lines.append(f"**Dimensions:** {len(result.get('dimensions') or [])}")
    lines.append(f"**Judge Prompts:** {len(result.get('judge_prompts') or [])}")

    status = result.get("status") or {}
    if status:
        lines.append("")
        lines.append("## Readiness")
        lines.append(f"- dataset_ready: {status.get('dataset_ready')}")
        lines.append(f"- judges_ready: {status.get('judges_ready')}")
        lines.append(f"- baseline_ready: {status.get('baseline_ready')}")

    baseline = result.get("baseline") or {}
    if baseline:
        lines.append("")
        lines.append("## Baseline")
        lines.append(f"- run_name: `{baseline.get('run_name', '-')}`")
        lines.append(f"- created_at: `{baseline.get('created_at', '-')}`")
        metrics = baseline.get("metrics") if isinstance(baseline.get("metrics"), dict) else {}
        lines.append(f"- metrics: {len(metrics)}")

    lines.append("")
    lines.append("## Metadata")
    lines.append("```json")
    lines.append(json.dumps(result.get("metadata", {}), indent=2))
    lines.append("```")

    return "\n".join(lines)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Manage Langfuse datasets for regression testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  create      Create a new dataset
  add-trace   Add a single trace to a dataset
  add-batch   Add multiple traces from a file
  list        List all datasets
  get         Get items from a dataset
  set-metadata Update dataset metadata
  describe    Get dataset details + metadata

Examples:
  %(prog)s create --name "checkout_regressions" --description "Failing traces"
  %(prog)s add-trace --dataset "checkout_regressions" --trace-id abc123 --expected-score 9.0
  %(prog)s add-batch --dataset "checkout_regressions" --trace-file ids.txt
  %(prog)s list
  %(prog)s get --name "checkout_regressions"
  %(prog)s set-metadata --name "checkout_regressions" --metadata '{"schema_version":"eval_infra_v1"}'
  %(prog)s describe --name "checkout_regressions"
        """
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # create subcommand
    create_parser = subparsers.add_parser("create", help="Create a new dataset")
    create_parser.add_argument("--name", required=True, help="Dataset name")
    create_parser.add_argument("--description", help="Dataset description")
    create_parser.add_argument(
        "--metadata",
        type=json.loads,
        help="JSON metadata (e.g., '{\"case_id\": \"0001\"}')"
    )

    # add-trace subcommand
    add_parser = subparsers.add_parser("add-trace", help="Add a single trace to dataset")
    add_parser.add_argument("--dataset", required=True, help="Dataset name")
    add_parser.add_argument("--trace-id", required=True, help="Trace ID to add")
    add_parser.add_argument(
        "--expected-score",
        type=float,
        help="Expected minimum score (convenience arg, sets min_score in expected output)"
    )
    add_parser.add_argument(
        "--expected-output",
        type=json.loads,
        help="Custom expected output as JSON (e.g., '{\"min_score\": 9.0, \"required_fields\": [\"summary\"]}')"
    )
    add_parser.add_argument(
        "--failure-reason",
        help="Reason why this trace is being added (for regressions)"
    )

    # add-batch subcommand
    batch_parser = subparsers.add_parser("add-batch", help="Add traces from file")
    batch_parser.add_argument("--dataset", required=True, help="Dataset name")
    batch_parser.add_argument("--trace-file", required=True, help="File with trace IDs")
    batch_parser.add_argument(
        "--expected-score",
        type=float,
        help="Expected minimum score (convenience arg, sets min_score in expected output)"
    )
    batch_parser.add_argument(
        "--expected-output",
        type=json.loads,
        help="Custom expected output as JSON"
    )

    # list subcommand
    subparsers.add_parser("list", help="List all datasets")

    # get subcommand
    get_parser = subparsers.add_parser("get", help="Get dataset items")
    get_parser.add_argument("--name", required=True, help="Dataset name")

    # set-metadata subcommand
    set_meta_parser = subparsers.add_parser("set-metadata", help="Set dataset metadata")
    set_meta_parser.add_argument("--name", required=True, help="Dataset name")
    set_meta_parser.add_argument(
        "--metadata",
        required=True,
        type=json.loads,
        help="Metadata JSON patch"
    )
    set_meta_parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace metadata instead of merging"
    )

    # describe subcommand
    describe_parser = subparsers.add_parser("describe", help="Describe dataset + metadata")
    describe_parser.add_argument("--name", required=True, help="Dataset name")

    args = parser.parse_args()

    # Execute command
    if args.command == "create":
        result = create_dataset(
            name=args.name,
            description=args.description,
            metadata=args.metadata
        )
        print(format_create_result(result))

    elif args.command == "add-trace":
        result = add_trace_to_dataset(
            dataset_name=args.dataset,
            trace_id=args.trace_id,
            expected_score=args.expected_score,
            expected_output=args.expected_output,
            failure_reason=args.failure_reason
        )
        print(format_add_result(result))

    elif args.command == "add-batch":
        result = add_batch_from_file(
            dataset_name=args.dataset,
            trace_file=args.trace_file,
            expected_score=args.expected_score,
            expected_output=args.expected_output
        )
        print(format_batch_result(result))

    elif args.command == "list":
        datasets = list_datasets()
        print(format_list_result(datasets))

    elif args.command == "get":
        result = get_dataset_items(name=args.name)
        print(format_get_result(result))

    elif args.command == "set-metadata":
        result = set_dataset_metadata(
            name=args.name,
            metadata=args.metadata,
            merge=not args.replace
        )
        print(format_set_metadata_result(result))

    elif args.command == "describe":
        result = describe_dataset(name=args.name)
        print(format_describe_result(result))


if __name__ == "__main__":
    main()
