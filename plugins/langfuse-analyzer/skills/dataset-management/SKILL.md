---
name: langfuse-dataset-management
description: This skill should be used when the user asks to "create dataset", "add trace to dataset", "curate regression tests", "build test set from traces", "list datasets", "show dataset items", or needs to manage Langfuse datasets for experiment validation and regression testing.
---

# Langfuse Dataset Management

Create and manage regression test datasets from production traces for experiment validation.

## When to Use

- Curating failing traces into regression datasets
- Building golden test sets from high-quality examples
- Adding specific traces to existing datasets
- Listing available datasets and their items
- Preparing data for experiment validation

## Naming Convention

**Recommended format:** `case_{case_id}_{purpose}`

Examples:
- `case_0001_regressions` - Failing traces for German stock analysis
- `case_0001_golden_set` - High-quality verified outputs
- `case_0005_edge_cases` - Edge cases for The Prep workflow

## Operations

### Create Dataset

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "case_0001_regressions" \
  --description "Failing traces for earnings data issue" \
  --metadata '{"case_id": "0001", "purpose": "regression"}'
```

### Add Single Trace

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "case_0001_regressions" \
  --trace-id abc123def456 \
  --expected-score 9.0
```

### Add Multiple Traces (Batch)

```bash
# Create file with trace IDs (one per line)
echo "trace_id_1
trace_id_2
trace_id_3" > failing_traces.txt

python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "case_0001_regressions" \
  --trace-file failing_traces.txt \
  --expected-score 9.0
```

### List All Datasets

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py list
```

### Get Dataset Items

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  get \
  --name "case_0001_regressions"
```

## Dataset Item Structure

When adding a trace to a dataset, the tool extracts:

**Input** (from trace):
```json
{
  "case_id": "0001",
  "ticker": "MSFT",
  "topic": "Microsoft Stock Analysis",
  "brief": {...}
}
```

**Expected Output** (from arguments):
```json
{
  "min_quality_score": 9.0,
  "min_word_count": 800
}
```

**Metadata** (automatic):
```json
{
  "source_trace_id": "abc123",
  "added_date": "2025-12-06",
  "original_score": 6.2
}
```

## Common Workflows

### Workflow 1: Create Regression Dataset from Failing Traces

1. **Find failing traces** (using data-retrieval skill):
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --case 0001 --max-score 7.0 --mode minimal
```

2. **Create dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "case_0001_regressions" \
  --description "Failing traces for earnings calendar fix"
```

3. **Extract trace IDs** (from step 1 output) and save to file

4. **Add traces to dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "case_0001_regressions" \
  --trace-file failing_ids.txt \
  --expected-score 9.0
```

### Workflow 2: Build Golden Test Set

1. **Find high-quality traces**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --case 0001 --min-score 9.0 --mode minimal
```

2. **Create golden set dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "case_0001_golden_set" \
  --description "Verified high-quality outputs for baseline"
```

3. **Add traces**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "case_0001_golden_set" \
  --trace-file golden_ids.txt \
  --expected-score 9.0
```

### Workflow 3: Add Specific Failing Trace

When you identify a specific failure during investigation:

```bash
# Add the trace directly
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "case_0001_regressions" \
  --trace-id problematic_trace_id_here \
  --expected-score 9.0 \
  --failure-reason "Missing earnings calendar data"
```

## Required Environment Variables

Same as data-retrieval skill:

```bash
LANGFUSE_PUBLIC_KEY=pk-...    # Required
LANGFUSE_SECRET_KEY=sk-...    # Required
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional
```

## Integration with Experiment Runner

After creating a dataset, use the experiment-runner skill to validate fixes:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Add earnings calendar tool"
```

## Troubleshooting

**Dataset already exists:**
- Use a different name or delete the existing dataset from Langfuse UI

**Trace not found:**
- Verify trace ID is correct
- Check that trace is within the retention period

**Missing input fields:**
- Some traces may have incomplete metadata
- The tool will use available fields and warn about missing ones

**Rate limiting:**
- When adding many traces, the tool may hit API rate limits
- Consider adding traces in smaller batches
