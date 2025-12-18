# Optimization Cycle Playbook

Complete workflow for detecting issues, diagnosing root causes, curating datasets, fixing configs, and validating improvements.

## The 5-Step Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DETECT: Surface low-quality traces                          │
│     └─→ Filter by score thresholds, annotation feedback         │
├─────────────────────────────────────────────────────────────────┤
│  2. DIAGNOSE: Root cause analysis                               │
│     └─→ Trace retrieval → symptom classification → code lookup  │
├─────────────────────────────────────────────────────────────────┤
│  3. CURATE: Create regression dataset                           │
│     └─→ Extract failing traces into dataset items               │
├─────────────────────────────────────────────────────────────────┤
│  4. FIX: Modify config/tools                                    │
│     └─→ guard.yaml, tools.yaml, tool implementations            │
├─────────────────────────────────────────────────────────────────┤
│  5. VALIDATE: Run experiment against dataset                    │
│     └─→ Compare scores before/after fix                         │
└─────────────────────────────────────────────────────────────────┘
```

Repeat until quality targets met.

---

## Step 1: DETECT - Surface Low-Quality Traces

**Goal**: Find traces with quality issues

**Commands**:
```bash
# Get failing traces (score <= 7.0) for a specific case
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --case 0001 --max-score 7.0 --mode minimal

# Get failing traces across all cases
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 30 --max-score 7.0 --mode minimal

# Filter by specific score name
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --max-score 7.0 --score-name editor_final_score --mode minimal
```

**Output**: List of trace IDs with low scores and basic metadata

**Decision Point**:
- If < 5 failures → Investigate individually (Step 2)
- If >= 5 failures → Consider batch analysis and dataset creation

---

## Step 2: DIAGNOSE - Root Cause Analysis

**Goal**: Identify why traces failed

**Commands**:
```bash
# Get full trace details with inputs/outputs
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <failing_trace_id> --mode io

# Check prompts specifically
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <failing_trace_id> --mode prompts

# Check execution flow and timing
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <failing_trace_id> --mode flow
```

**Analysis Checklist**:

| Symptom | Check For | Likely Fix |
|---------|-----------|------------|
| Missing data | Tool not called, empty results | Add to required_tools |
| Wrong tool | Incorrect tool selected | Update research pattern |
| Style mismatch | Validation violations | Strengthen guard.yaml |
| Execution error | Error observations, timeouts | Fix tool config/API |

**Common Patterns**:
- **Missing Data**: Tool not in `required_tools` in tools.yaml
- **Wrong Endpoint**: Incorrect API endpoint in research pattern
- **Style Drift**: Foundation too vague in guard.yaml
- **API Failure**: Rate limiting, auth issues, timeout

**Generate Report** (optional):
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/analysis/helpers/report_generator.py \
  --symptom "Missing earnings data in output" \
  --category research_gap \
  --trace-id <trace_id> \
  --case-id 0001 \
  --root-cause "finnhub.calendar_earnings not in required_tools"
```

---

## Step 3: CURATE - Create Regression Dataset

**Goal**: Build test set from failing traces for validation

**Commands**:

### 3a. Create Dataset
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create \
  --name "case_0001_regressions" \
  --description "Failing traces for earnings data issue" \
  --metadata '{"case_id": "0001", "issue": "missing_earnings"}'
```

### 3b. Add Traces (Option A: Single Trace)
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace \
  --dataset "case_0001_regressions" \
  --trace-id <trace_id> \
  --expected-score 9.0 \
  --failure-reason "Missing earnings calendar data"
```

### 3b. Add Traces (Option B: Batch from File)
```bash
# First, save trace IDs to a file (one per line)
# failing_traces.txt:
# trace_id_1
# trace_id_2
# trace_id_3

python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-batch \
  --dataset "case_0001_regressions" \
  --trace-file failing_traces.txt \
  --expected-score 9.0
```

### 3c. Verify Dataset
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  get --name "case_0001_regressions"
```

**Best Practices**:
- Use descriptive names: `case_{id}_{issue_type}`
- Set realistic expected scores (usually 9.0 for fixed issues)
- Add failure_reason metadata for debugging
- Start with 5-10 items, expand if needed

---

## Step 4: FIX - Modify Configuration

**Goal**: Apply config changes to address root cause

### Example Fixes by Issue Type

#### Fix 1: Add Missing Tool to Required List

**File**: `writing_ecosystem/config/cases/0001/tools.yaml`

```yaml
tool_configuration:
  required_tools:
    - perplexity
    - finnhub
    - finnhub.calendar_earnings  # Added
  optional_tools:
    - exa
```

#### Fix 2: Update Research Pattern

**File**: `writing_ecosystem/config/cases/0001/tools.yaml`

```yaml
research_patterns:
  patterns:
    default:
      steps:
        - tool: finnhub
          input:
            endpoint: calendar_earnings
            from: "{{today}}"
            to: "{{today_plus_14_days}}"
          save_as: earnings_calendar
        - tool: perplexity
          input:
            query: "{{topic}}"
```

#### Fix 3: Strengthen Style Foundation

**File**: `writing_ecosystem/config/cases/0001/guard.yaml`

```yaml
foundation:
  voice_and_tone:
    tone: "skeptical"
    formality: "semi-formal"
    specific_requirements:
      - "Always include numerical data to support claims"
      - "Reference specific metrics from research data"
```

### Manual Validation (Optional)

Before running the full experiment, test manually:

```bash
cd /home/runner/workspace
python run_workflow.py --case 0001 --ticker MSFT --topic "Microsoft Stock Analysis"
```

---

## Step 5: VALIDATE - Run Experiment

**Goal**: Verify fixes improved quality across the dataset

**Commands**:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Add earnings calendar tool" \
  --description "Added finnhub.calendar_earnings to required tools" \
  --evaluators quality_score word_count
```

**Interpret Results**:

| Pass Rate | Interpretation | Next Action |
|-----------|----------------|-------------|
| >= 80% | **Success** | Review remaining failures, consider deploying |
| 50-79% | **Partial** | Investigate failing items, apply additional fixes |
| < 50% | **Failure** | Root cause incomplete, return to Step 2 |

**If Successful**:
1. Review remaining failures individually
2. Consider expanding dataset with edge cases
3. Document fix in config changelog
4. Deploy changes

**If Not Successful**:
1. Get trace IDs of still-failing items from report
2. Return to Step 2 with new failing traces
3. Consider if expected scores are realistic

---

## Full Cycle Example: Missing Earnings Data

### Initial State
- **Symptom**: Case 0001 traces missing earnings calendar data
- **Quality Score**: 6.2/10 (threshold: 9.0)

### Step 1: DETECT
```bash
python3 trace_retriever.py --last 20 --case 0001 --max-score 7.0 --mode minimal
# Output: 8 traces with scores 6.0-6.8
```

### Step 2: DIAGNOSE
```bash
python3 trace_retriever.py --trace-id abc123 --mode io
# Analysis: finnhub.calendar_earnings never called
# Root cause: Not in required_tools or research pattern
```

### Step 3: CURATE
```bash
# Create dataset
python3 dataset_manager.py create --name "case_0001_regressions"

# Extract trace IDs from Step 1 output, save to failing.txt

# Add traces
python3 dataset_manager.py add-batch --dataset "case_0001_regressions" --trace-file failing.txt
```

### Step 4: FIX
Edit `tools.yaml`:
- Add `finnhub.calendar_earnings` to required_tools
- Add research pattern step for earnings calendar

### Step 5: VALIDATE
```bash
python3 experiment_runner.py \
  --dataset "case_0001_regressions" \
  --name "Fix: Earnings Calendar" \
  --evaluators quality_score word_count
```

**Result**: 7/8 items pass (87.5%)
- Avg quality score: 9.1 (up from 6.2)
- 1 failure: Different issue (API timeout) → Start new cycle for this issue

---

## Tips & Gotchas

### Do's
- **Start small**: 5-10 items per dataset initially
- **Isolate variables**: Fix one thing per cycle
- **Document changes**: Note what changed and why
- **Use metadata**: Tag experiments with config versions
- **Monitor costs**: Experiments run full workflows

### Don'ts
- **Don't skip diagnosis**: Random fixes waste time
- **Don't set unrealistic expectations**: If traces scored 6.0, expecting 10.0 may be too aggressive
- **Don't batch too many changes**: Hard to know what helped

### Expect Iteration
- Rarely fixed in one cycle
- Fixing one thing may expose another
- Quality improvement is incremental

---

## Automation Potential (Future)

This playbook describes a manual cycle. Future enhancements:
- Auto-detect failing traces on schedule
- Auto-create datasets from failure patterns
- Suggest config changes based on common issues
- CI/CD integration for regression testing

---

## Quick Reference

### DETECT
```bash
python3 trace_retriever.py --last 20 --case <case_id> --max-score 7.0 --mode minimal
```

### DIAGNOSE
```bash
python3 trace_retriever.py --trace-id <id> --mode io
```

### CURATE
```bash
python3 dataset_manager.py create --name "case_<id>_regressions"
python3 dataset_manager.py add-batch --dataset "case_<id>_regressions" --trace-file ids.txt
```

### FIX
Edit `tools.yaml` or `guard.yaml` based on diagnosis

### VALIDATE
```bash
python3 experiment_runner.py --dataset "case_<id>_regressions" --name "Fix: <description>"
```
