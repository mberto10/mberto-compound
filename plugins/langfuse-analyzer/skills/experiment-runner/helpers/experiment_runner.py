#!/usr/bin/env python3
"""
Langfuse Experiment Runner

Run experiments on datasets with custom evaluators and analyze results.
Supports both local evaluator scripts and Langfuse-stored judge prompts.

USAGE:
    # With local evaluator script
    python experiment_runner.py run --dataset "my-tests" --run-name "v1" --task-script task.py --evaluator-script evals.py

    # With Langfuse judge prompts (recommended)
    python experiment_runner.py run --dataset "my-tests" --run-name "v1" --task-script task.py --use-langfuse-judges
    python experiment_runner.py run --dataset "my-tests" --run-name "v1" --task-script task.py --judges judge-accuracy judge-helpfulness

    # Other commands
    python experiment_runner.py list-runs --dataset "my-tests"
    python experiment_runner.py get-run --dataset "my-tests" --run-name "v1"
    python experiment_runner.py compare --dataset "my-tests" --runs "v1" "v2"
    python experiment_runner.py analyze --dataset "my-tests" --run-name "v1" --show-failures
"""

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "data-retrieval" / "helpers"))
from langfuse_client import get_langfuse_client

CANONICAL_SCORE_SCALE = "0-1"


def normalize_score(value: Any) -> float:
    """
    Normalize raw score values to canonical 0-1 scale.

    Accepted inputs:
    - 0-1 (already normalized)
    - 0-10 (converted to 0-1)
    """
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


def format_score_dual(value: float) -> str:
    """Format score with canonical and human-readable equivalents."""
    return f"{value:.3f} ({value * 10:.1f}/10)"


def create_langfuse_judge_evaluator(prompt_name: str, client) -> Callable:
    """
    Create an evaluator function from a Langfuse prompt.

    The prompt should use {{input}}, {{output}}, and optionally {{expected_output}} placeholders.
    It should return JSON with {"score": <0-10>, "reasoning": "<explanation>"}.
    """
    try:
        from langfuse import Evaluation
        from openai import OpenAI
    except ImportError as e:
        raise ImportError(f"Required packages not installed: {e}")

    # Fetch the prompt from Langfuse
    prompt_obj = client.get_prompt(prompt_name, label="production")
    if not prompt_obj:
        raise ValueError(f"Judge prompt '{prompt_name}' not found in Langfuse")

    prompt_template = prompt_obj.prompt
    config = prompt_obj.config or {}
    model = config.get("model", "gpt-4o")
    temperature = config.get("temperature", 0)
    max_tokens = config.get("max_tokens", 150)

    # Extract score name from prompt name (e.g., "judge-accuracy" -> "accuracy")
    score_name = prompt_name.replace("judge-", "").replace("_", "-")

    def evaluator(*, input, output, expected_output=None, **kwargs) -> "Evaluation":
        """Evaluator generated from Langfuse prompt: {prompt_name}"""
        openai_client = OpenAI()

        # Fill in the template
        filled_prompt = prompt_template
        filled_prompt = filled_prompt.replace("{{input}}", str(input) if input else "")
        filled_prompt = filled_prompt.replace("{{output}}", str(output) if output else "")
        filled_prompt = filled_prompt.replace(
            "{{expected_output}}",
            str(expected_output) if expected_output else "Not provided"
        )

        try:
            response = openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an evaluation judge. Follow the instructions exactly."},
                    {"role": "user", "content": filled_prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            result_text = response.choices[0].message.content.strip()

            # Try to parse JSON response
            try:
                # Find JSON in response
                json_match = re.search(r'\{[^}]+\}', result_text)
                if json_match:
                    result = json.loads(json_match.group())
                    raw_score = result.get("score", 0)
                    score = normalize_score(raw_score)
                    reasoning = result.get("reasoning", "")
                    comment = f"raw_score={raw_score}; normalized={score:.3f}; {reasoning}".strip("; ")
                    return Evaluation(name=score_name, value=score, comment=comment)
            except (json.JSONDecodeError, ValueError):
                pass

            # Fallback: try to extract just a number
            numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', result_text)
            if numbers:
                raw_score = float(numbers[0])
                score = normalize_score(raw_score)
                return Evaluation(
                    name=score_name,
                    value=score,
                    comment=f"raw_score={raw_score}; normalized={score:.3f}; {result_text[:100]}"
                )

            # If all parsing fails, return 0
            return Evaluation(name=score_name, value=0.0, comment=f"Failed to parse: {result_text[:100]}")

        except Exception as e:
            return Evaluation(name=score_name, value=0.0, comment=f"Error: {str(e)[:100]}")

    # Set a meaningful name for the function
    evaluator.__name__ = f"judge_{score_name}"
    evaluator.__doc__ = f"Evaluator generated from Langfuse prompt: {prompt_name}"

    return evaluator


def load_langfuse_judges(
    client,
    judge_names: Optional[List[str]] = None,
    dataset_name: Optional[str] = None
) -> List[Callable]:
    """
    Load judge evaluators from Langfuse prompts.

    If judge_names is provided, load those specific judges.
    If dataset_name is provided, try to get judge names from dataset metadata.
    Otherwise, auto-discover prompts starting with "judge-".
    """
    evaluators = []

    # Option 1: Explicit judge names provided
    if judge_names:
        for name in judge_names:
            try:
                evaluator = create_langfuse_judge_evaluator(name, client)
                evaluators.append(evaluator)
                print(f"Loaded judge: {name}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to load judge '{name}': {e}", file=sys.stderr)
        return evaluators

    # Option 2: Get from dataset metadata
    if dataset_name:
        try:
            dataset = client.get_dataset(dataset_name)
            if dataset and hasattr(dataset, 'metadata') and dataset.metadata:
                metadata = dataset.metadata
                if 'judge_prompts' in metadata:
                    for name in metadata['judge_prompts']:
                        try:
                            evaluator = create_langfuse_judge_evaluator(name, client)
                            evaluators.append(evaluator)
                            print(f"Loaded judge from dataset metadata: {name}", file=sys.stderr)
                        except Exception as e:
                            print(f"Warning: Failed to load judge '{name}': {e}", file=sys.stderr)
                    if evaluators:
                        return evaluators
        except Exception as e:
            print(f"Warning: Could not read dataset metadata: {e}", file=sys.stderr)

    # Option 3: Auto-discover judge prompts
    # List all prompts and find ones starting with "judge-"
    try:
        prompts = client.get_prompts()
        if prompts:
            for prompt in prompts:
                name = prompt.name if hasattr(prompt, 'name') else str(prompt)
                if name.startswith("judge-"):
                    try:
                        evaluator = create_langfuse_judge_evaluator(name, client)
                        evaluators.append(evaluator)
                        print(f"Auto-discovered judge: {name}", file=sys.stderr)
                    except Exception as e:
                        print(f"Warning: Failed to load judge '{name}': {e}", file=sys.stderr)
    except Exception as e:
        print(f"Warning: Could not auto-discover judges: {e}", file=sys.stderr)

    if not evaluators:
        print("Warning: No Langfuse judges found. Create prompts starting with 'judge-'.", file=sys.stderr)

    return evaluators


def load_module_from_path(script_path: str, module_name: str):
    """Load a Python module from a file path."""
    path = Path(script_path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")

    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from: {script_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def load_task(task_script_path: str) -> Callable:
    """Load task function from a script file.

    The script must define a `task` function with signature:
        def task(*, item, **kwargs) -> Any
    """
    module = load_module_from_path(task_script_path, "task_module")

    if not hasattr(module, "task"):
        raise AttributeError(f"Script must define a 'task' function: {task_script_path}")

    return module.task


def load_evaluators(evaluator_script_path: str) -> List[Callable]:
    """Load evaluator functions from a script file.

    The script must define EVALUATORS list or individual evaluator functions.
    Each evaluator function should have signature:
        def evaluator(*, output, expected_output, **kwargs) -> Evaluation
    """
    module = load_module_from_path(evaluator_script_path, "evaluator_module")

    # Check for EVALUATORS list first
    if hasattr(module, "EVALUATORS"):
        evaluators = module.EVALUATORS
        if isinstance(evaluators, list):
            return evaluators

    # Fall back to finding all functions that look like evaluators
    evaluators = []
    for name in dir(module):
        if name.startswith("_"):
            continue
        obj = getattr(module, name)
        if callable(obj) and name not in ("task", "load_module_from_path"):
            evaluators.append(obj)

    if not evaluators:
        raise AttributeError(
            f"Script must define EVALUATORS list or evaluator functions: {evaluator_script_path}"
        )

    return evaluators


def run_experiment(
    dataset_name: str,
    run_name: str,
    task_script: str,
    evaluator_script: Optional[str] = None,
    use_langfuse_judges: bool = False,
    judge_names: Optional[List[str]] = None,
    max_concurrency: int = 5,
    run_description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Run an experiment on a dataset with custom task and evaluators.

    Evaluators can come from:
    1. Local script file (--evaluator-script)
    2. Langfuse prompts (--use-langfuse-judges or --judges)

    Langfuse judges are prompts named 'judge-*' that define LLM-as-judge evaluation.
    """
    client = get_langfuse_client()

    try:
        # Load task function
        task_fn = load_task(task_script)

        # Load evaluators
        evaluators = []

        # Option 1: Load from local script
        if evaluator_script:
            evaluators = load_evaluators(evaluator_script)
            print(f"Loaded {len(evaluators)} evaluators from script", file=sys.stderr)

        # Option 2: Load from Langfuse judge prompts
        if use_langfuse_judges or judge_names:
            langfuse_evaluators = load_langfuse_judges(
                client,
                judge_names=judge_names,
                dataset_name=dataset_name
            )
            evaluators.extend(langfuse_evaluators)
            print(f"Loaded {len(langfuse_evaluators)} Langfuse judges", file=sys.stderr)

        # Get dataset
        dataset = client.get_dataset(dataset_name)
        if not dataset:
            print(f"Dataset '{dataset_name}' not found", file=sys.stderr)
            return {"status": "error", "message": f"Dataset not found: {dataset_name}"}

        # Prepare run metadata
        run_metadata = metadata or {}
        run_metadata["task_script"] = task_script
        if evaluator_script:
            run_metadata["evaluator_script"] = evaluator_script
        run_metadata["max_concurrency"] = max_concurrency

        # Run experiment using Langfuse SDK
        results = dataset.run_experiment(
            name=run_name,
            run_description=run_description,
            run_metadata=run_metadata,
            experiment_task=task_fn,
            evaluators=evaluators if evaluators else None,
            max_concurrency=max_concurrency
        )

        # Collect summary statistics
        total_items = 0
        successful = 0
        failed = 0
        scores = {}

        for item_result in results:
            total_items += 1
            if hasattr(item_result, 'error') and item_result.error:
                failed += 1
            else:
                successful += 1

            # Aggregate scores
            if hasattr(item_result, 'scores') and item_result.scores:
                for score in item_result.scores:
                    name = score.name if hasattr(score, 'name') else str(score)
                    value = score.value if hasattr(score, 'value') else score
                    if name not in scores:
                        scores[name] = []
                    if isinstance(value, (int, float)):
                        scores[name].append(normalize_score(value))

        # Calculate averages
        score_averages = {}
        for name, values in scores.items():
            if values:
                score_averages[name] = sum(values) / len(values)

        return {
            "status": "completed",
            "dataset": dataset_name,
            "run_name": run_name,
            "total_items": total_items,
            "successful": successful,
            "failed": failed,
            "score_averages": score_averages,
            "evaluators_used": [e.__name__ for e in evaluators] if evaluators else [],
            "score_scale": CANONICAL_SCORE_SCALE,
            "score_scale_note": "Canonical 0-1 scale. 0-10 values are normalized before aggregation.",
        }

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"Error running experiment: {e}", file=sys.stderr)
        return {"status": "error", "message": str(e)}


def list_runs(dataset_name: str) -> List[Dict[str, Any]]:
    """List all experiment runs for a dataset."""
    client = get_langfuse_client()

    try:
        dataset = client.get_dataset(dataset_name)
        if not dataset:
            print(f"Dataset '{dataset_name}' not found", file=sys.stderr)
            return []

        runs = []
        if hasattr(dataset, 'runs') and dataset.runs:
            for run in dataset.runs:
                run_dict = {
                    "name": run.name if hasattr(run, 'name') else str(run),
                    "created_at": str(run.created_at) if hasattr(run, 'created_at') else None,
                    "description": run.description if hasattr(run, 'description') else None,
                    "metadata": run.metadata if hasattr(run, 'metadata') else {}
                }
                runs.append(run_dict)

        return runs
    except Exception as e:
        print(f"Error listing runs: {e}", file=sys.stderr)
        return []


def get_run(dataset_name: str, run_name: str) -> Optional[Dict[str, Any]]:
    """Get details of a specific experiment run."""
    client = get_langfuse_client()

    try:
        dataset = client.get_dataset(dataset_name)
        if not dataset:
            print(f"Dataset '{dataset_name}' not found", file=sys.stderr)
            return None

        # Find the run
        run = None
        if hasattr(dataset, 'runs') and dataset.runs:
            for r in dataset.runs:
                if hasattr(r, 'name') and r.name == run_name:
                    run = r
                    break

        if not run:
            print(f"Run '{run_name}' not found in dataset '{dataset_name}'", file=sys.stderr)
            return None

        # Get run items with their scores
        items = []
        scores_summary = {}

        if hasattr(run, 'items') and run.items:
            for item in run.items:
                item_dict = {
                    "id": item.id if hasattr(item, 'id') else None,
                    "input": item.input if hasattr(item, 'input') else None,
                    "output": item.output if hasattr(item, 'output') else None,
                    "expected_output": item.expected_output if hasattr(item, 'expected_output') else None,
                }

                # Get scores for this item
                if hasattr(item, 'scores') and item.scores:
                    item_dict["scores"] = {}
                    for score in item.scores:
                        name = score.name if hasattr(score, 'name') else "score"
                        raw_value = score.value if hasattr(score, 'value') else score
                        value = normalize_score(raw_value) if isinstance(raw_value, (int, float)) else raw_value
                        item_dict["scores"][name] = value

                        if name not in scores_summary:
                            scores_summary[name] = []
                        if isinstance(value, (int, float)):
                            scores_summary[name].append(value)

                items.append(item_dict)

        # Calculate score statistics
        score_stats = {}
        for name, values in scores_summary.items():
            if values:
                score_stats[name] = {
                    "mean": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values)
                }

        return {
            "name": run_name,
            "dataset": dataset_name,
            "created_at": str(run.created_at) if hasattr(run, 'created_at') else None,
            "description": run.description if hasattr(run, 'description') else None,
            "metadata": run.metadata if hasattr(run, 'metadata') else {},
            "item_count": len(items),
            "score_stats": score_stats,
            "items": items
        }

    except Exception as e:
        print(f"Error getting run: {e}", file=sys.stderr)
        return None


def compare_runs(dataset_name: str, run_names: List[str]) -> str:
    """Compare multiple experiment runs."""
    runs_data = []

    for run_name in run_names:
        run = get_run(dataset_name, run_name)
        if run:
            runs_data.append(run)
        else:
            return f"Error: Run '{run_name}' not found"

    if len(runs_data) < 2:
        return "Error: Need at least 2 runs to compare"

    # Build comparison table
    lines = [f"# Run Comparison: {dataset_name}\n"]

    # Header
    header = "| Metric |"
    separator = "|--------|"
    for run in runs_data:
        header += f" {run['name']} |"
        separator += "--------|"
    lines.append(header)
    lines.append(separator)

    # Item count
    row = "| Items |"
    for run in runs_data:
        row += f" {run['item_count']} |"
    lines.append(row)

    # Collect all score names
    all_scores = set()
    for run in runs_data:
        all_scores.update(run.get('score_stats', {}).keys())

    # Score comparisons
    for score_name in sorted(all_scores):
        row = f"| {score_name} (avg) |"
        for run in runs_data:
            stats = run.get('score_stats', {}).get(score_name, {})
            mean = stats.get('mean', '-')
            if isinstance(mean, float):
                mean = f"{mean:.3f}"
            row += f" {mean} |"
        lines.append(row)

    lines.append("")

    # Detailed stats per score
    if all_scores:
        lines.append("## Score Details\n")
        for score_name in sorted(all_scores):
            lines.append(f"### {score_name}\n")
            lines.append("| Run | Mean | Min | Max | Count |")
            lines.append("|-----|------|-----|-----|-------|")
            for run in runs_data:
                stats = run.get('score_stats', {}).get(score_name, {})
                mean = f"{stats.get('mean', 0):.3f}" if 'mean' in stats else "-"
                min_v = f"{stats.get('min', 0):.3f}" if 'min' in stats else "-"
                max_v = f"{stats.get('max', 0):.3f}" if 'max' in stats else "-"
                count = stats.get('count', '-')
                lines.append(f"| {run['name']} | {mean} | {min_v} | {max_v} | {count} |")
            lines.append("")

    return "\n".join(lines)


def analyze_run(
    dataset_name: str,
    run_name: str,
    show_failures: bool = False,
    score_threshold: Optional[float] = None,
    score_name: Optional[str] = None
) -> str:
    """Analyze an experiment run with score distributions and failure details."""
    run = get_run(dataset_name, run_name)
    if not run:
        return f"Error: Run '{run_name}' not found in dataset '{dataset_name}'"

    lines = [f"# Analysis: {run_name}\n"]
    lines.append(f"**Dataset:** {dataset_name}")
    lines.append(f"**Created:** {run.get('created_at', 'Unknown')}")
    lines.append(f"**Total Items:** {run.get('item_count', 0)}")
    lines.append(f"**Score Scale:** `{CANONICAL_SCORE_SCALE}` (with 0-10 equivalents in display)")

    if run.get('description'):
        lines.append(f"**Description:** {run['description']}")
    lines.append("")

    # Score statistics
    score_stats = run.get('score_stats', {})
    if score_stats:
        lines.append("## Score Summary\n")
        lines.append("| Score | Mean | Min | Max | Count |")
        lines.append("|-------|------|-----|-----|-------|")
        for name, stats in score_stats.items():
            mean = f"{stats.get('mean', 0):.3f}"
            min_v = f"{stats.get('min', 0):.3f}"
            max_v = f"{stats.get('max', 0):.3f}"
            count = stats.get('count', 0)
            lines.append(
                f"| {name} | {mean} ({float(mean)*10:.1f}/10) | {min_v} ({float(min_v)*10:.1f}/10) | {max_v} ({float(max_v)*10:.1f}/10) | {count} |"
            )
        lines.append("")

    # Filter items by score threshold
    items = run.get('items', [])
    if score_threshold is not None and score_name:
        threshold_normalized = normalize_score(score_threshold)
        filtered_items = []
        for item in items:
            scores = item.get('scores', {})
            if score_name in scores:
                if normalize_score(scores[score_name]) < threshold_normalized:
                    filtered_items.append(item)
        items = filtered_items
        lines.append(f"## Items Below Threshold\n")
        lines.append(
            f"Showing items where `{score_name}` < {threshold_normalized:.3f} ({threshold_normalized * 10:.1f}/10)"
        )
        lines.append(f"**Count:** {len(items)}\n")
    elif show_failures:
        # Show items with any low scores (< 0.5 for normalized scores)
        failure_items = []
        for item in items:
            scores = item.get('scores', {})
            for name, value in scores.items():
                if isinstance(value, (int, float)) and normalize_score(value) < 0.5:
                    failure_items.append(item)
                    break
        items = failure_items
        lines.append("## Low-Scoring Items\n")
        lines.append(f"**Count:** {len(items)}\n")

    # Show item details
    if items and (show_failures or score_threshold is not None):
        for i, item in enumerate(items[:20]):  # Limit to 20 items
            lines.append(f"### Item {i+1}")
            if item.get('input'):
                input_str = json.dumps(item['input']) if isinstance(item['input'], dict) else str(item['input'])
                if len(input_str) > 200:
                    input_str = input_str[:200] + "..."
                lines.append(f"**Input:** `{input_str}`")

            if item.get('expected_output'):
                expected = str(item['expected_output'])
                if len(expected) > 200:
                    expected = expected[:200] + "..."
                lines.append(f"**Expected:** `{expected}`")

            if item.get('output'):
                output = str(item['output'])
                if len(output) > 200:
                    output = output[:200] + "..."
                lines.append(f"**Actual:** `{output}`")

            if item.get('scores'):
                scores_str = ", ".join(
                    f"{k}: {format_score_dual(normalize_score(v))}" if isinstance(v, (int, float)) else f"{k}: {v}"
                    for k, v in item['scores'].items()
                )
                lines.append(f"**Scores:** {scores_str}")
            lines.append("")

        if len(run.get('items', [])) > 20:
            lines.append(f"*...and {len(run.get('items', [])) - 20} more items*\n")

    return "\n".join(lines)


def format_run_list(runs: List[Dict[str, Any]], dataset_name: str) -> str:
    """Format run list for display."""
    if not runs:
        return f"No runs found for dataset '{dataset_name}'"

    lines = [f"# Experiment Runs: {dataset_name}\n"]
    lines.append("| Name | Created | Description |")
    lines.append("|------|---------|-------------|")

    for run in runs:
        name = run.get('name', '?')
        created = run.get('created_at', '-')
        if created and len(created) > 19:
            created = created[:19]
        desc = run.get('description', '-') or '-'
        if len(desc) > 50:
            desc = desc[:50] + "..."
        lines.append(f"| {name} | {created} | {desc} |")

    return "\n".join(lines)


def format_run_detail(run: Dict[str, Any]) -> str:
    """Format run details for display."""
    if not run:
        return "Run not found"

    lines = [f"# Run: {run.get('name', '?')}\n"]
    lines.append(f"**Dataset:** {run.get('dataset', '?')}")
    lines.append(f"**Created:** {run.get('created_at', 'Unknown')}")
    lines.append(f"**Items:** {run.get('item_count', 0)}")

    if run.get('description'):
        lines.append(f"**Description:** {run['description']}")

    if run.get('metadata'):
        lines.append("\n## Metadata\n")
        lines.append("```json")
        lines.append(json.dumps(run['metadata'], indent=2))
        lines.append("```")

    score_stats = run.get('score_stats', {})
    if score_stats:
        lines.append("\n## Scores\n")
        lines.append("| Score | Mean | Min | Max | Count |")
        lines.append("|-------|------|-----|-----|-------|")
        for name, stats in score_stats.items():
            mean = f"{stats.get('mean', 0):.3f}"
            min_v = f"{stats.get('min', 0):.3f}"
            max_v = f"{stats.get('max', 0):.3f}"
            count = stats.get('count', 0)
            lines.append(f"| {name} | {mean} | {min_v} | {max_v} | {count} |")

    return "\n".join(lines)


def format_result(result: Dict[str, Any]) -> str:
    """Format experiment result for display."""
    if result.get('status') == 'error':
        return f"Error: {result.get('message', 'Unknown error')}"

    lines = ["# Experiment Complete\n"]
    lines.append(f"**Dataset:** {result.get('dataset', '?')}")
    lines.append(f"**Run:** {result.get('run_name', '?')}")
    lines.append(f"**Total Items:** {result.get('total_items', 0)}")
    lines.append(f"**Successful:** {result.get('successful', 0)}")
    lines.append(f"**Failed:** {result.get('failed', 0)}")

    if result.get('evaluators_used'):
        lines.append(f"**Evaluators:** {', '.join(result['evaluators_used'])}")

    if result.get('score_averages'):
        lines.append("\n## Average Scores\n")
        for name, avg in result['score_averages'].items():
            lines.append(f"- **{name}:** {format_score_dual(avg)}")

    if result.get('score_scale'):
        lines.append("")
        lines.append(f"**Score Scale:** `{result['score_scale']}`")
        if result.get("score_scale_note"):
            lines.append(f"**Note:** {result['score_scale_note']}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Langfuse Experiment Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Run command
    run_parser = subparsers.add_parser("run", help="Run an experiment on a dataset")
    run_parser.add_argument("--dataset", required=True, help="Dataset name")
    run_parser.add_argument("--run-name", required=True, help="Name for this experiment run")
    run_parser.add_argument("--task-script", required=True,
                           help="Path to Python script with task() function")
    run_parser.add_argument("--evaluator-script",
                           help="Path to Python script with evaluator functions")
    run_parser.add_argument("--use-langfuse-judges", action="store_true",
                           help="Use judge prompts stored in Langfuse (auto-discovers 'judge-*' prompts)")
    run_parser.add_argument("--judges", nargs="+",
                           help="Specific Langfuse judge prompt names to use (e.g., judge-accuracy judge-helpfulness)")
    run_parser.add_argument("--max-concurrency", type=int, default=5,
                           help="Maximum concurrent executions (default: 5)")
    run_parser.add_argument("--description", help="Run description")

    # List runs command
    list_parser = subparsers.add_parser("list-runs", help="List experiment runs for a dataset")
    list_parser.add_argument("--dataset", required=True, help="Dataset name")

    # Get run command
    get_parser = subparsers.add_parser("get-run", help="Get details of an experiment run")
    get_parser.add_argument("--dataset", required=True, help="Dataset name")
    get_parser.add_argument("--run-name", required=True, help="Run name")

    # Compare runs command
    compare_parser = subparsers.add_parser("compare", help="Compare experiment runs")
    compare_parser.add_argument("--dataset", required=True, help="Dataset name")
    compare_parser.add_argument("--runs", nargs="+", required=True, help="Run names to compare")

    # Analyze run command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze experiment run results")
    analyze_parser.add_argument("--dataset", required=True, help="Dataset name")
    analyze_parser.add_argument("--run-name", required=True, help="Run name")
    analyze_parser.add_argument("--show-failures", action="store_true",
                               help="Show items with low scores")
    analyze_parser.add_argument("--score-threshold", type=float,
                               help="Show items below this score threshold")
    analyze_parser.add_argument("--score-name", help="Score name to filter by")

    args = parser.parse_args()

    if args.command == "run":
        result = run_experiment(
            args.dataset,
            args.run_name,
            args.task_script,
            evaluator_script=args.evaluator_script,
            use_langfuse_judges=args.use_langfuse_judges,
            judge_names=args.judges,
            max_concurrency=args.max_concurrency,
            run_description=args.description
        )
        print(format_result(result))

    elif args.command == "list-runs":
        runs = list_runs(args.dataset)
        print(format_run_list(runs, args.dataset))

    elif args.command == "get-run":
        run = get_run(args.dataset, args.run_name)
        print(format_run_detail(run))

    elif args.command == "compare":
        comparison = compare_runs(args.dataset, args.runs)
        print(comparison)

    elif args.command == "analyze":
        analysis = analyze_run(
            args.dataset,
            args.run_name,
            show_failures=args.show_failures,
            score_threshold=args.score_threshold,
            score_name=args.score_name
        )
        print(analysis)


if __name__ == "__main__":
    main()
