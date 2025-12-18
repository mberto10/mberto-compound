#!/usr/bin/env python3
"""
Langfuse Experiment Runner

Execute writing ecosystem workflows against datasets with automatic tracing
and evaluation. Used for validating config changes and regression testing.

USAGE:
    python experiment_runner.py --dataset "case_0001_regressions" --name "Fix: Add earnings tool"
    python experiment_runner.py --dataset "case_0001_regressions" --name "Test" --max-concurrency 2

EVALUATORS:
    quality_score  - Compares output quality_score to expected minimum
    word_count     - Validates minimum word count from article

OUTPUT:
    Markdown report with summary stats, per-item results, and failed items.
"""

import argparse
import json
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# Add paths for imports
plugin_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_root / "skills" / "data-retrieval" / "helpers"))

# Add writing_ecosystem to path
workspace_root = plugin_root.parent.parent.parent
writing_ecosystem_path = workspace_root / "writing_ecosystem"
sys.path.insert(0, str(writing_ecosystem_path))

from langfuse_client import get_langfuse_client

# Try to import Langfuse Evaluation for proper evaluator pattern
try:
    from langfuse import Evaluation
except ImportError:
    # Fallback if not available
    class Evaluation:
        def __init__(self, name: str, value: float, comment: str = "", metadata: Optional[Dict] = None):
            self.name = name
            self.value = value
            self.comment = comment
            self.metadata = metadata or {}


# =============================================================================
# EVALUATORS
# =============================================================================

def evaluator_quality_score(
    *,
    input: Dict[str, Any],
    output: Dict[str, Any],
    expected_output: Optional[Dict[str, Any]] = None,
    **kwargs
) -> Evaluation:
    """
    Evaluates if output quality_score meets expected minimum.

    Args:
        input: Dataset item input (case_id, ticker, topic, brief)
        output: Workflow result (final_article, quality_score, etc.)
        expected_output: Expected minimums (min_quality_score)

    Returns:
        Evaluation with pass/fail and score details
    """
    # Extract actual score - try multiple possible locations
    actual_score = None
    if isinstance(output, dict):
        actual_score = output.get("quality_score") or output.get("validation_score")
        # Try nested locations
        if actual_score is None and "validation_report" in output:
            report = output["validation_report"]
            if isinstance(report, dict):
                actual_score = report.get("overall_score")

    if actual_score is None:
        actual_score = 0.0

    # Get expected minimum
    expected_min = 9.0  # Default
    if expected_output:
        expected_min = expected_output.get("min_quality_score", 9.0)

    # Evaluate
    passed = actual_score >= expected_min
    value = 1.0 if passed else 0.0

    comment = f"Score: {actual_score:.1f} (expected >= {expected_min:.1f})"
    if not passed:
        comment += f" - FAILED by {expected_min - actual_score:.1f}"

    return Evaluation(
        name="quality_score",
        value=value,
        comment=comment,
        metadata={
            "actual": actual_score,
            "expected_min": expected_min,
            "delta": actual_score - expected_min
        }
    )


def evaluator_word_count(
    *,
    input: Dict[str, Any],
    output: Dict[str, Any],
    expected_output: Optional[Dict[str, Any]] = None,
    **kwargs
) -> Evaluation:
    """
    Evaluates if output meets minimum word count.

    Args:
        input: Dataset item input
        output: Workflow result
        expected_output: Expected minimums (min_word_count)

    Returns:
        Evaluation with pass/fail and word count details
    """
    # Extract article text
    article = ""
    if isinstance(output, dict):
        article = output.get("final_article") or output.get("draft") or ""

    word_count = len(article.split()) if article else 0

    # Get expected minimum
    expected_min = 800  # Default
    if expected_output:
        expected_min = expected_output.get("min_word_count", 800)

    # Evaluate
    passed = word_count >= expected_min
    value = 1.0 if passed else 0.0

    comment = f"Words: {word_count} (expected >= {expected_min})"
    if not passed:
        comment += f" - FAILED by {expected_min - word_count}"

    return Evaluation(
        name="word_count",
        value=value,
        comment=comment,
        metadata={
            "actual": word_count,
            "expected_min": expected_min,
            "delta": word_count - expected_min
        }
    )


# Map evaluator names to functions
EVALUATORS = {
    "quality_score": evaluator_quality_score,
    "word_count": evaluator_word_count,
}


# =============================================================================
# WORKFLOW EXECUTION
# =============================================================================

def run_workflow_for_item(
    item_input: Dict[str, Any],
    run_name: str,
    dataset_name: str,
    item_id: str
) -> Dict[str, Any]:
    """
    Execute writing workflow for a single dataset item.

    Uses direct integration with build_workflow + LangfuseTracer for proper tracing.
    """
    try:
        # Import workflow components
        from workflows.main_graph_v2 import build_workflow
        from tracing.langfuse_tracer import LangfuseTracer

        # Build workflow
        workflow = build_workflow()
        tracer = LangfuseTracer()

        # Prepare input state
        state = dict(item_input)

        # Ensure required fields
        if "_original_input" in state:
            # Merge original input
            original = state.pop("_original_input")
            for key, value in original.items():
                if key not in state:
                    state[key] = value

        # Run with tracing
        start_time = time.time()

        with tracer.trace_workflow(
            name=f"experiment:{run_name}",
            input_data=state,
            user_id="experiment-runner",
            session_id=f"exp-{run_name}-{item_id[:8]}",
            tags=["experiment", f"dataset:{dataset_name}", f"run:{run_name}"]
        ):
            result = workflow.invoke(state)
            tracer.update_trace_output(result)

        duration = time.time() - start_time

        # Flush to ensure trace is sent
        tracer.flush()

        # Extract trace ID if available
        trace_id = tracer.trace_id

        return {
            "success": True,
            "output": result,
            "trace_id": trace_id,
            "duration": duration
        }

    except Exception as e:
        return {
            "success": False,
            "output": {},
            "error": str(e),
            "traceback": traceback.format_exc(),
            "duration": 0
        }


def run_experiment(
    dataset_name: str,
    run_name: str,
    description: Optional[str] = None,
    evaluator_names: List[str] = None,
    max_concurrency: int = 2,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run experiment against a Langfuse dataset.

    Note: Currently runs sequentially. For parallel execution, consider using
    Langfuse's native run_experiment() method when available.

    Args:
        dataset_name: Name of the dataset to run against
        run_name: Name for this experiment run
        description: Optional description
        evaluator_names: List of evaluator names to apply
        max_concurrency: Max parallel items (not yet implemented, runs sequential)
        metadata: Additional metadata for the run

    Returns:
        Experiment results dict
    """
    client = get_langfuse_client()

    # Get evaluator functions
    if evaluator_names is None:
        evaluator_names = ["quality_score", "word_count"]

    evaluators = [EVALUATORS[name] for name in evaluator_names if name in EVALUATORS]

    # Load dataset
    try:
        dataset = client.get_dataset(dataset_name)
    except Exception as e:
        return {"error": f"Could not load dataset '{dataset_name}': {e}"}

    items = list(dataset.items)
    if not items:
        return {"error": f"Dataset '{dataset_name}' has no items"}

    # Initialize results
    results = {
        "dataset_name": dataset_name,
        "run_name": run_name,
        "description": description,
        "metadata": metadata or {},
        "started_at": datetime.now().isoformat(),
        "total_items": len(items),
        "processed": 0,
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "items": [],
        "total_duration": 0
    }

    start_time = time.time()

    # Process each item (sequential for now)
    for i, item in enumerate(items):
        item_dict = item.dict() if hasattr(item, "dict") else dict(item)
        item_id = item_dict.get("id", f"item_{i}")
        item_input = item_dict.get("input", {})
        expected_output = item_dict.get("expected_output", {})
        item_metadata = item_dict.get("metadata", {})

        print(f"Processing item {i+1}/{len(items)}: {item_id[:12]}...", file=sys.stderr)

        # Run workflow
        execution_result = run_workflow_for_item(
            item_input=item_input,
            run_name=run_name,
            dataset_name=dataset_name,
            item_id=item_id
        )

        item_result = {
            "item_id": item_id,
            "input_summary": {
                "case_id": item_input.get("case_id"),
                "ticker": item_input.get("ticker"),
                "topic": (item_input.get("topic") or "")[:50]
            },
            "execution": {
                "success": execution_result.get("success", False),
                "duration": execution_result.get("duration", 0),
                "trace_id": execution_result.get("trace_id"),
                "error": execution_result.get("error")
            },
            "evaluations": [],
            "passed": True
        }

        if execution_result.get("success"):
            output = execution_result.get("output", {})

            # Run evaluators
            for evaluator in evaluators:
                try:
                    evaluation = evaluator(
                        input=item_input,
                        output=output,
                        expected_output=expected_output,
                        metadata=item_metadata
                    )
                    eval_result = {
                        "name": evaluation.name,
                        "value": evaluation.value,
                        "comment": evaluation.comment,
                        "passed": evaluation.value >= 0.5
                    }
                    item_result["evaluations"].append(eval_result)

                    if not eval_result["passed"]:
                        item_result["passed"] = False
                except Exception as e:
                    item_result["evaluations"].append({
                        "name": evaluator.__name__,
                        "value": 0,
                        "comment": f"Evaluator error: {e}",
                        "passed": False
                    })
                    item_result["passed"] = False
        else:
            item_result["passed"] = False
            results["errors"] += 1

        results["items"].append(item_result)
        results["processed"] += 1

        if item_result["passed"]:
            results["passed"] += 1
        else:
            results["failed"] += 1

    results["total_duration"] = time.time() - start_time
    results["finished_at"] = datetime.now().isoformat()
    results["pass_rate"] = results["passed"] / results["total_items"] if results["total_items"] > 0 else 0

    # Calculate average score
    quality_scores = []
    for item in results["items"]:
        for eval_result in item.get("evaluations", []):
            if eval_result.get("name") == "quality_score":
                # Extract actual score from comment
                comment = eval_result.get("comment", "")
                if "Score:" in comment:
                    try:
                        score_str = comment.split("Score:")[1].split()[0]
                        quality_scores.append(float(score_str))
                    except:
                        pass

    results["avg_quality_score"] = sum(quality_scores) / len(quality_scores) if quality_scores else None

    return results


# =============================================================================
# OUTPUT FORMATTING
# =============================================================================

def format_experiment_report(results: Dict[str, Any]) -> str:
    """Format experiment results as markdown report."""
    lines = []

    if "error" in results:
        lines.append("# Experiment Error")
        lines.append("")
        lines.append(f"**Error:** {results['error']}")
        return "\n".join(lines)

    # Header
    lines.append(f"# Experiment Results: {results.get('run_name', 'Unknown')}")
    lines.append("")
    lines.append(f"**Dataset:** `{results.get('dataset_name')}`")
    lines.append(f"**Items:** {results.get('total_items', 0)}")
    if results.get("description"):
        lines.append(f"**Description:** {results['description']}")
    lines.append("")

    # Summary
    lines.append("## Summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("|--------|-------|")
    lines.append(f"| Items Processed | {results.get('processed', 0)} |")

    pass_rate = results.get('pass_rate', 0) * 100
    passed = results.get('passed', 0)
    total = results.get('total_items', 0)
    lines.append(f"| Pass Rate | {pass_rate:.0f}% ({passed}/{total}) |")

    avg_score = results.get('avg_quality_score')
    if avg_score is not None:
        lines.append(f"| Avg Quality Score | {avg_score:.1f} |")

    duration = results.get('total_duration', 0)
    lines.append(f"| Total Duration | {duration:.1f}s |")

    if results.get('errors', 0) > 0:
        lines.append(f"| Execution Errors | {results['errors']} |")

    lines.append("")

    # Item Results
    lines.append("## Item Results")
    lines.append("")

    for i, item in enumerate(results.get("items", []), 1):
        input_summary = item.get("input_summary", {})
        ticker = input_summary.get("ticker", "Unknown")
        topic = input_summary.get("topic", "")
        passed = item.get("passed", False)

        status_icon = "✅" if passed else "❌"
        lines.append(f"### Item {i}: {ticker} {status_icon}")
        lines.append("")

        if topic:
            lines.append(f"**Topic:** {topic}")

        execution = item.get("execution", {})
        if execution.get("trace_id"):
            lines.append(f"**Trace ID:** `{execution['trace_id'][:20]}...`")
        lines.append(f"**Duration:** {execution.get('duration', 0):.1f}s")

        if execution.get("error"):
            lines.append(f"**Error:** {execution['error']}")
        else:
            lines.append("")
            lines.append("**Evaluations:**")
            for eval_result in item.get("evaluations", []):
                eval_icon = "✅" if eval_result.get("passed") else "❌"
                lines.append(f"- {eval_icon} **{eval_result.get('name')}:** {eval_result.get('comment')}")

        lines.append("")

    # Failed Items Table
    failed_items = [item for item in results.get("items", []) if not item.get("passed")]
    if failed_items:
        lines.append("## Failed Items")
        lines.append("")
        lines.append("| Item | Issue | Details |")
        lines.append("|------|-------|---------|")

        for item in failed_items:
            ticker = item.get("input_summary", {}).get("ticker", "?")

            # Find failing evaluations
            issues = []
            for eval_result in item.get("evaluations", []):
                if not eval_result.get("passed"):
                    issues.append(f"{eval_result.get('name')}: {eval_result.get('comment', '')[:30]}")

            if item.get("execution", {}).get("error"):
                issues.append(f"Execution error: {item['execution']['error'][:30]}")

            issue_str = "; ".join(issues) if issues else "Unknown"
            lines.append(f"| {ticker} | {issue_str[:40]} | See trace |")

        lines.append("")

    # Next Steps
    lines.append("## Next Steps")
    lines.append("")
    if pass_rate >= 80:
        lines.append("✅ **Good pass rate!** Consider:")
        lines.append("1. Reviewing any failed items")
        lines.append("2. Adding more items to the dataset for broader coverage")
        lines.append("3. Deploying the config changes")
    else:
        lines.append("⚠️ **Low pass rate.** Recommended actions:")
        lines.append("1. Review failed item traces in Langfuse")
        lines.append("2. Investigate root cause of failures")
        lines.append("3. Apply additional fixes")
        lines.append("4. Re-run experiment")

    return "\n".join(lines)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Run experiments against Langfuse datasets",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Evaluators:
  quality_score   Compare output quality to expected minimum
  word_count      Validate minimum word count

Examples:
  %(prog)s --dataset "case_0001_regressions" --name "Fix: Add earnings tool"
  %(prog)s --dataset "case_0001_regressions" --name "Test" --evaluators quality_score word_count
  %(prog)s --dataset "case_0001_regressions" --name "Test" --metadata '{"version": "v2"}'
        """
    )

    parser.add_argument(
        "--dataset",
        required=True,
        help="Dataset name to run experiment against"
    )
    parser.add_argument(
        "--name",
        required=True,
        help="Name for this experiment run"
    )
    parser.add_argument(
        "--description",
        help="Description of the experiment (e.g., what changed)"
    )
    parser.add_argument(
        "--evaluators",
        nargs="+",
        default=["quality_score", "word_count"],
        choices=list(EVALUATORS.keys()),
        help="Evaluators to run (default: quality_score word_count)"
    )
    parser.add_argument(
        "--max-concurrency",
        type=int,
        default=2,
        help="Max parallel items (default: 2, sequential for now)"
    )
    parser.add_argument(
        "--metadata",
        type=json.loads,
        help="JSON metadata for the run"
    )

    args = parser.parse_args()

    print(f"Starting experiment: {args.name}", file=sys.stderr)
    print(f"Dataset: {args.dataset}", file=sys.stderr)
    print(f"Evaluators: {', '.join(args.evaluators)}", file=sys.stderr)
    print("", file=sys.stderr)

    results = run_experiment(
        dataset_name=args.dataset,
        run_name=args.name,
        description=args.description,
        evaluator_names=args.evaluators,
        max_concurrency=args.max_concurrency,
        metadata=args.metadata
    )

    report = format_experiment_report(results)
    print(report)


if __name__ == "__main__":
    main()
