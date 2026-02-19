# Hypothesis Patterns Reference

Common hypothesis patterns for agent optimization. Use these as templates when formulating your own hypotheses.

---

## Hypothesis Quality Checklist

Before proceeding with a hypothesis, verify:

- [ ] **Specific** — Exactly what will change is defined
- [ ] **Measurable** — Expected impact is quantified
- [ ] **Evidence-based** — Supported by failure analysis
- [ ] **Single change** — One variable at a time
- [ ] **Reversible** — Can be rolled back if needed
- [ ] **Testable** — Current eval setup can measure it

---

## Prompt-Level Patterns

### Pattern 1: Add Explicit Guidance

**Symptom:** Agent doesn't do X even though it should

**Template:**
```
IF we add explicit instruction to [action] when [condition]
THEN [metric] will improve by [amount]
BECAUSE [N] failures show agent not doing [action] despite [reason it should]

RISK: May cause over-application of [action]
```

**Example:**
```
IF we add "Use the calculator tool for any arithmetic operations"
THEN accuracy will improve by ~10%
BECAUSE 18/50 failures show reasoning attempts instead of calculator use

RISK: May use calculator for trivial math (2+2)
```

**When to use:**
- Agent has capability but doesn't use it
- Traces show wrong path taken at decision point
- Simple instruction could redirect behavior

---

### Pattern 2: Add Few-Shot Examples

**Symptom:** Agent does the right thing but wrong format/style

**Template:**
```
IF we add [N] examples of correct [behavior]
THEN [quality metric] will improve by [amount]
BECAUSE failures show correct intent but wrong execution

RISK: Too many examples may confuse or increase latency
```

**Example:**
```
IF we add 3 examples of well-formatted citation blocks
THEN citation_format score will improve by ~15%
BECAUSE agent includes citations but format varies wildly

RISK: May rigidly follow examples, missing edge cases
```

**When to use:**
- Output quality issues (format, style, structure)
- Agent understands task but execution varies
- Pattern is easier to show than describe

---

### Pattern 3: Restructure Instructions

**Symptom:** Agent misses important instructions

**Template:**
```
IF we restructure prompt to [change]
THEN [metric] will improve by [amount]
BECAUSE critical instructions at [location] are being missed

RISK: Restructuring may break other behaviors
```

**Example:**
```
IF we move safety rules to a dedicated ## Critical Rules section
THEN safety_compliance will improve by ~20%
BECAUSE rules buried in paragraph 3 are skipped on long contexts

RISK: May feel repetitive, slight latency increase
```

**When to use:**
- Instructions exist but aren't followed
- Traces show instruction was available but ignored
- Prompt is long and buried content gets missed

---

### Pattern 4: Add Reasoning Step

**Symptom:** Agent makes errors on complex queries

**Template:**
```
IF we add explicit [reasoning type] step before [action]
THEN accuracy on complex queries will improve by [amount]
BECAUSE failures show jumping to answer without analysis

RISK: Increases latency, may over-think simple queries
```

**Example:**
```
IF we add "First, identify all parts of this question" step
THEN multi-part query accuracy will improve by ~12%
BECAUSE 15/40 complex query failures show partial answers

RISK: +0.5s latency, simple queries may be over-analyzed
```

**When to use:**
- Complex queries fail more than simple ones
- Traces show incomplete analysis
- Agent capable but rushing

---

### Pattern 5: Add Self-Verification

**Symptom:** Agent produces output but doesn't check it

**Template:**
```
IF we add verification step to check [criteria]
THEN [metric] will improve by [amount]
BECAUSE errors are detectable but not being caught

RISK: Increases latency and cost
```

**Example:**
```
IF we add "Verify all claims have citations" check
THEN citation_completeness will improve by ~25%
BECAUSE agent knows citation rules but doesn't verify compliance

RISK: +1s latency, +$0.005 cost per request
```

**When to use:**
- Errors are obvious in hindsight
- Agent could catch its own mistakes
- Quality more important than speed

---

## Tool-Level Patterns

### Pattern 6: Improve Tool Descriptions

**Symptom:** Agent uses wrong tool or doesn't use tool at all

**Template:**
```
IF we improve [tool] description to clarify [aspect]
THEN tool selection accuracy will improve by [amount]
BECAUSE traces show confusion about when to use [tool]

RISK: Longer descriptions may slow tool selection
```

**Example:**
```
IF we add "Use for ANY numerical calculation, even simple ones"
THEN calculator tool usage will increase from 40% to 80%
BECAUSE agent only uses calculator for "complex" math

RISK: Minor latency increase from tool call overhead
```

---

### Pattern 7: Add Output Format to Tool

**Symptom:** Agent misinterprets tool output

**Template:**
```
IF we add output format example to [tool] description
THEN tool output parsing accuracy will improve by [amount]
BECAUSE agent receives correct data but misinterprets structure

RISK: Longer tool descriptions
```

**Example:**
```
IF we add "Returns: {result: number, unit: string}" example
THEN unit conversion accuracy will improve by ~30%
BECAUSE agent ignores unit field in tool response

RISK: None significant
```

---

### Pattern 8: Add Missing Tool

**Symptom:** Agent tries to do X manually but fails

**Template:**
```
IF we add a tool for [capability]
THEN [task] success rate will improve by [amount]
BECAUSE agent attempts [capability] via reasoning and fails

RISK: Integration complexity, maintenance burden
```

**Example:**
```
IF we add a date_calculator tool
THEN date arithmetic accuracy will improve from 60% to 95%
BECAUSE agent tries to calculate days between dates manually

RISK: Need to maintain tool, API dependency
```

---

## Architecture-Level Patterns

### Pattern 9: Add Preprocessing Step

**Symptom:** Input characteristics cause failures

**Template:**
```
IF we add [preprocessing] for [input type]
THEN success rate on [input type] will improve by [amount]
BECAUSE [input characteristic] causes [failure mode]

RISK: Added complexity, preprocessing errors
```

**Example:**
```
IF we chunk inputs longer than 4000 tokens
THEN long-input accuracy will improve from 50% to 85%
BECAUSE context truncation loses critical information

RISK: Chunking may split related content
```

---

### Pattern 10: Add Routing Logic

**Symptom:** Different query types need different handling

**Template:**
```
IF we route [query type] to [specialized handler]
THEN [query type] success rate will improve by [amount]
BECAUSE generic handling doesn't serve [query type] well

RISK: Routing errors, increased complexity
```

**Example:**
```
IF we route math queries to calculator-focused prompt
THEN math query accuracy will improve from 70% to 90%
BECAUSE math needs different approach than general queries

RISK: Misrouted queries, maintenance of two prompts
```

---

## Anti-Patterns (What NOT to Do)

### Anti-Pattern 1: Vague Hypothesis

❌ **Bad:** "Make the prompt better"
✅ **Good:** "Add explicit calculator guidance for math queries"

**Problem:** Can't measure, can't know if it worked

---

### Anti-Pattern 2: Multiple Changes

❌ **Bad:** "Add reasoning step AND tool guidance AND more examples"
✅ **Good:** Pick ONE change, test it, then try next

**Problem:** Can't isolate what helped (or hurt)

---

### Anti-Pattern 3: Unmeasurable Impact

❌ **Bad:** "This should help somehow"
✅ **Good:** "Expect +10% accuracy based on 18 math failures"

**Problem:** No way to know if hypothesis was validated

---

### Anti-Pattern 4: No Evidence

❌ **Bad:** "I think users would like more detailed responses"
✅ **Good:** "15/50 failures show incomplete responses, users asked for more detail in 8 cases"

**Problem:** Solving imagined problems, not real ones

---

### Anti-Pattern 5: Addressing Symptoms Not Causes

❌ **Bad:** "Add retry logic when answer is wrong"
✅ **Good:** "Fix root cause: agent doesn't use calculator for math"

**Problem:** Adds complexity without fixing underlying issue

---

## Hypothesis Prioritization Matrix

When multiple hypotheses are possible, prioritize:

| Factor | Weight | Questions |
|--------|--------|-----------|
| **Impact** | High | How many failures would this fix? What % improvement? |
| **Confidence** | High | How strong is the evidence? Is root cause clear? |
| **Effort** | Medium | How hard to implement? How risky? |
| **Reversibility** | Medium | Can we easily undo if it doesn't work? |

**Scoring:**
- Impact: 1-5 (5 = fixes many failures)
- Confidence: 1-5 (5 = very confident in root cause)
- Effort: 1-5 (5 = very easy)
- Reversibility: 1-5 (5 = trivial to undo)

**Priority Score = (Impact × Confidence × Effort × Reversibility) / 100**

Pick hypothesis with highest score.

---

## Hypothesis Documentation Template

```yaml
hypothesis:
  id: <iteration_number>
  date: <today>

  statement: |
    IF we [specific change]
    THEN [metric] will improve by [amount]
    BECAUSE [evidence-based reasoning]

  category: prompt | tool | architecture | retrieval

  expected_impact:
    metric: <name>
    change: <+X% or +X absolute>
    confidence: high | medium | low

  risk:
    description: <what might regress>
    severity: high | medium | low
    mitigation: <how to detect/address>

  evidence:
    failure_count: <N failures supporting this>
    failure_items:
      - <item_id>: <brief description>
      - <item_id>: <brief description>
    traces_reviewed: <N>

  change_plan:
    type: <prompt | tool | code>
    location: <path or langfuse URL>
    description: <what specifically changes>
    rollback: <how to undo>

  success_criteria:
    primary: <metric> >= <threshold>
    secondary:
      - <constraint> maintained
      - <constraint> maintained
```
