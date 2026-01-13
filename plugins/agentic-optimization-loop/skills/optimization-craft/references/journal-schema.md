# Journal Schema Reference

The optimization journal is the persistent state machine for the optimization loop. It lives at `.claude/optimization-loops/<agent>/journal.yaml`.

---

## Full Schema

```yaml
# ══════════════════════════════════════════════════════════════════
# META - Static configuration set during INITIALIZE
# ══════════════════════════════════════════════════════════════════
meta:
  # Agent identification
  agent_name: string              # Human-readable name (e.g., "article-writer")
  agent_path: string              # Path to agent code (e.g., "src/agents/writer/")
  entry_point: string             # How to run (e.g., "python -m agents.writer")

  # Timing
  started: date                   # When optimization began (YYYY-MM-DD)

  # Optimization target
  target:
    metric: string                # Primary metric name (e.g., "accuracy")
    current: number               # Value at start (baseline)
    goal: number                  # Target value to achieve

  # Constraints that must not regress
  constraints:
    - metric: string              # Metric name
      limit: string               # Threshold (e.g., "< 3s", "> 0.95", "<= $0.02")

  # Baseline measurement
  baseline:
    # Each metric measured at baseline
    accuracy: number
    latency_p95: number
    cost_avg: number
    # ... other metrics

    # Experiment info
    dataset: string               # Dataset used for baseline
    run_name: string              # Langfuse run name (usually "baseline")
    date: date                    # When baseline was measured

  # Agent-specific optimization layers
  # Different agents have different architectures - define yours here
  # The pattern (map errors to pipeline phases) is generalizable; the layers are not
  pipeline_layers:                # Optional: define your agent's optimization surface
    - name: string                # Layer identifier (e.g., "retrieval", "generation")
      description: string         # What this layer does
      targets:                    # What can be optimized at this layer
        - string                  # e.g., "prompts", "tool_chain", "model", "embeddings"

  # Example for a research agent:
  # pipeline_layers:
  #   - name: "search"
  #     description: "Query formulation and source retrieval"
  #     targets: ["queries", "tool_chain", "embeddings"]
  #   - name: "synthesis"
  #     description: "Combining sources into coherent response"
  #     targets: ["prompts", "model", "temperature"]
  #   - name: "validation"
  #     description: "Output quality checks"
  #     targets: ["output_schema", "guardrails", "citations"]
  #
  # Example for a coding agent:
  # pipeline_layers:
  #   - name: "retrieval"
  #     description: "Finding relevant code context"
  #     targets: ["embeddings", "chunking", "reranking"]
  #   - name: "planning"
  #     description: "Determining approach and steps"
  #     targets: ["prompts", "reasoning"]
  #   - name: "generation"
  #     description: "Writing code"
  #     targets: ["prompts", "model", "temperature"]
  #   - name: "validation"
  #     description: "Checking output correctness"
  #     targets: ["linters", "tests", "type_checks"]

# ══════════════════════════════════════════════════════════════════
# CURRENT STATE - Updated after each phase
# ══════════════════════════════════════════════════════════════════
current_phase: enum               # init | hypothesize | experiment | analyze | compound | graduated
current_iteration: number         # 0 = pre-first-iteration, 1+ = iteration number

# ══════════════════════════════════════════════════════════════════
# ITERATIONS - One entry per optimization cycle
# ══════════════════════════════════════════════════════════════════
iterations:
  - id: number                    # Sequential ID (1, 2, 3, ...)
    started: date                 # When iteration began
    completed: date | null        # When iteration finished (null if in progress)

    # ─────────────────────────────────────────────────────────────
    # HYPOTHESIS (filled in HYPOTHESIZE phase)
    # ─────────────────────────────────────────────────────────────
    hypothesis:
      statement: string           # Full hypothesis: "IF... THEN... BECAUSE..."
      expected_impact: string     # Quantified expectation (e.g., "+10% accuracy")
      risk: string                # What might regress
      rationale: string           # Why we believe this will work

      # Supporting evidence
      evidence:
        - string                  # Failure items/traces supporting hypothesis
        - string

    # ─────────────────────────────────────────────────────────────
    # CHANGE (filled in HYPOTHESIZE phase)
    # ─────────────────────────────────────────────────────────────
    change:
      type: enum                  # prompt | tool | architecture | retrieval | code
      location: string            # File path OR langfuse://prompts/<name>
      description: string         # What specifically changes

      # Optional: detailed change info
      before: string | null       # Previous state (for rollback)
      after: string | null        # New state
      diff: string | null         # Diff representation

    # ─────────────────────────────────────────────────────────────
    # EXPERIMENT (filled in EXPERIMENT phase)
    # ─────────────────────────────────────────────────────────────
    experiment:
      run_name: string            # Langfuse experiment run name
      dataset: string             # Dataset used
      date: date                  # When experiment ran
      items_run: number           # Number of items evaluated
      duration: string | null     # How long it took (optional)
      notes: string | null        # Any issues during experiment

      # Grader configuration snapshot - CRITICAL for score comparisons
      # Without this, score deltas between iterations may be misleading
      grader_config:
        version: string | null    # Grader version identifier (e.g., "v2.1")
        changes_from_previous: string | null  # What changed from last iteration
        scoring_weights:          # Optional: document weighted scoring
          - category: string      # e.g., "timeline_compliance", "source_integrity"
            weight: number        # Relative weight in final score
        notes: string | null      # Any grader formula changes to explain score deltas

    # ─────────────────────────────────────────────────────────────
    # RESULTS (filled in EXPERIMENT phase)
    # ─────────────────────────────────────────────────────────────
    results:
      # Absolute values
      accuracy: number
      latency_p95: number
      cost_avg: number
      pass_rate: number           # Fraction passing threshold
      # ... other metrics

      # Changes from previous
      delta:
        accuracy: number          # Positive = improvement
        latency_p95: number
        cost_avg: number

    # ─────────────────────────────────────────────────────────────
    # ANALYSIS (filled in ANALYZE phase)
    # ─────────────────────────────────────────────────────────────
    analysis:
      hypothesis_validated: boolean
      verdict: string             # One-line summary of outcome

      metrics_summary:
        accuracy: string          # e.g., "+3% (expected +10%)"
        latency: string           # e.g., "no change"

      # Failure investigation results
      failure_patterns:
        - pattern: string         # Pattern name
          count: number           # How many failures
          description: string     # What goes wrong
          root_cause: string      # Why it happens
          affected_items:         # Which items
            - string
          potential_fix: string   # How to address

      # What we learned
      key_findings:
        - string

      unexpected_observations:
        - string

      # What to do next
      recommendations:
        - priority: number        # 1 = highest
          action: string          # What to do
          expected_impact: string # Quantified if possible

    # ─────────────────────────────────────────────────────────────
    # COMPOUNDED (filled in COMPOUND phase)
    # ─────────────────────────────────────────────────────────────
    compounded:
      dataset_items_added: number
      items_added_details:
        - item_id: string
          source: string          # failure_case | edge_case | adversarial
          pattern: string         # Which failure pattern

      judge_updated: boolean
      judge_update_reason: string | null

      prompt_promoted: boolean    # Was experiment prompt promoted to production?
      prompt_rollback: boolean    # Did we revert to previous?

      learnings_captured: boolean

      decision: enum              # continue | pivot | graduate | rollback
      decision_rationale: string

      next_hypothesis_direction: string | null  # If continuing

# ══════════════════════════════════════════════════════════════════
# LEARNINGS - Accumulated across all iterations
# ══════════════════════════════════════════════════════════════════
learnings:
  what_works:
    - string                      # Things that improved metrics
    - string

  what_fails:
    - string                      # Things that hurt or didn't help
    - string

  patterns_discovered:
    - string                      # Recurring failure patterns
    - string

  architectural_insights:
    - string                      # Broader system learnings
    - string

# ══════════════════════════════════════════════════════════════════
# DATASET HISTORY - Track dataset growth
# ══════════════════════════════════════════════════════════════════
dataset_history:
  - iteration: number             # 0 = initial
    date: date
    items_count: number           # Total items after this change
    items_added: number           # Items added this iteration
    source: string                # initial | failure_cases | edge_cases | production
    description: string           # What was added
```

---

## State Transitions

```
               ┌─────────────────────────────────────────────┐
               │                                             │
               ▼                                             │
┌──────────────────────┐                                     │
│        INIT          │                                     │
│  current_phase:init  │                                     │
└──────────┬───────────┘                                     │
           │ baseline established                            │
           ▼                                                 │
┌──────────────────────┐                                     │
│     HYPOTHESIZE      │◀────────────────────────────────────┤
│ current_phase:       │                                     │
│   hypothesize        │                                     │
└──────────┬───────────┘                                     │
           │ hypothesis documented                           │
           ▼                                                 │
┌──────────────────────┐                                     │
│     EXPERIMENT       │                                     │
│ current_phase:       │                                     │
│   experiment         │                                     │
└──────────┬───────────┘                                     │
           │ results collected                               │
           ▼                                                 │
┌──────────────────────┐                                     │
│      ANALYZE         │                                     │
│ current_phase:       │                                     │
│   analyze            │                                     │
└──────────┬───────────┘                                     │
           │ analysis complete                               │
           ▼                                                 │
┌──────────────────────┐                                     │
│      COMPOUND        │                                     │
│ current_phase:       │                                     │
│   compound           │                                     │
└──────────┬───────────┘                                     │
           │                                                 │
           ├─── decision: continue ──────────────────────────┘
           │
           └─── decision: graduate
                        │
                        ▼
               ┌──────────────────────┐
               │     GRADUATED        │
               │ current_phase:       │
               │   graduated          │
               └──────────────────────┘
```

---

## Reading Journal for Recovery

When resuming, check what's populated:

```python
def determine_resume_point(journal):
    phase = journal['current_phase']
    iteration = journal['current_iteration']

    if phase == 'init':
        return 'initialize', 'start'

    if phase == 'hypothesize':
        current = get_current_iteration(journal)
        if not current or not current.get('hypothesis'):
            return 'hypothesize', 'formulate'
        if not current['hypothesis'].get('statement'):
            return 'hypothesize', 'formulate'
        return 'hypothesize', 'confirm'

    if phase == 'experiment':
        current = get_current_iteration(journal)
        if not current.get('experiment'):
            return 'experiment', 'implement'
        if not current.get('results'):
            return 'experiment', 'collect'
        return 'experiment', 'complete'

    if phase == 'analyze':
        current = get_current_iteration(journal)
        if not current.get('analysis'):
            return 'analyze', 'start'
        return 'analyze', 'complete'

    if phase == 'compound':
        current = get_current_iteration(journal)
        if not current.get('compounded'):
            return 'compound', 'start'
        return 'compound', 'decide'

    if phase == 'graduated':
        return 'graduated', 'done'
```

---

## Example Journal

```yaml
meta:
  agent_name: "article-writer"
  agent_path: "src/agents/writer/"
  entry_point: "python -m agents.writer --mode eval"
  started: "2024-01-15"

  target:
    metric: "accuracy"
    current: 0.72
    goal: 0.90

  constraints:
    - metric: "latency_p95"
      limit: "< 3s"
    - metric: "cost_avg"
      limit: "< $0.02"

  baseline:
    accuracy: 0.72
    latency_p95: 2.1
    cost_avg: 0.015
    dataset: "writer-regression-v1"
    run_name: "baseline"
    date: "2024-01-15"

current_phase: "compound"
current_iteration: 2

iterations:
  - id: 1
    started: "2024-01-16"
    completed: "2024-01-17"

    hypothesis:
      statement: "IF we add step-by-step reasoning instruction THEN accuracy will improve by ~8% BECAUSE complex queries show reasoning gaps in traces"
      expected_impact: "+8% accuracy"
      risk: "May increase latency"
      rationale: "15/50 failures show incomplete reasoning on multi-part queries"
      evidence:
        - "item_12: skipped second part of question"
        - "item_23: didn't connect related facts"

    change:
      type: "prompt"
      location: "langfuse://prompts/writer-system"
      description: "Added 'Think through this step by step' to system prompt"

    experiment:
      run_name: "v1-reasoning-step"
      dataset: "writer-regression-v1"
      date: "2024-01-16"
      items_run: 50
      grader_config:
        version: "v1.0"
        changes_from_previous: null  # First iteration, no previous
        notes: null

    results:
      accuracy: 0.78
      latency_p95: 2.4
      cost_avg: 0.018
      pass_rate: 0.78
      delta:
        accuracy: 0.06
        latency_p95: 0.3
        cost_avg: 0.003

    analysis:
      hypothesis_validated: true
      verdict: "Validated - accuracy improved, latency acceptable"
      metrics_summary:
        accuracy: "+6% (expected +8%)"
        latency: "+0.3s (within constraint)"
      failure_patterns:
        - pattern: "Math calculation errors"
          count: 8
          description: "Agent tries to reason through math instead of using calculator"
          root_cause: "No explicit tool guidance"
          affected_items: ["item_5", "item_18", "item_27", "item_33"]
          potential_fix: "Add tool usage guidance"
      key_findings:
        - "Step-by-step reasoning helps complex queries"
        - "Math queries still fail - different root cause"
      recommendations:
        - priority: 1
          action: "Add calculator tool guidance"
          expected_impact: "+8% accuracy"

    compounded:
      dataset_items_added: 3
      judge_updated: false
      prompt_promoted: true
      learnings_captured: true
      decision: "continue"
      next_hypothesis_direction: "Tool guidance for math"

  - id: 2
    started: "2024-01-18"
    completed: null  # In progress

    hypothesis:
      statement: "IF we add explicit calculator tool guidance THEN accuracy will improve by ~8% BECAUSE 8/50 failures are math errors where calculator wasn't used"
      expected_impact: "+8% accuracy"
      risk: "Might over-use calculator on simple math"
      rationale: "Traces show reasoning attempts instead of tool calls"
      evidence:
        - "item_5: attempted mental arithmetic, got wrong answer"
        - "item_18: calculator available but not used"

    change:
      type: "prompt"
      location: "langfuse://prompts/writer-system"
      description: "Added 'Use calculator tool for any arithmetic operations'"

    experiment:
      run_name: "v2-tool-guidance"
      dataset: "writer-regression-v1"
      date: "2024-01-18"
      items_run: 53
      grader_config:
        version: "v1.1"
        changes_from_previous: "Added weighted scoring for error categories"
        scoring_weights:
          - category: "timeline_compliance"
            weight: 2.0
          - category: "source_integrity"
            weight: 1.5
          - category: "query_coverage"
            weight: 1.0
        notes: "Score drop from 7.2 to 3.0 reflects new weighted formula correctly penalizing timeline violations, not a regression"

    results:
      accuracy: 0.85
      latency_p95: 2.3
      cost_avg: 0.017
      pass_rate: 0.85
      delta:
        accuracy: 0.07
        latency_p95: -0.1
        cost_avg: -0.001

    analysis:
      hypothesis_validated: true
      verdict: "Validated - significant accuracy improvement"
      # ... rest of analysis

    compounded: null  # Not yet done

learnings:
  what_works:
    - "Step-by-step reasoning improves complex query handling"
    - "Explicit tool guidance dramatically improves tool usage"
  what_fails:
    - "Generic 'be thorough' instructions don't help"
  patterns_discovered:
    - "Math queries need explicit calculator guidance"
    - "Multi-part queries need reasoning scaffolding"

dataset_history:
  - iteration: 0
    date: "2024-01-15"
    items_count: 50
    items_added: 50
    source: "initial"
    description: "Initial dataset from production traces"
  - iteration: 1
    date: "2024-01-17"
    items_count: 53
    items_added: 3
    source: "failure_cases"
    description: "Math failure cases from iteration 1"
```
