---
name: langfuse-dataset-management
description: This skill should be used when the user asks to "create dataset", "add trace to dataset", "curate regression tests", "build test set from traces", "list datasets", "show dataset items", or needs to manage Langfuse datasets for experiment validation and regression testing.
---

# Langfuse Dataset Management

Create and manage regression test datasets from production traces for validation and testing.

## When to Use

- Curating failing traces into regression datasets
- Building golden test sets from high-quality examples
- Adding specific traces to existing datasets
- Listing available datasets and their items
- Preparing data for validation testing

## Naming Convention

**Recommended format:** `{project}_{purpose}` or `{workflow}_{purpose}`

Examples:
- `checkout_regressions` - Failing traces for checkout flow
- `api_v2_golden_set` - High-quality verified outputs
- `auth_edge_cases` - Edge cases for authentication workflow

## Operations

### Create Dataset

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "checkout_regressions" \
  --description "Failing traces for checkout flow issues" \
  --metadata '{"project": "checkout", "purpose": "regression"}'
```

### Add Single Trace

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "checkout_regressions" \
  --trace-id abc123def456 \
  --expected-score 9.0
```

### Add with Custom Expected Output

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "checkout_regressions" \
  --trace-id abc123def456 \
  --expected-output '{"min_score": 9.0, "required_fields": ["summary", "recommendations"]}'
```

### Add Multiple Traces (Batch)

```bash
# Create file with trace IDs (one per line)
echo "trace_id_1
trace_id_2
trace_id_3" > failing_traces.txt

python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "checkout_regressions" \
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
  --name "checkout_regressions"
```

## Python SDK Note

When using the Langfuse Python SDK directly (not via CLI), use the correct method for adding items:

```python
from langfuse import Langfuse
lf = Langfuse()

# Correct: use lf.create_dataset_item()
lf.create_dataset_item(
    dataset_name="checkout_regressions",
    input={"query": "example input"},
    expected_output={"min_score": 9.0},
    metadata={"source_trace_id": "abc123"}
)

# Incorrect: dataset.create_item() does not exist in the SDK
# dataset = lf.get_dataset("checkout_regressions")
# dataset.create_item(...)  # ← This will fail!
```

**Key difference:** The SDK method is `lf.create_dataset_item()` with `dataset_name` as a parameter, not `dataset.create_item()` on a dataset object.

## Dataset Item Structure

When adding a trace to a dataset, the tool extracts:

**Input** (from trace):
The trace's input data merged with its metadata. All fields from the original trace are preserved.

**Expected Output** (from arguments):
```json
{
  "min_score": 9.0
}
```

Or custom expectations:
```json
{
  "min_score": 8.5,
  "required_fields": ["summary", "recommendations"]
}
```

**Metadata** (automatic):
```json
{
  "source_trace_id": "abc123",
  "added_date": "2025-12-19",
  "original_score": 6.2
}
```

## Common Workflows

### Workflow 1: Create Regression Dataset from Failing Traces

1. **Find failing traces** (using data-retrieval skill):
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --max-score 7.0 --mode minimal
```

2. **Create dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "checkout_regressions" \
  --description "Failing traces for checkout fixes"
```

3. **Extract trace IDs** (from step 1 output) and save to file

4. **Add traces to dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "checkout_regressions" \
  --trace-file failing_ids.txt \
  --expected-score 9.0
```

### Workflow 2: Build Golden Test Set

1. **Find high-quality traces**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --min-score 9.0 --mode minimal
```

2. **Create golden set dataset**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "api_golden_set" \
  --description "Verified high-quality outputs for baseline"
```

3. **Add traces**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "api_golden_set" \
  --trace-file golden_ids.txt \
  --expected-score 9.0
```

### Workflow 3: Add Specific Failing Trace

When you identify a specific failure during investigation:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "checkout_regressions" \
  --trace-id problematic_trace_id_here \
  --expected-score 9.0 \
  --failure-reason "Payment processing timeout"
```

## Required Environment Variables

Same as data-retrieval skill:

```bash
LANGFUSE_PUBLIC_KEY=pk-...    # Required
LANGFUSE_SECRET_KEY=sk-...    # Required
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional
```

## Troubleshooting

**Dataset already exists:**
- Use a different name or delete the existing dataset from Langfuse UI

**Trace not found:**
- Verify trace ID is correct
- Check that trace is within the retention period

**Rate limiting:**
- When adding many traces, the tool may hit API rate limits
- Consider adding traces in smaller batches
