---
name: langfuse-data-retrieval
description: This skill should be used when the user asks to "get langfuse traces", "fetch trace data", "retrieve last traces", "show me the trace", "debug a trace", "analyze trace ID", "what happened in trace", or needs to pull Langfuse observability data for debugging or analysis. Provides surgical trace retrieval with multiple output modes to avoid overwhelming context.
---

# Langfuse Data Retrieval

Surgical extraction of Langfuse traces with output modes that filter to what matters. Outputs formatted markdown optimized for LLM consumption.

## When to Use

- Debugging a specific trace or recent workflow runs
- Understanding what inputs/outputs flowed through a pipeline
- Investigating tool calls and their results
- Quick overview of recent trace activity

## Output Modes

| Mode | What It Shows | Use When |
|------|---------------|----------|
| `io` | Node inputs/outputs + tool calls | **Default** - Core debugging |
| `minimal` | Trace ID, name, timestamp, status | Quick listing |
| `prompts` | LLM prompts and responses only | Prompt quality analysis |
| `flow` | Node names, order, timing | Performance investigation |
| `full` | Everything (costs, tokens, metadata) | Deep investigation |

The `io` mode is the default and recommended mode - it shows the substance of what happened without metrics bloat.

## Retrieval Methods

### Single Trace by ID

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id abc123def456
```

### Last N Traces

```bash
# Last 1 trace (default)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py --last 1

# Last 3 traces
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py --last 3
```

### Filtered Retrieval

```bash
# By case ID
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 2 --case 0001

# By tags
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 5 --tags production case:0001

# Custom time range
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --days 3
```

### Score-Based Filtering

Filter traces by quality scores for optimization workflows:

```bash
# Find failing traces (quality score <= 7.0)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --case 0001 --max-score 7.0 --mode minimal

# Find high-quality traces for golden sets (score >= 9.0)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --min-score 9.0 --mode minimal

# Filter by specific score name
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --min-score 8.0 --score-name editor_final_score

# Combined: failing traces for a specific case
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 30 --case 0001 --max-score 7.0 --mode minimal
```

**Score filtering options:**
- `--min-score FLOAT` - Include traces with score >= value
- `--max-score FLOAT` - Include traces with score <= value
- `--score-name NAME` - Score name to filter by (default: `quality_score`)

**Note:** Score filtering is client-side, so the tool fetches more traces initially to ensure it can return enough matching results. Traces without the specified score are excluded.

## Mode Examples

### io Mode (Default)

Shows node inputs/outputs and tool calls without metrics:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id abc123 --mode io
```

Output includes:
- Each node's input and output
- Tool/function calls with their inputs and results
- Error messages and status
- No: token counts, costs, latencies, verbose metadata

### prompts Mode

Focus on LLM interactions only:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 1 --mode prompts
```

### flow Mode

Understand execution order and timing:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 1 --mode flow
```

### minimal Mode

Quick overview without observation details:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --mode minimal
```

## Required Environment Variables

```bash
LANGFUSE_PUBLIC_KEY=pk-...    # Required
LANGFUSE_SECRET_KEY=sk-...    # Required
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional, defaults to cloud
```

Test connection:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/langfuse_client.py
```

## Common Workflows

### Debug a Failing Trace

1. Get the trace ID from Langfuse dashboard or logs
2. Retrieve with io mode to see full flow:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <id> --mode io
```

### Review Recent Activity

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 5 --mode minimal
```

### Compare Before/After

```bash
# Get traces before change
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <before_id> --mode io

# Get traces after change
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <after_id> --mode io
```

### Investigate Tool Selection

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 1 --case 0001 --mode io
```

Look for tool call observations to see which tools were selected and their outputs.

### Curate Regression Dataset

Identify failing traces for dataset curation:

```bash
# Step 1: Find failing traces
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --case 0001 --max-score 7.0 --mode minimal

# Step 2: Investigate specific failing trace
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <failing_trace_id> --mode io

# Step 3: Use the trace IDs with dataset-management skill to create regression tests
```

## Output Format

The retriever outputs formatted markdown to stdout with:

- Trace header (ID, name, timestamp)
- Observations in execution order (flat list)
- Mode-appropriate field selection
- Truncation of very long values (>2000 chars)
- Clear section separators

## Troubleshooting

**No traces found:**
- Check time range with `--days`
- Verify case ID or tags exist
- Confirm Langfuse credentials are correct

**Connection errors:**
- Test with `python3 helpers/langfuse_client.py`
- Verify environment variables are set
- Check LANGFUSE_HOST if using self-hosted

**Too much output:**
- Use `--mode minimal` for overview
- Use `--mode prompts` to focus on LLM calls
- Reduce `--last N` count
