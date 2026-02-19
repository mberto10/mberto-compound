# Experiment Design Reference

Guidelines for implementing changes and running controlled experiments.

---

## Experiment Principles

### 1. Isolation

Change ONE variable at a time. If you change multiple things:
- Can't know which helped
- Can't know which hurt
- Can't learn for future iterations

### 2. Controlled Comparison

Always compare against:
- **Baseline:** Original performance
- **Previous iteration:** Most recent performance

Use the SAME dataset for fair comparison.

### 3. Reproducibility

Document everything:
- Exact change made
- Dataset used
- Model/version if relevant
- Any environmental factors

### 4. Statistical Validity

For non-deterministic agents:
- Run multiple trials per item (k=3 minimum)
- Report pass@k (at least one success) and pass^k (all succeed)
- Large enough dataset (20+ items minimum)

---

## Pre-Experiment Checklist

Before running the experiment:

```
□ Hypothesis is documented in journal
□ Change is clearly defined (what, where)
□ Baseline metrics are recorded
□ Dataset is ready (same as baseline)
□ Judges/evaluators are configured
□ Rollback plan is clear
□ Experiment naming convention decided
```

---

## Implementing Changes

### Prompt Changes (Langfuse)

```python
from langfuse import Langfuse

lf = Langfuse()

# 1. Get current production prompt
current = lf.get_prompt("<prompt_name>", label="production")

# 2. Prepare updated content
new_content = """
<your updated prompt>
"""

# 3. Create new version with experiment label
lf.create_prompt(
    name="<prompt_name>",
    prompt=new_content,
    config=current.config,  # Preserve config
    labels=[f"experiment-v{iteration}"]
)

# 4. Update your agent to use this version
# Either by label or by fetching latest
```

**Langfuse Prompt Versioning:**
- Each `create_prompt` creates a new version
- Labels identify which version to use
- `production` label = current live version
- `experiment-vN` label = iteration N test version

### Prompt Changes (Local Files)

```python
# 1. Read current prompt
with open("prompts/system.txt", "r") as f:
    original = f.read()

# 2. Backup original
with open(f"prompts/system.txt.backup-v{iteration}", "w") as f:
    f.write(original)

# 3. Write updated prompt
with open("prompts/system.txt", "w") as f:
    f.write(updated_content)

# 4. Document the diff
# Save to journal or iteration record
```

### Code Changes

For code changes, keep them minimal and isolated:

```python
# BAD: Multiple changes
def process_query(query):
    query = preprocess(query)  # Change 1
    result = agent.run(query, max_tokens=2000)  # Change 2
    return postprocess(result)  # Change 3

# GOOD: Single change, clearly marked
def process_query(query):
    # EXPERIMENT v3: Add preprocessing for long queries
    if len(query) > 4000:
        query = chunk_and_summarize(query)
    # END EXPERIMENT

    result = agent.run(query)
    return result
```

---

## Smoke Testing

Before full experiment, verify the change is active:

### Quick Validation

```python
# Pick a test case that SHOULD behave differently
test_input = "<input that should trigger new behavior>"

# Run once
output = agent.run(test_input)

# Check:
# - Did it use the new behavior?
# - Any errors?
# - Output reasonable?
```

### Smoke Test Checklist

```
□ Agent runs without errors
□ New behavior is observable
□ Simple case works as expected
□ No obvious regressions on basic input
□ Trace shows expected execution path
```

### What to Look For

**Good signs:**
- New instructions followed
- Expected tool used
- Output format correct
- Latency acceptable

**Red flags (don't proceed):**
- Errors or crashes
- New behavior not appearing
- Severe latency increase
- Output quality obviously worse

---

## Running the Experiment

### Experiment Naming Convention

```
v{iteration}-{hypothesis-slug}

Examples:
- v1-reasoning-step
- v2-tool-guidance
- v3-context-chunking
```

### Execution Script Template

```python
from langfuse import Langfuse
from datetime import datetime

lf = Langfuse()

# Configuration
DATASET_NAME = "<your_dataset>"
RUN_NAME = f"v{iteration}-{slug}"
HYPOTHESIS = "<your hypothesis statement>"

# Get dataset
dataset = lf.get_dataset(DATASET_NAME)

# Create run metadata
run_metadata = {
    "iteration": iteration,
    "hypothesis": HYPOTHESIS,
    "change_type": "<prompt|tool|code>",
    "change_location": "<location>",
    "timestamp": datetime.now().isoformat()
}

# Execute on each item
results = []
for item in dataset.items:
    try:
        # Run your agent
        output = run_agent(item.input)

        # Record result
        result = {
            "item_id": item.id,
            "input": item.input,
            "output": output,
            "expected": item.expected_output,
            "status": "success"
        }

    except Exception as e:
        result = {
            "item_id": item.id,
            "input": item.input,
            "output": None,
            "error": str(e),
            "status": "error"
        }

    results.append(result)

# Scores will be applied by Langfuse judges automatically
# Or run local evaluators
```

### Handling Non-Determinism

For agents with variable outputs:

```python
K = 3  # Number of trials per item

for item in dataset.items:
    trials = []
    for trial in range(K):
        output = run_agent(item.input)
        score = evaluate(output, item.expected_output)
        trials.append({"output": output, "score": score})

    # Calculate metrics
    scores = [t["score"] for t in trials]
    pass_at_k = any(s >= threshold for s in scores)  # At least one passed
    pass_pow_k = all(s >= threshold for s in scores)  # All passed

    record_result(item, trials, pass_at_k, pass_pow_k)
```

### Monitoring Progress

During experiment:
- Watch for errors
- Check latency is reasonable
- Verify scores are being recorded
- Note any anomalies

```python
# Simple progress tracking
total = len(dataset.items)
for i, item in enumerate(dataset.items):
    print(f"Processing {i+1}/{total}: {item.id}")
    # ... run experiment ...

    if (i+1) % 10 == 0:
        print(f"  Completed: {i+1}, Errors: {error_count}")
```

---

## Collecting Results

### From Langfuse

```python
# Get run results
run = lf.get_dataset_run(DATASET_NAME, RUN_NAME)

# Aggregate scores
scores_by_name = {}
for item_run in run.items:
    for score in item_run.scores:
        if score.name not in scores_by_name:
            scores_by_name[score.name] = []
        scores_by_name[score.name].append(score.value)

# Calculate metrics
metrics = {}
for name, values in scores_by_name.items():
    metrics[name] = {
        "mean": sum(values) / len(values),
        "min": min(values),
        "max": max(values),
        "pass_rate": sum(1 for v in values if v >= threshold) / len(values)
    }
```

### Calculating Deltas

```python
# Load previous results from journal
previous = journal.iterations[-1].results if journal.iterations else journal.meta.baseline

# Calculate deltas
deltas = {}
for metric in metrics:
    if metric in previous:
        deltas[metric] = metrics[metric]["mean"] - previous[metric]
```

### Results Summary Format

```yaml
results:
  # Absolute values
  accuracy: 0.81
  latency_p95: 2.3
  cost_avg: 0.017

  # Distribution
  accuracy_distribution:
    min: 0.4
    p25: 0.75
    p50: 0.85
    p75: 0.90
    max: 1.0

  # Pass rates
  pass_rate: 0.81
  pass_at_3: 0.92  # If running multiple trials
  pass_pow_3: 0.68

  # Changes
  delta:
    accuracy: +0.03
    latency_p95: -0.1
    cost_avg: -0.001

  # Experiment info
  items_run: 53
  errors: 0
  duration: "12m 34s"
```

---

## Error Handling

### Common Issues

**API Errors:**
```python
import time

def run_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError:
            time.sleep(2 ** attempt)
        except APIError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(1)
    raise Exception("Max retries exceeded")
```

**Timeout Handling:**
```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Agent timed out")

def run_with_timeout(func, timeout_seconds=60):
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout_seconds)
    try:
        return func()
    finally:
        signal.alarm(0)
```

**Partial Failure:**
- Record which items failed
- Continue with remaining items
- Note failures in results
- Can re-run failed items later

---

## Post-Experiment Checklist

After experiment completes:

```
□ All items processed (or failures noted)
□ Scores recorded in Langfuse
□ Results aggregated
□ Deltas calculated
□ Journal updated with results
□ Ready for ANALYZE phase
```

---

## Experiment Documentation Template

```yaml
experiment:
  run_name: "v3-context-chunking"
  hypothesis_id: 3
  date: "2024-01-20"

  setup:
    dataset: "agent-regression-v2"
    items: 53
    trials_per_item: 1
    judges: ["accuracy", "latency", "cost"]

  change_applied:
    type: "code"
    location: "src/agent/preprocessor.py"
    description: "Added input chunking for queries > 4000 tokens"
    verified_active: true

  execution:
    started: "2024-01-20T10:00:00"
    completed: "2024-01-20T10:45:00"
    duration: "45m"
    errors: 0
    notes: "Smooth run, no issues"

  results:
    accuracy: 0.87
    latency_p95: 2.1
    cost_avg: 0.019

    delta_from_baseline:
      accuracy: +0.15
      latency_p95: 0.0
      cost_avg: +0.004

    delta_from_previous:
      accuracy: +0.06
      latency_p95: -0.2
      cost_avg: +0.002

  observations:
    - "Long queries now process successfully"
    - "Slight cost increase from chunking overhead"
    - "Latency actually improved (fewer retries)"
```
