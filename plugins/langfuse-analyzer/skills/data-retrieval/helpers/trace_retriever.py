#!/usr/bin/env python3
"""
Surgical Trace Retriever with Output Modes

Retrieves Langfuse traces with configurable output modes for LLM-friendly consumption.
Outputs formatted markdown to stdout.

MODES:
    minimal  - Trace ID, name, timestamp, status, total latency
    io       - Input/output of each node + tool calls (DEFAULT - core debugging)
    prompts  - Just LLM prompts and responses (no tool calls)
    flow     - Node names, execution order, timing per node
    full     - Everything including costs, tokens, metadata

RETRIEVAL:
    --trace-id ID     Single trace by ID
    --last N          Last N traces (default: 1)
    --case ID         Filter by case_id metadata
    --tags TAG...     Filter by tags

EXAMPLES:
    python trace_retriever.py --last 2
    python trace_retriever.py --trace-id abc123 --mode prompts
    python trace_retriever.py --last 5 --case 0001 --mode flow
"""

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

sys.path.insert(0, str(Path(__file__).parent))
from langfuse_client import get_langfuse_client


# =============================================================================
# OUTPUT MODES - Define what each mode includes
# =============================================================================

MODE_CONFIGS = {
    "minimal": {
        "description": "Quick overview - IDs, names, status, timing",
        "trace_fields": ["id", "name", "timestamp", "status"],
        "include_observations": False,
        "include_latency": True,
    },
    "io": {
        "description": "Core debugging - node inputs/outputs and tool calls",
        "trace_fields": ["id", "name", "timestamp"],
        "include_observations": True,
        "observation_fields": ["name", "type", "input", "output", "status_message", "level"],
        "include_latency": False,
        "include_tokens": False,
        "include_costs": False,
    },
    "prompts": {
        "description": "LLM prompts and responses only",
        "trace_fields": ["id", "name", "timestamp"],
        "include_observations": True,
        "observation_fields": ["name", "input", "output"],
        "observation_filter": lambda obs: obs.get("type") == "GENERATION",
        "include_latency": False,
    },
    "flow": {
        "description": "Execution flow with timing per node",
        "trace_fields": ["id", "name", "timestamp"],
        "include_observations": True,
        "observation_fields": ["name", "type", "start_time", "end_time"],
        "include_latency": True,
        "include_tokens": False,
    },
    "full": {
        "description": "Everything - for deep investigation",
        "trace_fields": ["id", "name", "timestamp", "metadata", "tags"],
        "include_observations": True,
        "observation_fields": None,  # All fields
        "include_latency": True,
        "include_tokens": True,
        "include_costs": True,
    },
}


# =============================================================================
# TRACE RETRIEVAL
# =============================================================================

def retrieve_trace_by_id(trace_id: str) -> Optional[Dict]:
    """Fetch a single trace by ID."""
    client = get_langfuse_client()
    try:
        trace = client.api.trace.get(trace_id)
        if trace:
            return trace.dict() if hasattr(trace, "dict") else dict(trace)
        return None
    except Exception as e:
        print(f"Error fetching trace {trace_id}: {e}", file=sys.stderr)
        return None


def get_trace_score(trace_id: str, score_name: str) -> Optional[float]:
    """
    Get a specific score value for a trace.

    Args:
        trace_id: The trace ID to get scores for
        score_name: The name of the score to retrieve

    Returns:
        The score value if found, None otherwise
    """
    client = get_langfuse_client()
    try:
        response = client.api.scores.get_many(trace_id=trace_id)
        if hasattr(response, "data") and response.data:
            for score in response.data:
                score_dict = score.dict() if hasattr(score, "dict") else dict(score)
                if score_dict.get("name") == score_name:
                    return score_dict.get("value")
        return None
    except Exception as e:
        print(f"Warning: Could not fetch scores for {trace_id}: {e}", file=sys.stderr)
        return None


def retrieve_last_traces(
    limit: int = 1,
    case_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    days: int = 7,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    score_name: str = "quality_score"
) -> List[Dict]:
    """
    Fetch the last N traces, optionally filtered.

    Args:
        limit: Maximum number of traces to return
        case_id: Filter by case_id in metadata
        tags: Filter by tags
        days: Look back N days
        min_score: Only include traces with score >= this value
        max_score: Only include traces with score <= this value
        score_name: Name of score to filter by (default: quality_score)
    """
    client = get_langfuse_client()

    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)

    # Fetch more traces if filtering by score (client-side filtering)
    fetch_limit = limit * 5 if (min_score is not None or max_score is not None) else limit

    params = {
        "limit": fetch_limit,
        "from_timestamp": start_time,
        "to_timestamp": end_time,
    }
    if tags:
        params["tags"] = tags

    try:
        response = client.api.trace.list(**params)
        traces = []
        if hasattr(response, "data") and response.data:
            for trace in response.data:
                trace_dict = trace.dict() if hasattr(trace, "dict") else dict(trace)

                # Filter by case_id if specified (client-side filter)
                if case_id:
                    metadata = trace_dict.get("metadata", {}) or {}
                    if metadata.get("case_id") != case_id:
                        continue

                # Filter by score if specified (client-side filter)
                if min_score is not None or max_score is not None:
                    score_value = get_trace_score(trace_dict["id"], score_name)
                    if score_value is None:
                        continue  # Skip traces without the specified score
                    if min_score is not None and score_value < min_score:
                        continue
                    if max_score is not None and score_value > max_score:
                        continue
                    # Store score in trace dict for display
                    trace_dict["_filtered_score"] = {
                        "name": score_name,
                        "value": score_value
                    }

                traces.append(trace_dict)
                if len(traces) >= limit:
                    break
        return traces
    except Exception as e:
        print(f"Error fetching traces: {e}", file=sys.stderr)
        return []


def retrieve_observations_for_trace(trace_id: str) -> List[Dict]:
    """Fetch all observations for a single trace."""
    client = get_langfuse_client()

    all_observations = []
    page = 1

    while True:
        try:
            response = client.api.observations.get_many(
                trace_id=trace_id,
                limit=100,
                page=page
            )
            if not hasattr(response, "data") or not response.data:
                break

            for obs in response.data:
                obs_dict = obs.dict() if hasattr(obs, "dict") else dict(obs)
                all_observations.append(obs_dict)

            if len(response.data) < 100:
                break
            page += 1

        except Exception as e:
            print(f"Error fetching observations for {trace_id}: {e}", file=sys.stderr)
            break

    # Sort by start_time for execution order
    all_observations.sort(key=lambda x: x.get("start_time") or "")
    return all_observations


# =============================================================================
# OUTPUT FORMATTING
# =============================================================================

def format_value(value: Any, indent: int = 0) -> str:
    """Format a value for markdown output, handling nested structures."""
    prefix = "  " * indent

    if value is None:
        return f"{prefix}_none_"

    if isinstance(value, str):
        # Truncate very long strings
        if len(value) > 2000:
            return f"{prefix}{value[:2000]}... _(truncated, {len(value)} chars total)_"
        # Handle multiline strings
        if "\n" in value:
            lines = value.split("\n")
            return "\n".join(f"{prefix}{line}" for line in lines)
        return f"{prefix}{value}"

    if isinstance(value, (int, float, bool)):
        return f"{prefix}{value}"

    if isinstance(value, list):
        if not value:
            return f"{prefix}_empty list_"
        if len(value) <= 3 and all(isinstance(x, (str, int, float)) for x in value):
            return f"{prefix}{value}"
        lines = [f"{prefix}- {format_value(item, 0)}" for item in value[:10]]
        if len(value) > 10:
            lines.append(f"{prefix}- _... and {len(value) - 10} more items_")
        return "\n".join(lines)

    if isinstance(value, dict):
        if not value:
            return f"{prefix}_empty dict_"
        # For nested dicts, show key: value pairs
        lines = []
        for k, v in list(value.items())[:20]:
            formatted_v = format_value(v, 0)
            if "\n" in formatted_v:
                lines.append(f"{prefix}**{k}**:")
                lines.append(format_value(v, indent + 1))
            else:
                lines.append(f"{prefix}**{k}**: {formatted_v.strip()}")
        if len(value) > 20:
            lines.append(f"{prefix}_... and {len(value) - 20} more keys_")
        return "\n".join(lines)

    return f"{prefix}{str(value)}"


def compute_latency_ms(obs: Dict) -> Optional[int]:
    """Calculate latency in milliseconds from start/end times."""
    start = obs.get("start_time")
    end = obs.get("end_time")
    if not start or not end:
        return None
    try:
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", "+00:00"))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace("Z", "+00:00"))
        delta = end - start
        return int(delta.total_seconds() * 1000)
    except Exception:
        return None


def format_observation_io(obs: Dict, config: Dict) -> str:
    """Format a single observation for io/prompts mode."""
    lines = []

    name = obs.get("name", "unnamed")
    obs_type = obs.get("type", "SPAN")
    level = obs.get("level", "")

    # Header with type indicator
    type_icon = {"GENERATION": "🤖", "SPAN": "📦", "EVENT": "⚡"}.get(obs_type, "•")
    level_indicator = f" [{level}]" if level and level != "DEFAULT" else ""
    lines.append(f"### {type_icon} {name}{level_indicator}")
    lines.append("")

    # Input
    input_val = obs.get("input")
    if input_val:
        lines.append("**Input:**")
        lines.append("```")
        lines.append(format_value(input_val))
        lines.append("```")
        lines.append("")

    # Output
    output_val = obs.get("output")
    if output_val:
        lines.append("**Output:**")
        lines.append("```")
        lines.append(format_value(output_val))
        lines.append("```")
        lines.append("")

    # Status message (errors)
    status_msg = obs.get("status_message")
    if status_msg:
        lines.append(f"**Status:** {status_msg}")
        lines.append("")

    return "\n".join(lines)


def format_observation_flow(obs: Dict) -> str:
    """Format a single observation for flow mode."""
    name = obs.get("name", "unnamed")
    obs_type = obs.get("type", "SPAN")
    latency = compute_latency_ms(obs)

    type_icon = {"GENERATION": "🤖", "SPAN": "📦", "EVENT": "⚡"}.get(obs_type, "•")
    latency_str = f" ({latency}ms)" if latency else ""

    return f"- {type_icon} **{name}**{latency_str}"


def format_observation_full(obs: Dict) -> str:
    """Format a single observation for full mode."""
    lines = []

    name = obs.get("name", "unnamed")
    obs_type = obs.get("type", "SPAN")

    lines.append(f"### {name} ({obs_type})")
    lines.append("")

    # All fields
    skip_fields = {"id", "trace_id", "parent_observation_id"}
    for key, value in obs.items():
        if key in skip_fields:
            continue
        if value is not None:
            lines.append(f"**{key}:**")
            lines.append("```")
            lines.append(format_value(value))
            lines.append("```")
            lines.append("")

    return "\n".join(lines)


def format_trace(trace: Dict, observations: List[Dict], mode: str) -> str:
    """Format a complete trace with observations according to mode."""
    config = MODE_CONFIGS[mode]
    lines = []

    # Trace header
    trace_id = trace.get("id", "unknown")
    trace_name = trace.get("name", "unnamed")
    timestamp = trace.get("timestamp", "")

    lines.append(f"## Trace: {trace_name}")
    lines.append(f"**ID:** `{trace_id}`")
    lines.append(f"**Timestamp:** {timestamp}")

    # Show score if filtered by score
    filtered_score = trace.get("_filtered_score")
    if filtered_score:
        lines.append(f"**{filtered_score['name']}:** {filtered_score['value']:.1f}")

    # Mode-specific trace fields
    if mode == "full":
        metadata = trace.get("metadata")
        if metadata:
            lines.append(f"**Metadata:** {format_value(metadata)}")
        tags = trace.get("tags")
        if tags:
            lines.append(f"**Tags:** {tags}")

    if config.get("include_latency") and observations:
        # Calculate total latency from first to last observation
        start_times = [o.get("start_time") for o in observations if o.get("start_time")]
        end_times = [o.get("end_time") for o in observations if o.get("end_time")]
        if start_times and end_times:
            try:
                first = min(start_times)
                last = max(end_times)
                if isinstance(first, str):
                    first = datetime.fromisoformat(first.replace("Z", "+00:00"))
                if isinstance(last, str):
                    last = datetime.fromisoformat(last.replace("Z", "+00:00"))
                total_ms = int((last - first).total_seconds() * 1000)
                lines.append(f"**Total Duration:** {total_ms}ms")
            except Exception:
                pass

    lines.append("")
    lines.append("---")
    lines.append("")

    # Observations
    if not config.get("include_observations"):
        return "\n".join(lines)

    if not observations:
        lines.append("_No observations found_")
        return "\n".join(lines)

    # Apply observation filter if specified
    obs_filter = config.get("observation_filter")
    if obs_filter:
        observations = [o for o in observations if obs_filter(o)]

    if not observations:
        lines.append("_No matching observations_")
        return "\n".join(lines)

    lines.append(f"### Observations ({len(observations)})")
    lines.append("")

    for obs in observations:
        if mode == "flow":
            lines.append(format_observation_flow(obs))
        elif mode == "full":
            lines.append(format_observation_full(obs))
        else:  # io, prompts
            lines.append(format_observation_io(obs, config))

    return "\n".join(lines)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Surgical Langfuse trace retrieval with output modes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Output Modes:
  minimal   Quick overview - IDs, names, status, timing
  io        Core debugging - node inputs/outputs and tool calls (DEFAULT)
  prompts   LLM prompts and responses only
  flow      Execution flow with timing per node
  full      Everything - for deep investigation

Score Filtering:
  --max-score 7.0        Find failing traces (score <= 7.0)
  --min-score 8.5        Find high-quality traces (score >= 8.5)
  --score-name NAME      Filter by specific score (default: quality_score)

Examples:
  %(prog)s --last 2
  %(prog)s --trace-id abc123 --mode prompts
  %(prog)s --last 5 --case 0001 --mode flow
  %(prog)s --last 20 --case 0001 --max-score 7.0 --mode minimal  # Find failures
  %(prog)s --last 10 --min-score 9.0 --mode minimal              # Find successes
        """
    )

    # Retrieval options (mutually exclusive)
    retrieval = parser.add_mutually_exclusive_group()
    retrieval.add_argument(
        "--trace-id",
        help="Retrieve specific trace by ID"
    )
    retrieval.add_argument(
        "--last",
        type=int,
        default=1,
        help="Retrieve last N traces (default: 1)"
    )

    # Filters
    parser.add_argument(
        "--case",
        help="Filter by case_id metadata"
    )
    parser.add_argument(
        "--tags",
        nargs="+",
        help="Filter by tags"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Look back N days (default: 7)"
    )

    # Score filtering
    parser.add_argument(
        "--min-score",
        type=float,
        help="Filter traces with score >= this value (e.g., 8.5 for high-quality)"
    )
    parser.add_argument(
        "--max-score",
        type=float,
        help="Filter traces with score <= this value (e.g., 7.0 for failing)"
    )
    parser.add_argument(
        "--score-name",
        default="quality_score",
        help="Score name to filter by (default: quality_score)"
    )

    # Output mode
    parser.add_argument(
        "--mode",
        choices=list(MODE_CONFIGS.keys()),
        default="io",
        help="Output mode (default: io)"
    )

    args = parser.parse_args()

    # Retrieve traces
    if args.trace_id:
        trace = retrieve_trace_by_id(args.trace_id)
        if not trace:
            print(f"Trace not found: {args.trace_id}", file=sys.stderr)
            sys.exit(1)
        traces = [trace]
    else:
        traces = retrieve_last_traces(
            limit=args.last,
            case_id=args.case,
            tags=args.tags,
            days=args.days,
            min_score=args.min_score,
            max_score=args.max_score,
            score_name=args.score_name
        )
        if not traces:
            print("No traces found matching criteria", file=sys.stderr)
            sys.exit(1)

    # Output header
    mode_desc = MODE_CONFIGS[args.mode]["description"]
    print(f"# Langfuse Traces")
    print(f"**Mode:** {args.mode} - {mode_desc}")
    print(f"**Retrieved:** {len(traces)} trace(s)")

    # Show score filter if active
    if args.min_score is not None or args.max_score is not None:
        score_filter_parts = []
        if args.min_score is not None:
            score_filter_parts.append(f">= {args.min_score}")
        if args.max_score is not None:
            score_filter_parts.append(f"<= {args.max_score}")
        print(f"**Score Filter:** {args.score_name} {' and '.join(score_filter_parts)}")
    print("")
    print("=" * 60)
    print("")

    # Format and output each trace
    for trace in traces:
        trace_id = trace.get("id")

        # Fetch observations if needed
        if MODE_CONFIGS[args.mode].get("include_observations"):
            observations = retrieve_observations_for_trace(trace_id)
        else:
            observations = []

        # Format and print
        output = format_trace(trace, observations, args.mode)
        print(output)
        print("")
        print("=" * 60)
        print("")


if __name__ == "__main__":
    main()
