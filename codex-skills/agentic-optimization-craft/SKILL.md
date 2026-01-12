---
name: agentic-optimization-craft
description: Use this skill when the user invokes /optimize, /optimize-bootstrap, asks to "improve my agent", "run optimization loop", "iterate on agent quality", "systematic agent improvement", "bootstrap optimization", "build evaluation infrastructure", or needs guidance on hypothesis-driven optimization cycles. Provides the full methodology for iterative AI agent improvement in Codex, including bootstrap workflows for users without existing datasets or graders.
---

# Agentic Optimization Craft

A systematic methodology for iterative AI agent improvement through hypothesis-driven experimentation. This skill guides you through the complete optimization loop with persistent state.

## The Core Philosophy

**Evaluation-first development:** Create evaluations BEFORE making changes. This prevents solving imaginary problems and provides clear signal on whether changes helped.

**Hypothesis-driven iteration:** Every change starts with a specific, testable hypothesis. No shotgun debugging or random prompt tweaks.

**Compounding returns:** Each iteration makes both the agent AND the evaluation system better. Failures become test cases, learnings accumulate.

Reference: `references/compounding-methodology.md`

---

## The Optimization Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                  THE OPTIMIZATION LOOP                          │
│                                                                 │
│                      ┌──────────────┐                           │
│                      │              │                           │
│         ┌───────────▶│  HYPOTHESIZE │◀─── What will improve it? │
│         │            │              │                           │
│         │            └──────┬───────┘                           │
│         │                   │                                   │
│         │                   ▼                                   │
│         │            ┌──────────────┐                           │
│         │            │              │                           │
│         │            │  EXPERIMENT  │◀─── Test the hypothesis   │
│         │            │              │                           │
│         │            └──────┬───────┘                           │
│         │                   │                                   │
│         │                   ▼                                   │
│         │            ┌──────────────┐                           │
│         │            │              │                           │
│         │            │   ANALYZE    │◀─── Did it work? Why?     │
│         │            │              │                           │
│         │            └──────┬───────┘                           │
│         │                   │                                   │
│         │                   ▼                                   │
│         │            ┌──────────────┐                           │
│         │            │              │                           │
│         └────────────│   COMPOUND   │◀─── Capture learnings     │
│                      │              │                           │
│                      └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Phase | Goal | Output |
|-------|------|--------|
| BOOTSTRAP | Build missing infrastructure | Dataset + graders ready |
| INITIALIZE | Establish baseline | Journal with baseline metrics |
| HYPOTHESIZE | Formulate testable improvement | Documented hypothesis + change plan |
| EXPERIMENT | Test the hypothesis | Evaluation results |
| ANALYZE | Understand results | Validated/invalidated + findings |
| COMPOUND | Capture value | Grown dataset + learnings |

---

## Phase -1: BOOTSTRAP (Optional)

**Goal:** Build evaluation infrastructure from human feedback or production traces.

**When to use:** Start here if you have:
- Human annotations/feedback but no automated graders
- Production traces but no curated dataset
- Freeform feedback that needs to be structured

**Skip to Phase 0** if you already have a dataset and graders ready.

### Step 1: Assess Current State

Gather information about what exists:

```
Assessment checklist:

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

### Step 2: Route to Appropriate Workflow

Based on assessment, follow the appropriate path:

#### Path A: No Traces Yet

If tracing isn't set up, you need it before bootstrapping:

```
You need tracing before we can bootstrap optimization.

Use the langfuse-instrumentation-setup skill to add tracing:
1. Add Langfuse SDK to your agent
2. Instrument key operations
3. Run a few test cases to generate traces
4. Return here once you have traces
```

#### Path B: Traces + Human Annotations → Build Graders

If you have traces with human scores but no automated graders:

**Step B.1: Analyze annotation patterns**

```bash
# Export existing human annotations
python3 ~/.codex/skills/langfuse-annotation-manager/scripts/annotation_manager.py \
  export --score-name "<score_name>" --days 30 --format json
```

Review the exported annotations to understand:
- Score distribution (what's the range?)
- Common patterns in high-scoring vs low-scoring traces
- Comments/reasoning from annotators

**Step B.2: Sample traces for grader development**

```bash
# Get high-quality examples
python3 ~/.codex/skills/langfuse-data-retrieval/scripts/trace_retriever.py \
  --last 10 --min-score 9.0 --mode io

# Get low-quality examples
python3 ~/.codex/skills/langfuse-data-retrieval/scripts/trace_retriever.py \
  --last 10 --max-score 5.0 --mode io
```

**Step B.3: Draft grader prompt**

Based on the patterns observed, create a grader:

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

Use `langfuse-prompt-management` skill to version-control the grader prompt.

#### Path C: Traces but No Dataset → Curate Dataset

If you have traces but no dataset:

**Step C.1: Identify good candidates**

```bash
# Find diverse, representative traces
python3 ~/.codex/skills/langfuse-data-retrieval/scripts/trace_retriever.py \
  --last 50 --mode minimal
```

Identify:
- Different input types/categories
- Edge cases
- Known failure modes
- Representative production traffic

**Step C.2: Create dataset**

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
    dataset.create_item(
        input=trace.input,
        expected_output=trace.output,  # Or manually corrected output
        metadata={"source_trace": trace_id}
    )
```

Target: 20-30 diverse items for initial dataset.

#### Path D: Freeform Feedback → Structure First

If you have freeform feedback (Slack, tickets, etc.):

**Step D.1: Categorize feedback**

```
Common categories:

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
python3 ~/.codex/skills/langfuse-data-retrieval/scripts/trace_retriever.py \
  --last 20 --filter-field user_id --filter-value "<user>" --mode minimal
```

**Step D.3: Create annotations**

Convert freeform feedback to structured annotations:

```bash
python3 ~/.codex/skills/langfuse-annotation-manager/scripts/annotation_manager.py \
  create-score \
  --trace-id "<trace_id>" \
  --name "quality" \
  --value <score> \
  --comment "<original feedback + category>"
```

Then proceed to Path B (build graders from annotations).

### Step 3: Validate Setup

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

### Step 4: Transition to Full Loop

Once validated, update or create the optimization journal:

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

Report:
```
Bootstrap complete! You now have:
- Dataset: <name> (<N> items)
- Grader: <grader_name>
- Baseline ready to establish

You're ready for the full optimization loop.
Proceed to Phase 0: INITIALIZE to establish baseline.
```

### Bootstrap Output Format

Track progress clearly:

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

### Bootstrap Error Handling

- **No traces found:** Guide to `langfuse-instrumentation-setup` skill
- **Insufficient annotations:** Suggest annotation workflow first
- **Grader doesn't align:** Iterate on grader prompt with more examples
- **Dataset too small:** Help identify more traces to add

---

## Phase 0: INITIALIZE

**Goal:** Establish baseline and create optimization infrastructure.

**Reference:** `references/journal-schema.md`

### Prerequisites Check

Before starting, verify:

1. **Langfuse tracing is active**
   - Agent produces traces in Langfuse
   - Key steps are instrumented (LLM calls, tools, decisions)

2. **Evaluation dataset exists** (or can be created)
   - Existing dataset with 20+ items, OR
   - Production traces to curate from, OR
   - Ability to create synthetic test cases

3. **Success criteria are clear**
   - Primary metric to optimize (accuracy, task completion, etc.)
   - Target value for that metric
   - Constraints that must not regress (latency, cost, etc.)

### Step 1: Discover the Agent

Gather information about the agent:

```
Questions to answer:
- What is the agent's purpose?
- Where is the code? (path to entry point)
- How do you run it? (command, API call, etc.)
- What prompts does it use? (file paths or Langfuse prompt names)
- What tools does it have?
- What are known failure modes?
```

If user doesn't know, help them explore the codebase to find this information.

### Step 2: Confirm Target and Constraints

Ask user to confirm:

```
Target:
- Metric: <e.g., accuracy>
- Current estimate: <e.g., ~70%>
- Goal: <e.g., 90%>

Constraints (must not regress):
- <e.g., latency_p95 < 3s>
- <e.g., cost_avg < $0.02>
```

### Step 3: Establish Baseline

Run initial evaluation to measure current state:

**If dataset exists:**
```python
# Run baseline experiment
from langfuse import Langfuse
lf = Langfuse()

dataset = lf.get_dataset("<dataset_name>")
# Run agent on each item, record scores
# Name the run "baseline"
```

**If no dataset:**
1. Fetch recent production traces
2. Curate 20-30 diverse cases
3. Add expected outputs where determinable
4. Create dataset in Langfuse

Record baseline metrics:
- Primary metric value
- Constraint metric values
- Pass rate distribution
- Notable failure patterns (for first hypothesis)

### Step 4: Create Journal

Create the optimization journal at `.claude/optimization-loops/<agent>/journal.yaml`:

```yaml
meta:
  agent_name: "<name>"
  agent_path: "<path>"
  entry_point: "<how to run>"
  started: "<today's date>"

  target:
    metric: "<primary metric>"
    current: <baseline value>
    goal: <target value>

  constraints:
    - metric: "<constraint 1>"
      limit: "<threshold>"
    - metric: "<constraint 2>"
      limit: "<threshold>"

  baseline:
    <metric1>: <value>
    <metric2>: <value>
    dataset: "<dataset name>"
    run_name: "baseline"
    date: "<today>"

current_phase: "hypothesize"
current_iteration: 0

iterations: []

learnings:
  what_works: []
  what_fails: []
  patterns_discovered: []

dataset_history:
  - iteration: 0
    items_count: <initial count>
    source: "initial"
```

### Step 5: Transition

Update journal: `current_phase: "hypothesize"`

Report to user:
```
Baseline established:
- <metric>: <value> (target: <goal>)
- Dataset: <name> (<N> items)

Ready to begin optimization. First, we'll analyze failures
and formulate a hypothesis for improvement.
```

---

## Phase 1: HYPOTHESIZE

**Goal:** Formulate a specific, testable improvement hypothesis.

**Reference:** `references/hypothesis-patterns.md`

### Step 1: Review Current State

From journal, understand:
- Current metrics vs target (gap to close)
- Previous iteration results (if any)
- Accumulated learnings (what's worked/failed before)

```
Gap Analysis:
- accuracy: 72% → 90% (need +18%)
- Previous iteration: +6% from reasoning step
- Remaining gap: 12%
```

### Step 2: Identify Improvement Opportunity

Analyze failures to find highest-impact opportunity:

**Get failure data:**
```python
# Fetch low-scoring traces from latest run
from langfuse import Langfuse
lf = Langfuse()

traces = lf.fetch_traces(
    filter={
        "scores": [{"name": "<metric>", "operator": "<", "value": <threshold>}]
    },
    limit=20
)
```

**Categorize failures:**
- Group by failure type/pattern
- Count frequency of each pattern
- Estimate impact if fixed

**Prioritize by:**
1. **Frequency** — How often does this fail?
2. **Impact** — How much would fixing it improve target metric?
3. **Tractability** — Can we realistically fix it this iteration?

### Step 3: Formulate Hypothesis

Structure your hypothesis:

```
HYPOTHESIS TEMPLATE:

IF we [specific change]
THEN [target metric] will improve by [expected amount]
BECAUSE [reasoning based on failure analysis]

RISK: [what might get worse]
EVIDENCE: [failure cases that support this hypothesis]
```

**Example:**
```
IF we add explicit tool invocation guidance for math queries
THEN accuracy will improve by ~10%
BECAUSE 18/50 failures (36%) are math queries where the calculator
tool wasn't used despite being available

RISK: May increase prompt length and latency slightly
EVIDENCE: Items 12, 23, 34, 41 all show reasoning attempts
          instead of calculator usage for arithmetic
```

**Hypothesis quality checklist:**
- [ ] Specific change identified (not vague "make it better")
- [ ] Expected impact quantified
- [ ] Based on actual failure data
- [ ] Single change (not multiple changes bundled)
- [ ] Testable with current evaluation setup

### Step 4: Design the Change

Specify exactly what will change:

```yaml
change:
  type: prompt | tool | architecture | retrieval
  location: <file path or langfuse://prompts/<name>>
  description: <specific modification>

  # For prompt changes:
  section: <which part of prompt>
  addition: <what to add>

  # For code changes:
  file: <path>
  function: <name>
  modification: <description>
```

**Rollback plan:**
- How to undo if results are negative
- For Langfuse prompts: revert to previous version
- For code: git revert or manual undo

### Step 5: Update Journal

Add new iteration to journal:

```yaml
iterations:
  - id: <next_id>
    started: "<today>"
    hypothesis:
      statement: "<full hypothesis>"
      expected_impact: "<quantified>"
      risk: "<what might regress>"
      rationale: "<why we believe this>"
      evidence:
        - "<failure item 1>"
        - "<failure item 2>"
    change:
      type: "<type>"
      location: "<location>"
      description: "<description>"
    experiment: null
    results: null
    analysis: null
    compounded: null
```

Update: `current_phase: "experiment"`, `current_iteration: <id>`

### Step 6: Confirm with User

Before proceeding:
```
Proposed Hypothesis (Iteration <N>):

<hypothesis statement>

Change:
- Type: <type>
- Location: <location>
- Description: <description>

Expected: <impact>
Risk: <risk>

Ready to implement and test this hypothesis?
[Yes, proceed] [Let me refine it] [Different hypothesis]
```

---

## Phase 2: EXPERIMENT

**Goal:** Implement the change and run controlled evaluation.

**Reference:** `references/experiment-design.md`

### Step 1: Implement the Change

Based on change type:

**Prompt change (Langfuse):**
```python
from langfuse import Langfuse
lf = Langfuse()

# Get current prompt
current = lf.get_prompt("<name>", label="production")

# Create new version
new_content = """<updated prompt content>"""

lf.create_prompt(
    name="<name>",
    prompt=new_content,
    config=current.config,
    labels=[f"experiment-v{iteration}"]
)
```

**Prompt change (local file):**
- Edit the file directly
- Keep backup of original
- Document exact changes

**Code change:**
- Make minimal, isolated edit
- Ensure no side effects
- Test that agent still runs

### Step 2: Smoke Test

Before full experiment, verify change is active:

```
Smoke test checklist:
[ ] Agent runs without errors
[ ] Change is visible in behavior
[ ] Single test case shows expected difference
[ ] No obvious regressions on simple case
```

Run one or two items manually and inspect traces.

### Step 3: Run Experiment

Execute full evaluation:

```python
from langfuse import Langfuse
lf = Langfuse()

dataset = lf.get_dataset("<dataset_name>")
run_name = f"v{iteration}-{hypothesis_slug}"

# Create dataset run
run = dataset.create_run(
    name=run_name,
    metadata={
        "iteration": iteration,
        "hypothesis": "<statement>",
        "change": "<description>"
    }
)

# Execute on each item
for item in dataset.items:
    # Run your agent
    output = run_agent(item.input)

    # Log to run
    run.log(
        input=item.input,
        output=output,
        expected_output=item.expected_output
    )
```

**Scoring:** Ensure judges/evaluators run on outputs (via Langfuse or custom).

### Step 4: Wait and Collect

- Monitor experiment progress
- Ensure all items complete successfully
- Note any errors or issues

### Step 5: Collect Results

Aggregate metrics:

```python
# Get run results
run = lf.get_dataset_run("<dataset>", "<run_name>")

results = {
    "accuracy": run.aggregate_score("accuracy"),
    "latency_p95": run.aggregate_score("latency", percentile=95),
    # ... other metrics
}

# Calculate deltas
previous = journal.iterations[-1].results if journal.iterations else journal.meta.baseline
deltas = {k: results[k] - previous[k] for k in results}
```

### Step 6: Update Journal

```yaml
experiment:
  run_name: "v<N>-<slug>"
  dataset: "<dataset>"
  date: "<today>"
  items_run: <count>

results:
  accuracy: <value>
  latency_p95: <value>
  cost_avg: <value>

delta:
  accuracy: <+/- value>
  latency_p95: <+/- value>
```

Update: `current_phase: "analyze"`

### Step 7: Report

```
Experiment Complete: v<N>-<slug>

Results:
| Metric | Baseline | Previous | Current | Delta |
|--------|----------|----------|---------|-------|
| accuracy | 72% | 78% | 81% | +3% |
| latency | 2.1s | 2.4s | 2.3s | -0.1s |

<N> items evaluated. Ready to analyze results.
```

---

## Phase 3: ANALYZE

**Goal:** Determine if hypothesis was validated and extract learnings.

**Reference:** `references/analysis-framework.md`

### Step 1: Compare Results

Create comparison table:

| Metric | Baseline | Previous | Current | Delta | Target | Status |
|--------|----------|----------|---------|-------|--------|--------|
| accuracy | 72% | 78% | 81% | +3% | 90% | Gap: 9% |
| latency | 2.1s | 2.4s | 2.3s | -0.1s | <3s | ✓ |
| cost | $0.015 | $0.018 | $0.017 | -$0.001 | <$0.02 | ✓ |

### Step 2: Validate Hypothesis

Answer these questions:

1. **Did target metric improve?**
   - Yes: How much? As expected?
   - No: Stayed flat or regressed?

2. **Were constraints maintained?**
   - Any constraint violations?
   - Close to any limit?

3. **Was improvement as expected?**
   - Met expectations: Hypothesis validated
   - Some improvement but less: Partially validated
   - No improvement: Hypothesis invalidated
   - Regression: Hypothesis backfired

**Verdict:** `validated | partially_validated | invalidated | backfired`

### Step 3: Investigate Failures

Even if metrics improved, failures remain. Investigate them:

**Retrieve failures:**
```python
# Get items that still failed
failures = [item for item in run.items if item.scores["accuracy"] < threshold]
```

**For deep analysis, use the optimization-analyst agent:**
```
Launch optimization-analyst agent to investigate:
- Run name: <run_name>
- Failure items: <list>
- Question: What patterns exist in remaining failures?
```

**Or manual investigation:**
For top 3-5 failures:
1. Retrieve full trace
2. Walk through execution step by step
3. Identify where it went wrong
4. Categorize the failure type

### Step 4: Pattern Extraction

Group failures by pattern:

```yaml
failure_patterns:
  - pattern: "Context truncation"
    count: 4
    description: "Long inputs cause important context to be truncated"
    root_cause: "System prompt + input exceeds context window"
    affected_items: ["item_12", "item_23", "item_45", "item_67"]
    potential_fix: "Implement chunking or summarization"

  - pattern: "Tool output parsing"
    count: 2
    description: "Agent misinterprets tool response format"
    root_cause: "Tool returns nested JSON, agent expects flat"
    affected_items: ["item_34", "item_56"]
    potential_fix: "Add output format example to tool description"
```

### Step 5: Good vs Bad Comparison

For each failure pattern, find contrast:
1. A failed trace
2. A successful trace with similar input

Compare:
- What steps were taken?
- Where did paths diverge?
- What was the key difference?

```
COMPARISON: Context Truncation Pattern

Failed (item_12):                    Successful (item_08):
─────────────────────────────────    ─────────────────────────────────
Input: 2000 words                    Input: 500 words
Prompt: 1500 tokens                  Prompt: 1500 tokens
Total: ~3500 tokens                  Total: ~2000 tokens

Step 1: Parse input (truncated!)     Step 1: Parse input (complete)
Step 2: Missing key details          Step 2: All details available
Step 3: Wrong answer                 Step 3: Correct answer

DIVERGENCE: Input truncation at context limit
KEY INSIGHT: Long inputs need preprocessing
```

### Step 6: Synthesize Findings

Document key findings:

```yaml
analysis:
  hypothesis_validated: true
  verdict: "Partially validated - accuracy improved but less than expected"

  metrics_summary:
    accuracy: "+3% (expected +10%)"
    latency: "-0.1s (improved)"

  key_findings:
    - "Math query accuracy improved from 64% to 85%"
    - "Improvement less than expected due to context truncation issues"
    - "4 failures due to truncation, unrelated to math guidance"

  failure_patterns:
    - pattern: "Context truncation"
      count: 4
      priority: "high"
      next_action: "Address in next iteration"

  unexpected_observations:
    - "Latency improved despite longer prompt (fewer retries?)"

  recommendations:
    - priority: 1
      action: "Implement input chunking for long queries"
      expected_impact: "+5% accuracy"
    - priority: 2
      action: "Add output format examples to tool descriptions"
      expected_impact: "+2% accuracy"
```

### Step 7: Update Journal

Update iteration record with full analysis, then:
`current_phase: "compound"`

---

## Phase 4: COMPOUND

**Goal:** Capture learnings and grow the evaluation system.

**Reference:** `references/compounding-strategies.md`

### Step 1: Dataset Growth

Add failure cases as new test items:

```python
from langfuse import Langfuse
lf = Langfuse()

dataset = lf.get_dataset("<dataset_name>")

for failure in new_failure_cases:
    dataset.create_item(
        input=failure.input,
        expected_output=failure.expected_output,
        metadata={
            "source": f"iteration-{iteration}",
            "failure_pattern": failure.pattern,
            "added_date": today
        }
    )
```

**What to add:**
- Failure cases from this iteration (ensure they have clear expected outputs)
- Edge cases discovered during analysis
- Variations that might stress-test the fix

**Track growth:**
```yaml
dataset_history:
  - iteration: <N>
    items_added: <count>
    source: "failure_cases"
    patterns_covered: ["context_truncation", "tool_parsing"]
```

### Step 2: Judge Calibration

Review judge accuracy this iteration:

**Check for false positives:**
- Items scored high but were actually bad
- Judge criteria too lenient?

**Check for false negatives:**
- Items scored low but were actually good
- Judge criteria too strict or wrong?

**If calibration issues found:**
```python
# Update judge prompt
lf.create_prompt(
    name="judge-accuracy",
    prompt="<refined prompt with better criteria/examples>",
    labels=[f"calibrated-v{iteration}"]
)
```

### Step 3: Prompt Management

Based on results:

**If improvement confirmed:**
```python
# Promote experiment prompt to production
lf.update_prompt_labels(
    name="<prompt_name>",
    version=experiment_version,
    labels=["production"]  # Add production label
)
```

**If regression or no improvement:**
```python
# Keep previous production version
# Archive experiment version for reference
lf.update_prompt_labels(
    name="<prompt_name>",
    version=experiment_version,
    labels=["archived-v{iteration}"]
)
```

### Step 4: Capture Learnings

Update journal learnings section:

```yaml
learnings:
  what_works:
    - "Explicit tool guidance improves tool selection by ~20%"
    - "Step-by-step reasoning helps complex multi-part queries"
    # ... accumulated from all iterations

  what_fails:
    - "Generic 'be thorough' instructions increase latency without quality gain"
    - "More than 3 few-shot examples causes confusion"
    # ... accumulated from all iterations

  patterns_discovered:
    - "Math queries need calculator tool, not LLM reasoning"
    - "Context truncation starts around 6k tokens"
    # ... patterns found during analysis

  architectural_insights:
    - "Consider input preprocessing for production"
    - "Tool descriptions need output format examples"
```

### Step 5: Decide Next Action

Based on current state:

| Situation | Decision | Next Phase |
|-----------|----------|------------|
| Target met | **Graduate** | Exit loop |
| Good progress + clear next hypothesis | **Continue** | HYPOTHESIZE |
| 3+ iterations with no progress | **Pivot** | Rethink approach |
| Regression | **Rollback** | Revert + analyze |

**Continue criteria:**
- Gap to target still exists
- Clear hypothesis for next iteration
- Progress trend is positive

**Graduate criteria:**
- Target metric achieved
- Constraints satisfied
- Results stable (pass^k > threshold)

**Pivot criteria:**
- Stuck despite multiple attempts
- Fundamental approach may be wrong
- Need different strategy (model, architecture, etc.)

### Step 6: Prepare Next Iteration (if continuing)

If decision is "continue":

```yaml
compounded:
  dataset_items_added: 4
  judge_updated: false
  prompt_promoted: true
  learnings_captured: true
  decision: "continue"
  next_hypothesis_direction: "Address context truncation for long inputs"
```

Update: `current_phase: "hypothesize"`

### Step 7: Or Graduate (if target met)

If decision is "graduate":

```yaml
compounded:
  dataset_items_added: 2
  final_state:
    accuracy: 0.91
    latency_p95: 2.3
    cost_avg: 0.016
  decision: "graduate"
  summary: "Target achieved after 4 iterations. Key improvements: tool guidance, reasoning steps, input chunking."
```

Update: `current_phase: "graduated"`

Create graduation report:
```
## Optimization Complete: <agent>

**Target:** accuracy 90% ✓ Achieved: 91%
**Iterations:** 4
**Duration:** 2 weeks

### Journey
1. Baseline: 72%
2. +Reasoning steps: 78% (+6%)
3. +Tool guidance: 81% (+3%)
4. +Input chunking: 91% (+10%)

### Key Learnings
<summary of what_works, what_fails>

### Dataset Growth
50 → 68 items (+36%)

### Recommendations for Maintenance
- Monitor accuracy weekly
- Re-run regression suite before prompt changes
- Watch for new failure patterns in production
```

---

## State Recovery

If optimization is interrupted, state recovery is automatic:

1. Read journal
2. Check `current_phase` and `current_iteration`
3. Look at what's populated in current iteration
4. Continue from first null/incomplete field

**Recovery scenarios:**

| Journal State | Recovery Action |
|---------------|-----------------|
| Phase: hypothesize, hypothesis: null | Start hypothesis formulation |
| Phase: hypothesize, hypothesis: filled | Confirm and move to experiment |
| Phase: experiment, experiment: null | Implement change and run |
| Phase: experiment, results: null | Collect results |
| Phase: analyze, analysis: null | Perform analysis |
| Phase: compound, compounded: null | Complete compounding steps |

---

## Integration Notes

### Codex Integrations

Use these Codex skills to execute operational steps:
- `langfuse-instrumentation-setup` for tracing prerequisites
- `evaluation-design` for metrics, datasets, and grading plans
- `langfuse-dataset-setup` for dataset + judge configuration
- `langfuse-dataset-management` for dataset curation and growth
- `langfuse-experiment-runner` for controlled eval runs
- `langfuse-score-analytics` for metric trends and regressions
- `langfuse-trace-analysis` for root-cause analysis
- `langfuse-prompt-management` for prompt versioning and promotion
- `langfuse-annotation-manager` for human review workflows

### Langfuse Operations

This skill uses Langfuse for:
- **Traces:** Debugging and failure analysis
- **Datasets:** Test cases and regression suite
- **Prompts:** Version-controlled agent prompts
- **Experiments:** Controlled evaluation runs
- **Scores:** Metrics and judge outputs

If Langfuse MCP server is available, use it. Otherwise, use Python SDK directly.

### File Locations

All state in `.claude/optimization-loops/<agent>/`:
```
journal.yaml          # Central state machine
iterations/           # Detailed iteration records (optional)
  001-reasoning.md    # Narrative record of iteration 1
  002-tools.md        # Narrative record of iteration 2
```

### Asking Questions

Use AskUserQuestion at key decision points:
- Confirming target and constraints (INITIALIZE)
- Approving hypothesis before experiment (HYPOTHESIZE)
- Confirming compounding decisions (COMPOUND)
- Deciding continue vs graduate (COMPOUND)
