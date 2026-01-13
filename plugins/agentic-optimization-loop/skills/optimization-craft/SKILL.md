---
name: optimization-craft
description: Use this skill when the user invokes /optimize, asks to "improve my agent", "run optimization loop", "iterate on agent quality", "systematic agent improvement", or needs guidance on hypothesis-driven optimization cycles. Provides the full methodology for iterative AI agent improvement.
---

# Agentic Optimization Craft

A systematic methodology for iterative AI agent improvement through hypothesis-driven experimentation. This skill guides you through the complete optimization loop with persistent state.

---

## Before You Start: Choose Your Entry Point

Not all optimization starts at the same place. Use this decision tree to find the right entry point:

```
What do you have?
│
├─▶ Dataset + automated graders + clear target metric
│   └─▶ ✅ Use /optimize (full loop) — You're ready for systematic iteration
│
├─▶ Human annotations/feedback but NO automated graders
│   └─▶ Use /optimize-bootstrap — Build graders from your human labels first
│
├─▶ Production traces but NO dataset or annotations
│   └─▶ Use /optimize-bootstrap — Curate a dataset from traces first
│
├─▶ Specific failing trace or issue to debug
│   └─▶ Use langfuse-analyzer trace-analysis skill — Investigate before optimizing
│
└─▶ Annotation queue to process
    └─▶ Use langfuse-analyzer annotation-manager skill — Triage feedback first
```

### Prerequisites for the Full Optimization Loop

The `/optimize` command works best when you have:

| Prerequisite | Required? | If Missing |
|--------------|-----------|------------|
| Langfuse tracing active | **Yes** | Set up instrumentation first |
| Evaluation dataset (20+ items) | **Yes** | Use `/optimize-bootstrap` to create one |
| Automated graders/judges | Recommended | Use `/optimize-bootstrap` to build from human labels |
| Clear target metric | **Yes** | Define before starting |
| Baseline measurement | No | Created in INITIALIZE phase |

If you're missing prerequisites, `/optimize-bootstrap` will help you build the infrastructure needed for the full loop.

---

## The Core Philosophy

**Evaluation-first development:** Create evaluations BEFORE making changes. This prevents solving imaginary problems and provides clear signal on whether changes helped.

**Hypothesis-driven iteration:** Every change starts with a specific, testable hypothesis. No shotgun debugging or random prompt tweaks.

**Compounding returns:** Each iteration makes both the agent AND the evaluation system better. Failures become test cases, learnings accumulate.

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
| INITIALIZE | Establish baseline | Journal with baseline metrics |
| HYPOTHESIZE | Formulate testable improvement | Documented hypothesis + change plan |
| EXPERIMENT | Test the hypothesis | Evaluation results |
| ANALYZE | Understand results | Validated/invalidated + findings |
| COMPOUND | Capture value | Grown dataset + learnings |

---

## Phase 0: INITIALIZE

**Goal:** Establish baseline and create optimization infrastructure.

**Reference:** `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/journal-schema.md`

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

**Reference:** `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/hypothesis-patterns.md`

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

**Reference:** `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/experiment-design.md`

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

**Reference:** `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/analysis-framework.md`

### Step 0: Fetch Human Annotation Comments

**Before quantitative comparison, fetch ALL human annotation comments from the dataset run.**

Human annotation comments contain the "why" behind scores and often reveal the real issues that quantitative metrics miss. In one analysis, 64% of comments cited a content quality issue (missing Kernaussage) that was invisible in the score values alone.

**Fetch comments:**
```bash
# List all scores with comments for the run
python3 ${LANGFUSE_ANALYZER_ROOT}/skills/annotation-manager/helpers/annotation_manager.py \
  list-scores --name "<score_name>" --limit 100
```

**Categorize by theme:**
1. Group comments by keyword/theme (scan for repeated words/phrases)
2. Count frequency of each theme
3. Prioritize themes by frequency

**Example output:**
```
Theme Analysis from Annotation Comments:
- "Missing Kernaussage/core message" - 7/11 comments (64%)
- "Incorrect format" - 2/11 comments (18%)
- "Technical error" - 2/11 comments (18%)

→ Primary issue is content quality, not technical failures
```

**Why this matters:**
- Scores tell you WHAT failed; comments tell you WHY
- Human annotators often identify issues that automated metrics miss
- Theme frequency often reframes the entire analysis priority

This step should PRECEDE quantitative analysis to prevent confirmation bias from metrics.

---

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

**Reference:** `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/compounding-strategies.md`

### Step 1: Dataset Growth

Add failure cases as new test items:

```python
from langfuse import Langfuse
lf = Langfuse()

for failure in new_failure_cases:
    # Note: use lf.create_dataset_item(), not dataset.create_item()
    lf.create_dataset_item(
        dataset_name="<dataset_name>",
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
