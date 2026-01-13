---
name: optimize-bootstrap
description: Bootstrap optimization infrastructure from human feedback or production traces. Use when you have annotations/traces but lack automated graders or a curated dataset.
arguments:
  - name: agent
    description: Name of the agent to bootstrap optimization for
    required: false
  - name: skip-dataset
    description: Skip dataset creation if you already have one
    required: false
---

# Optimization Bootstrap Command

You are helping the user build the evaluation infrastructure needed for the full optimization loop. This command is for users who have:
- Human annotations/feedback but no automated graders
- Production traces but no curated dataset
- Freeform feedback that needs to be structured

## Step 1: Assess Current State

Ask the user what they have available:

```
Let's figure out what you're starting with:

1. **Traces**: Do you have Langfuse traces from your agent?
   [ ] Yes, production traces exist
   [ ] No, need to set up tracing first

2. **Human Feedback**: What form does your feedback take?
   [ ] Langfuse annotations (scores on traces)
   [ ] Annotation queue (traces flagged for review)
   [ ] Freeform feedback (Slack, email, tickets)
   [ ] No feedback yet

3. **Dataset**: Do you have an evaluation dataset?
   [ ] Yes, in Langfuse
   [ ] Yes, local files (JSON/CSV)
   [ ] No dataset yet

4. **Graders**: Do you have automated evaluation?
   [ ] Yes, LLM judges configured
   [ ] Yes, code-based checks
   [ ] No automated grading
```

Use AskUserQuestion to gather this information.

## Step 2: Route to Appropriate Workflow

Based on assessment, follow the appropriate path:

### Path A: No Traces Yet

If user doesn't have Langfuse tracing:

```
You need tracing before we can bootstrap optimization.

Use the langfuse-analyzer instrumentation-setup skill to add tracing:
1. Add Langfuse SDK to your agent
2. Instrument key operations
3. Run a few test cases to generate traces
4. Return here once you have traces

Would you like guidance on instrumentation setup?
```

### Path B: Traces + Human Annotations → Build Graders

If user has traces with human scores but no automated graders:

**Step B.1: Analyze annotation patterns**

```bash
# Export existing human annotations
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/annotation-manager/helpers/annotation_manager.py \
  export --score-name "<score_name>" --days 30 --format json
```

Review the exported annotations to understand:
- Score distribution (what's the range?)
- Common patterns in high-scoring vs low-scoring traces
- Comments/reasoning from annotators

**Step B.2: Sample traces for grader development**

```bash
# Get high-quality examples
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --min-score 9.0 --mode io

# Get low-quality examples
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --max-score 5.0 --mode io
```

**Step B.3: Draft grader prompt**

Based on the patterns observed, help user create a grader:

```
Based on your human annotations, here's a draft grader prompt:

---
You are evaluating an AI agent's response quality.

Score from 1-10 based on:
- [Criteria derived from annotation patterns]
- [Criteria derived from annotation patterns]
- [Criteria derived from annotation patterns]

Examples of good responses (score 9+):
[Insert examples from high-scoring traces]

Examples of poor responses (score 5 or below):
[Insert examples from low-scoring traces]
---

Does this capture what your human annotators were evaluating?
```

**Step B.4: Create grader in Langfuse**

Guide user to create the grader prompt in Langfuse for version control.

### Path C: Traces but No Dataset → Curate Dataset

If user has traces but no dataset:

**Step C.1: Identify good candidates**

```bash
# Find diverse, representative traces
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 50 --mode minimal
```

Help user identify:
- Different input types/categories
- Edge cases
- Known failure modes
- Representative production traffic

**Step C.2: Create dataset**

Guide user through dataset creation:

```python
from langfuse import Langfuse
lf = Langfuse()

# Create dataset
dataset = lf.create_dataset(
    name="<agent>-eval-v1",
    description="Initial evaluation dataset for <agent>",
    metadata={"source": "bootstrap", "created": "<today>"}
)

# Add items from selected traces
for trace_id in selected_traces:
    trace = lf.get_trace(trace_id)
    # Note: use lf.create_dataset_item(), not dataset.create_item()
    lf.create_dataset_item(
        dataset_name="<agent>-eval-v1",
        input=trace.input,
        expected_output=trace.output,  # Or manually corrected output
        metadata={"source_trace": trace_id}
    )
```

Target: 20-30 diverse items for initial dataset.

### Path D: Freeform Feedback → Structure First

If user has freeform feedback (Slack, tickets, etc.):

**Step D.1: Categorize feedback**

Help user categorize their feedback:

```
Let's structure your freeform feedback. Common categories:

| Category | Description | Example |
|----------|-------------|---------|
| Accuracy | Wrong information | "It gave me the wrong date" |
| Completeness | Missing information | "It didn't mention X" |
| Tone | Style/voice issues | "Too formal for our brand" |
| Format | Output structure | "Should be bullet points" |
| Hallucination | Made-up content | "That feature doesn't exist" |

Review your feedback and tag each item with a category.
```

**Step D.2: Find corresponding traces**

For each feedback item, locate the trace:

```bash
# Search by time range or user
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --filter-field user_id --filter-value "<user>" --mode minimal
```

**Step D.3: Create annotations**

Convert freeform feedback to structured annotations:

```bash
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/annotation-manager/helpers/annotation_manager.py \
  create-score \
  --trace-id "<trace_id>" \
  --name "quality" \
  --value <score> \
  --comment "<original feedback + category>"
```

Then proceed to Path B (build graders from annotations).

## Step 3: Validate Setup

Once graders and dataset are ready, validate:

**Run a test evaluation:**

```python
from langfuse import Langfuse
lf = Langfuse()

dataset = lf.get_dataset("<dataset_name>")

# Run agent on 5 items
for item in dataset.items[:5]:
    output = run_agent(item.input)
    # Score with new grader
    # Compare to expected_output
```

**Check grader alignment:**

Compare automated scores to human annotations:
- Do they correlate?
- Are there systematic disagreements?
- Adjust grader if needed

## Step 4: Transition to Full Loop

Once validated:

```
Bootstrap complete! You now have:
- Dataset: <name> (<N> items)
- Grader: <grader_name>
- Baseline ready to establish

You're ready for the full optimization loop.
Run `/optimize --agent <agent>` to begin systematic improvement.
```

Update or create the optimization journal to skip re-bootstrapping:

```yaml
meta:
  agent_name: "<name>"
  bootstrap_completed: "<today>"
  bootstrap_source: "human_annotations|traces|freeform"

  dataset:
    name: "<dataset_name>"
    items: <count>

  graders:
    - name: "<grader_name>"
      type: "llm_judge"
      derived_from: "human_annotations"

current_phase: "init"
```

## Output Format

Report progress clearly:

```
## Bootstrap Progress: <agent>

### Assessment
- Traces: ✓ Available
- Human feedback: ✓ Annotations in Langfuse
- Dataset: ✗ Needs creation
- Graders: ✗ Needs creation

### Completed
1. ✓ Exported 45 human annotations
2. ✓ Analyzed score patterns
3. ✓ Created grader prompt
4. → Creating dataset...

### Next Step
Select 20-30 traces for initial dataset.

[Continue] [Pause for now]
```

## Error Handling

- **No traces found:** Guide to instrumentation-setup skill
- **Insufficient annotations:** Suggest annotation workflow first
- **Grader doesn't align:** Iterate on grader prompt with more examples
- **Dataset too small:** Help identify more traces to add
