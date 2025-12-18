---
name: langfuse-experiment-runner
description: This skill should be used when the user asks to "run experiment", "validate against dataset", "test config changes", "compare before/after", "run regression tests", or needs to execute writing workflow experiments with automatic evaluation.
---

# Langfuse Experiment Runner

Execute writing ecosystem workflows against datasets with automatic tracing and evaluation.

## When to Use

- Validating config changes against regression datasets
- Comparing before/after performance
- Running regression tests after fixes
- Measuring quality improvements

## Basic Usage

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Add earnings calendar tool"
```

## Full Options

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Add earnings calendar tool" \
  --description "Added finnhub.calendar_earnings to required tools" \
  --evaluators quality_score word_count \
  --max-concurrency 2 \
  --metadata '{"config_version": "v2.1"}'
```

## Built-in Evaluators

### quality_score (default)
Compares output `quality_score` to expected minimum from dataset item.

**Passes when:** `actual_score >= expected_output.min_quality_score`

### word_count (default)
Validates output meets minimum word count from dataset item.

**Passes when:** `len(final_article.split()) >= expected_output.min_word_count`

## Experiment Report Output

The runner outputs a markdown report:

```markdown
# Experiment Results: Fix: Add earnings calendar tool

**Dataset:** case_0001_regressions
**Items:** 5
**Run Name:** fix_earnings_v1

## Summary

| Metric | Value |
|--------|-------|
| Items Processed | 5 |
| Pass Rate | 80% (4/5) |
| Avg Quality Score | 8.7 |
| Total Duration | 45.2s |

## Item Results

### Item 1: MSFT Analysis ✅
- **Quality:** 9.2/10 (expected >= 9.0)
- **Word Count:** 1050 (expected >= 800)
- **Trace ID:** `abc123...`

### Item 2: GOOGL Analysis ❌
- **Quality:** 6.8/10 (expected >= 9.0)
- **Word Count:** 920 (expected >= 800)
- **Trace ID:** `def456...`
- **Issues:** quality_score below threshold

## Failed Items

| Item | Expected | Actual | Reason |
|------|----------|--------|--------|
| GOOGL | >= 9.0 | 6.8 | Quality score below threshold |

## Next Steps

1. Review failed item traces in Langfuse
2. Investigate root cause of Item 2 failure
3. Apply additional fixes if needed
4. Re-run experiment
```

## Common Workflows

### Workflow 1: Validate Config Change

1. **Make config change** (e.g., add tool to tools.yaml)

2. **Run experiment against regression dataset:**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Add earnings calendar tool" \
  --metadata '{"change": "added finnhub.calendar_earnings"}'
```

3. **Review results:**
   - Pass rate >= 80%: Fix is working
   - Pass rate < 80%: Investigate remaining failures

### Workflow 2: Before/After Comparison

1. **Run baseline experiment (before changes):**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Baseline - Before Changes" \
  --metadata '{"version": "baseline"}'
```

2. **Make config changes**

3. **Run comparison experiment:**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "After - Fixed Earnings Tool" \
  --metadata '{"version": "v2"}'
```

4. **Compare pass rates and avg scores**

### Workflow 3: Full Optimization Cycle

See the **optimization_cycle playbook** for the complete 5-step workflow:
```
DETECT → DIAGNOSE → CURATE → FIX → VALIDATE
```

## Viewing Results in Langfuse

After running an experiment:

1. Go to Langfuse → Datasets → Select dataset
2. Click "Runs" tab
3. Find your experiment run by name
4. View per-item results with linked traces

## Required Environment Variables

Same as other Langfuse skills, plus writing ecosystem dependencies:

```bash
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
OPENROUTER_API_KEY=...  # For workflow execution
# Plus any other API keys needed by the case
```

## Performance Notes

- **Concurrency:** Default `max_concurrency=2` to avoid API rate limits
- **Duration:** Each item runs a full workflow (~10-30s depending on case)
- **API Costs:** Experiments run real workflows with LLM calls

Recommended dataset sizes:
- Regression tests: 5-10 items
- Golden sets: 3-5 items
- Large tests: 20+ items (use higher concurrency carefully)

## Troubleshooting

**"Dataset not found":**
- Verify dataset name matches exactly
- Use `dataset_manager.py list` to see available datasets

**"Workflow execution failed":**
- Check API keys are configured
- Verify case configuration is valid
- Check Langfuse traces for error details

**Low pass rates after fix:**
- Review failed item traces
- May need additional fixes
- Check if expected scores are realistic

**Timeout errors:**
- Reduce `--max-concurrency`
- Check if specific items are hitting slow APIs
