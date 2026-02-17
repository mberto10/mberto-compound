---
name: langfuse-experiment-runner
description: This skill should be used when the user asks to "run experiment", "evaluate dataset", "test prompts on dataset", "compare experiment runs", "analyze experiment results", "use langfuse judges", or needs to execute and analyze experiments on Langfuse datasets with LLM-as-judge evaluators stored in Langfuse.
---

# Langfuse Experiment Runner

Run experiments on datasets with evaluators stored in Langfuse or custom scripts. Analyze results and compare runs.

**Key Feature:** Judge prompts can be stored in Langfuse for versioning and reuse across experiments.

## Score Scale Policy

- Canonical score scale is `0-1`.
- If judge outputs `0-10`, runner normalizes to `0-1` before aggregation and threshold checks.
- Reports may display both representations (e.g., `0.82 (8.2/10)`), but gating logic uses canonical `0-1`.

## When to Use

- Running experiments on Langfuse datasets
- Evaluating prompt/model changes against test sets
- Comparing multiple experiment runs
- Analyzing score distributions and failures
- Building regression test workflows

## Operations

### Run Experiment

Execute a task on every item in a dataset with evaluators.

#### Using Langfuse Judges (Recommended)

Store judge prompts in Langfuse for versioning and reuse:

```bash
# Auto-discover all judge-* prompts in Langfuse
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --task-script /path/to/my_task.py \
  --use-langfuse-judges

# Or specify which judges to use
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --task-script /path/to/my_task.py \
  --judges judge-accuracy judge-helpfulness
```

**How it works:**
1. Judge prompts are stored in Langfuse (created via `/setup-dataset` or prompt-management)
2. Prompts use `{{input}}`, `{{output}}`, `{{expected_output}}` placeholders
3. Prompts return JSON: `{"score": 0-10, "reasoning": "..."}`
4. The experiment runner loads prompts and creates evaluators automatically

**Judge discovery order:**
1. If `--judges` specified, use those exact prompt names
2. If dataset has `judge_prompts` in metadata, use those
3. Otherwise, auto-discover all prompts starting with `judge-`
3. Otherwise, auto-discover all prompts starting with `judge-`

#### Live Mode Experiments (No Dataset)

Run experiments on recent production traces (live data) without creating a permanent dataset first.
This fetches the last N traces, creates an ephemeral dataset (e.g., `live-run-name`), and runs the experiment.

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --run-name "live-test-v1" \
  --task-script /path/to/my_task.py \
  --source-type live \
  --sample-size 10 \
  --use-langfuse-judges
```

**Arguments:**
- `--source-type live`: Switch to live trace mode (default is `dataset`)
- `--sample-size N`: Number of recent traces to fetch (default: 10)
- `--dataset`: Ignored in live mode (an ephemeral dataset is created automatically)

#### Using Local Evaluator Scripts

For custom evaluation logic not suited for LLM judges:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --task-script /path/to/my_task.py \
  --evaluator-script /path/to/my_evaluators.py \
  --max-concurrency 5
```

#### Combined: Both Langfuse Judges and Local Evaluators

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --task-script /path/to/my_task.py \
  --use-langfuse-judges \
  --evaluator-script /path/to/custom_checks.py
```

**Arguments:**
- `--dataset` - Name of the Langfuse dataset (required)
- `--run-name` - Unique name for this run (required)
- `--task-script` - Python script with `task()` function (required)
- `--use-langfuse-judges` - Auto-discover and use judge prompts from Langfuse
- `--judges` - Specific Langfuse judge prompt names to use
- `--evaluator-script` - Local Python script with evaluator functions
- `--max-concurrency` - Parallel executions (default: 5)
- `--description` - Run description

### List Runs

See all experiment runs for a dataset:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  list-runs --dataset "my-regression-tests"
```

### Get Run Details

Get full details of a specific run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  get-run --dataset "my-regression-tests" --run-name "v2.1-test"
```

### Compare Runs

Compare score distributions across runs:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  compare \
  --dataset "my-regression-tests" \
  --runs "v2.0-test" "v2.1-test" "v2.2-test"
```

### Analyze Run

Deep-dive into run results with failure analysis:

```bash
# Show all low-scoring items
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  analyze \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --show-failures

# Filter by specific score threshold
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  analyze \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --score-name accuracy \
  --score-threshold 0.7
```

### Analyze Run with Annotation Comments

For optimization workflows, **always include human annotation comments** in the analysis. Comments often reveal issues invisible in score values.

```bash
# Step 1: Get run failures
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  analyze \
  --dataset "my-regression-tests" \
  --run-name "v2.1-test" \
  --show-failures

# Step 2: Fetch annotation comments for deeper insight
python3 ${CLAUDE_PLUGIN_ROOT}/skills/annotation-manager/helpers/annotation_manager.py \
  list-scores --name "<score_name>" --limit 50
```

**Why include comments:**
- Human annotation comments contain the "why" behind scores
- Categorize comments by theme before investigating individual failures
- Theme frequency (e.g., "7/11 comments mentioned X") often reveals the real issue
- This frequently reframes the entire analysis priority

**Best practice:** Fetch and categorize ALL annotation comments BEFORE diving into technical trace investigation.

## Writing Task Scripts

The task script defines what to execute for each dataset item. It must contain a `task` function:

```python
# my_task.py

def task(*, item, **kwargs):
    """
    Execute task on a dataset item.

    Args:
        item: DatasetItemClient with:
            - item.input: The input data
            - item.expected_output: Expected output (if set)
            - item.metadata: Item metadata

    Returns:
        The output to be evaluated
    """
    from openai import OpenAI

    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Answer the question accurately."},
            {"role": "user", "content": item.input}
        ]
    )

    return response.choices[0].message.content
```

### Task Script Examples

**Simple LLM call:**
```python
def task(*, item, **kwargs):
    from langfuse.openai import OpenAI
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": item.input}]
    )
    return response.choices[0].message.content
```

**Using a Langfuse prompt:**
```python
def task(*, item, **kwargs):
    from langfuse import Langfuse
    from openai import OpenAI

    langfuse = Langfuse()
    prompt = langfuse.get_prompt("my-prompt", label="production")

    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt.prompt},
            {"role": "user", "content": item.input}
        ]
    )
    return response.choices[0].message.content
```

**Custom pipeline:**
```python
def task(*, item, **kwargs):
    from my_pipeline import run_pipeline
    return run_pipeline(item.input, config=item.metadata)
```

## Writing Evaluator Scripts

Evaluator scripts define how to score outputs. Export evaluators in an `EVALUATORS` list:

```python
# my_evaluators.py
from langfuse import Evaluation

def exact_match(*, output, expected_output, **kwargs) -> Evaluation:
    """Check if output exactly matches expected."""
    match = output.strip() == expected_output.strip() if expected_output else False
    return Evaluation(
        name="exact_match",
        value=1.0 if match else 0.0,
        comment="Exact match" if match else "No match"
    )

def contains_expected(*, output, expected_output, **kwargs) -> Evaluation:
    """Check if expected output is contained in response."""
    if not expected_output:
        return Evaluation(name="contains", value=0.0, comment="No expected output")

    contained = expected_output.lower() in output.lower()
    return Evaluation(
        name="contains",
        value=1.0 if contained else 0.0
    )

def response_length(*, output, **kwargs) -> Evaluation:
    """Measure response length (normalized)."""
    length = len(output)
    # Normalize: 0-100 chars = 0.0, 100-500 = 0.5, 500+ = 1.0
    if length < 100:
        score = length / 100 * 0.5
    elif length < 500:
        score = 0.5 + (length - 100) / 400 * 0.5
    else:
        score = 1.0

    return Evaluation(name="length", value=score, comment=f"{length} chars")

# Export evaluators to use
EVALUATORS = [exact_match, contains_expected, response_length]
```

### Evaluator Function Signature

```python
def my_evaluator(
    *,
    output: Any,           # Task output
    expected_output: Any,  # Expected output from dataset item
    input: Any,            # Original input
    **kwargs               # Additional context
) -> Evaluation:
    return Evaluation(
        name="evaluator_name",  # Score name in Langfuse
        value=0.0,              # Numeric score (typically 0-1)
        comment="Optional"      # Optional explanation
    )
```

### LLM-as-Judge Evaluator

```python
# llm_judge_evaluators.py
from langfuse import Evaluation

def llm_judge(*, input, output, expected_output, **kwargs) -> Evaluation:
    """Use an LLM to evaluate response quality."""
    from openai import OpenAI

    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """Rate the response quality on a scale of 0-10.

Consider:
- Accuracy: Does it match the expected answer?
- Completeness: Does it fully address the question?
- Clarity: Is it well-written and understandable?

Output only a number 0-10."""
            },
            {
                "role": "user",
                "content": f"""Question: {input}

Expected Answer: {expected_output}

Actual Response: {output}

Score (0-10):"""
            }
        ],
        temperature=0
    )

    try:
        score = float(response.choices[0].message.content.strip()) / 10.0
        score = max(0.0, min(1.0, score))  # Clamp to 0-1
    except:
        score = 0.0

    return Evaluation(name="llm_judge", value=score)

EVALUATORS = [llm_judge]
```

## Common Workflows

### Workflow 1: A/B Test Prompts

```bash
# Create dataset if needed
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  create --name "prompt-test" --description "Prompt A/B testing"

# Add test items
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-item --dataset "prompt-test" \
  --input "What is machine learning?" \
  --expected-output "Machine learning is..."

# Run with prompt A
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "prompt-test" \
  --run-name "prompt-a-test" \
  --task-script ./task_prompt_a.py \
  --evaluator-script ./evaluators.py

# Run with prompt B
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "prompt-test" \
  --run-name "prompt-b-test" \
  --task-script ./task_prompt_b.py \
  --evaluator-script ./evaluators.py

# Compare results
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  compare \
  --dataset "prompt-test" \
  --runs "prompt-a-test" "prompt-b-test"
```

### Workflow 2: Regression Testing

```bash
# Run baseline
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "regression-suite" \
  --run-name "v1.0-baseline" \
  --task-script ./my_task.py \
  --evaluator-script ./evaluators.py

# After changes, run new version
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "regression-suite" \
  --run-name "v1.1-candidate" \
  --task-script ./my_task.py \
  --evaluator-script ./evaluators.py

# Compare to ensure no regressions
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  compare \
  --dataset "regression-suite" \
  --runs "v1.0-baseline" "v1.1-candidate"

# Investigate any failures
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  analyze \
  --dataset "regression-suite" \
  --run-name "v1.1-candidate" \
  --show-failures
```

### Workflow 3: Model Comparison

```bash
# Test GPT-4
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "model-eval" \
  --run-name "gpt4-test" \
  --task-script ./task_gpt4.py \
  --evaluator-script ./quality_evaluators.py

# Test Claude
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  run \
  --dataset "model-eval" \
  --run-name "claude-test" \
  --task-script ./task_claude.py \
  --evaluator-script ./quality_evaluators.py

# Compare results
python3 ${CLAUDE_PLUGIN_ROOT}/skills/experiment-runner/helpers/experiment_runner.py \
  compare \
  --dataset "model-eval" \
  --runs "gpt4-test" "claude-test"
```

## Required Environment Variables

```bash
LANGFUSE_PUBLIC_KEY=pk-...    # Required
LANGFUSE_SECRET_KEY=sk-...    # Required
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional

# For LLM-based evaluators or tasks
OPENAI_API_KEY=sk-...         # If using OpenAI
ANTHROPIC_API_KEY=...         # If using Anthropic
```

## Troubleshooting

**Task script not found:**
- Use absolute path or path relative to current directory
- Ensure file has `.py` extension

**Evaluator not running:**
- Check that `EVALUATORS` list is defined and exported
- Verify evaluator functions have correct signature

**Low scores across all items:**
- Check if expected_output is set in dataset items
- Review evaluator logic for edge cases
- Use `--show-failures` to inspect individual items

**Experiment runs slowly:**
- Reduce `--max-concurrency` if hitting rate limits
- Check for slow external API calls in task
- Consider using faster models for evaluation

**No scores in results:**
- Ensure evaluator returns `Evaluation` objects
- Check evaluator function signature matches expected kwargs
