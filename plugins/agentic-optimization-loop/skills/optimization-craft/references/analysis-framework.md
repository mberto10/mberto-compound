# Analysis Framework Reference

How to analyze experiment results, validate hypotheses, and extract learnings.

---

## Analysis Goals

1. **Validate hypothesis** — Did the change help as expected?
2. **Understand why** — What actually happened?
3. **Extract patterns** — What can we learn for future iterations?
4. **Identify next steps** — What should we do next?

---

## Step 1: Quantitative Comparison

Canonical decision semantics are `0-1`.
If you display percentages for readability, treat them as derived-only and non-authoritative.

### Metrics Table

Create a comparison table:

| Metric | Baseline | Previous | Current | Delta | Target | Status |
|--------|----------|----------|---------|-------|--------|--------|
| accuracy | 0.72 | 0.78 | 0.81 | +0.03 | 0.90 | Gap: 0.09 |
| latency_p95 | 2.1s | 2.4s | 2.3s | -0.1s | <3s | ✓ |
| cost_avg | $0.015 | $0.018 | $0.017 | -$0.001 | <$0.02 | ✓ |

### Trajectory Analysis

Plot progress over iterations:

```
Accuracy Trajectory (0-1)
1.00 ┤
0.90 ┤                                    ─── target
0.80 ┤              ●─────●
0.70 ┤    ●─────●
0.60 ┤
     └────┬─────┬─────┬─────┬───
        base   v1    v2    v3
```

Questions to answer:
- Is progress accelerating, steady, or slowing?
- Any regressions along the way?
- How far from target?

### Distribution Analysis

Beyond averages, look at score distribution:

```
Accuracy Distribution (v3)
Count
  15 ┤        ████████████████
  10 ┤    ████████████████████████
   5 ┤████████████████████████████████
   0 ┼────┬────┬────┬────┬────┬────
    0.0-0.2 0.2-0.4 0.4-0.6 0.6-0.8 0.8-1.0
                        Score
```

Questions:
- Is distribution bimodal? (two populations)
- Long tail of failures?
- Are we improving the floor or ceiling?

---

## Step 2: Hypothesis Validation

### Validation Framework

Answer these questions systematically:

**Q1: Did target metric improve?**
- [ ] Yes, significantly (> expected × 0.5)
- [ ] Yes, but less than expected
- [ ] No change
- [ ] Regressed

**Q2: Was improvement as expected?**
- [ ] Exceeded expectations
- [ ] Met expectations
- [ ] Partially met (50-100% of expected)
- [ ] Below expectations (<50% of expected)

**Q3: Any constraint violations?**
- [ ] All constraints satisfied
- [ ] Close to limit (>80% of limit)
- [ ] Violated constraint

**Q4: Any unexpected regressions?**
- [ ] No regressions
- [ ] Minor regression on non-critical metric
- [ ] Significant regression

### Validation Verdicts

| Q1 | Q2 | Q3 | Q4 | Verdict |
|----|----|----|----| --------|
| Improved | Met/Exceeded | Satisfied | None | **Validated** |
| Improved | Partial | Satisfied | None | **Partially Validated** |
| Improved | Below | Satisfied | Minor | **Weakly Validated** |
| No change | - | Satisfied | None | **Invalidated** |
| Regressed | - | - | - | **Backfired** |
| - | - | Violated | - | **Constraint Failure** |

---

## Step 3: Failure Investigation

### Categorizing Failures

Group remaining failures by symptom:

**Output Quality Issues:**
- Wrong answer
- Incomplete answer
- Hallucinated content
- Wrong format

**Execution Issues:**
- Error/crash
- Timeout
- Tool failure
- Infinite loop

**Efficiency Issues:**
- Too slow
- Too expensive
- Too many tokens

### Failure Triage Process

```
For each failure category:
1. Count: How many items?
2. Sample: Pick 2-3 representative cases
3. Investigate: Deep dive on samples
4. Pattern: What's common?
5. Root cause: Why is this happening?
6. Fix potential: How hard to address?
```

### Deep Dive Protocol

For each sampled failure:

**1. Retrieve the trace**
```python
trace = lf.get_trace(trace_id)
```

**2. Walk through execution**
```
Input received: <what>
Step 1: <what happened>
  - Input: <>
  - Output: <>
  - Decision: <>
Step 2: <what happened>
  ...
Final output: <what>
Expected: <what>
Discrepancy: <what's wrong>
```

**3. Identify failure point**
- Where did execution diverge from correct path?
- Was information available at that point?
- What would correct behavior have been?

**4. Determine root cause**
- Missing information?
- Wrong instruction?
- Tool failure?
- Model limitation?

### Failure Documentation Template

```yaml
failure_pattern:
  name: "Context Truncation"
  count: 4
  severity: high  # high | medium | low

  symptom:
    description: "Agent misses information from end of long inputs"
    observable: "Answers reference only first part of input"

  affected_items:
    - item_id: "item_12"
      input_length: 5200 tokens
      missed: "Final requirements section"
    - item_id: "item_23"
      input_length: 4800 tokens
      missed: "Constraints list"

  root_cause:
    type: "architecture"
    description: "System prompt + input exceeds context window"
    evidence: "Traces show truncated input in LLM calls"

  potential_fixes:
    - action: "Implement input chunking"
      effort: medium
      expected_impact: high
    - action: "Summarize long inputs"
      effort: medium
      expected_impact: medium
    - action: "Reduce system prompt size"
      effort: low
      expected_impact: low

  priority: 1  # For next iteration
```

---

## Step 4: Good vs Bad Comparison

The most powerful debugging technique: diff successful and failed traces.

### Finding Comparison Pairs

For each failure pattern, find:
1. A failed trace (exhibiting the pattern)
2. A successful trace with similar input characteristics

"Similar" means:
- Same query type
- Similar length
- Similar complexity
- Different outcome

### Comparison Template

```
COMPARISON: [Pattern Name]

FAILED TRACE (item_12)              SUCCESSFUL TRACE (item_08)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Characteristics:
- Length: 5200 tokens               - Length: 3100 tokens
- Type: Multi-part question         - Type: Multi-part question
- Complexity: High                  - Complexity: High

Execution Path:
1. Parse input                      1. Parse input
   → Truncated at 4096              → Complete parse

2. Identify sub-questions           2. Identify sub-questions
   → Found 2 of 4                   → Found all 3

3. Process each                     3. Process each
   → Answered 2                     → Answered all 3

4. Combine answers                  4. Combine answers
   → Incomplete                     → Complete

DIVERGENCE POINT: Step 1 (input parsing)

KEY DIFFERENCE: Input length exceeded context window

ROOT CAUSE: No handling for long inputs

INSIGHT: Need preprocessing for inputs > 4000 tokens
```

### What to Look For

**Decision Points:**
- Where did the agent make a choice?
- What information did it have?
- What would correct choice have been?

**Information Flow:**
- Was necessary info available?
- Was it in the right place?
- Was it correctly interpreted?

**Tool Usage:**
- Did it use the right tools?
- Did it use them correctly?
- Did it interpret results correctly?

---

## Step 5: Pattern Extraction

### Aggregating Findings

After investigating multiple failures:

```yaml
patterns_summary:
  - pattern: "Context Truncation"
    frequency: 4/53 (7.5%)
    impact: "Directly causes failure"
    addressable: true
    next_iteration_candidate: true

  - pattern: "Tool Output Parsing"
    frequency: 2/53 (3.8%)
    impact: "Causes wrong answer"
    addressable: true
    next_iteration_candidate: false  # Lower priority

  - pattern: "Ambiguous Query"
    frequency: 3/53 (5.7%)
    impact: "Agent guesses wrong interpretation"
    addressable: "Partially - can ask for clarification"
    next_iteration_candidate: false  # Harder to fix
```

### Pattern Priority Ranking

Rank patterns for next iteration:

| Pattern | Count | Impact | Effort | Priority |
|---------|-------|--------|--------|----------|
| Context Truncation | 4 | High | Medium | **1** |
| Tool Parsing | 2 | High | Low | **2** |
| Ambiguous Query | 3 | Medium | High | 3 |

Priority = (Count × Impact) / Effort

---

## Step 6: Synthesize Findings

### Analysis Summary Template

```markdown
## Analysis Summary: Iteration <N>

### Hypothesis Validation
**Verdict:** [Validated / Partially Validated / Invalidated]

<One paragraph explaining the outcome>

### Metrics Summary
| Metric | Result | vs Expected |
|--------|--------|-------------|
| accuracy | +3% | Partial (expected +10%) |
| latency | -0.1s | Better than expected |

### Key Findings

1. **[Finding 1]**
   <Explanation with evidence>

2. **[Finding 2]**
   <Explanation with evidence>

3. **[Finding 3]**
   <Explanation with evidence>

### Failure Patterns (Remaining)

| Pattern | Count | Root Cause | Fix Priority |
|---------|-------|------------|--------------|
| Context Truncation | 4 | Input too long | High |
| Tool Parsing | 2 | Format mismatch | Medium |

### Unexpected Observations

- <Anything surprising>
- <Anything that needs more investigation>

### Recommendations

1. **[Priority 1]:** <Action>
   - Expected impact: <quantified>
   - Effort: <low/medium/high>

2. **[Priority 2]:** <Action>
   - Expected impact: <quantified>
   - Effort: <low/medium/high>

### Next Hypothesis Direction

Based on this analysis, the most impactful next hypothesis would address:
<pattern/issue> because <reasoning>.
```

---

## Analysis Checklist

```
□ Metrics comparison table created
□ Hypothesis verdict determined
□ Constraint status checked
□ Failures categorized
□ 3-5 failures deeply investigated
□ Good vs bad comparison done
□ Patterns extracted and ranked
□ Findings synthesized
□ Next hypothesis direction identified
□ Journal updated with analysis
```

---

## Common Analysis Mistakes

### 1. Stopping at Metrics

❌ "Accuracy improved 3%, great!"
✅ "Accuracy improved 3%. Why not more? What's still failing?"

Always dig into remaining failures.

### 2. Ignoring Small Regressions

❌ "Latency went up 0.2s, that's fine"
✅ "Latency went up 0.2s. Why? Is this a trend?"

Understand all changes, even small ones.

### 3. Attributing Without Evidence

❌ "The improvement is because of our change"
✅ "Traces show the new instruction being followed in 15/18 previously-failing cases"

Show the causal link.

### 4. Cherry-Picking Successes

❌ "Look at these great examples!"
✅ "Here's what's working AND here's what's still failing"

Analyze both successes and failures.

### 5. Vague Pattern Names

❌ "Pattern: Miscellaneous failures"
✅ "Pattern: Calculator not used for compound interest calculations"

Be specific enough to act on.
