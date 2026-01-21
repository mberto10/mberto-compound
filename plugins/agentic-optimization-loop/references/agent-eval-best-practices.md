# Agent Evaluation Best Practices

Comprehensive reference distilled from Anthropic's agent evaluation framework. Use this as the foundation for all evaluation and optimization work.

---

## Core Concepts

### Evaluation Components

| Component | Definition | Key Insight |
|-----------|------------|-------------|
| **Task** | Single test with defined inputs and success criteria | Two experts should reach the same verdict on pass/fail |
| **Trial** | One attempt at a task | Multiple trials needed due to non-determinism |
| **Grader** | Logic that scores agent performance | Tasks have multiple graders; each grader has assertions |
| **Transcript** | Complete record: outputs, tool calls, reasoning, interactions | The source of truth for what actually happened |
| **Outcome** | Final environmental state | Grade the outcome, not what the agent claims |
| **Evaluation Harness** | Infrastructure running tasks and aggregating results | Must isolate trials (clean environment each run) |
| **Agent Harness** | System enabling model-as-agent functionality | Separate from evaluation harness |

### Two Evaluation Purposes

| Type | Pass Rate | Purpose | When to Use |
|------|-----------|---------|-------------|
| **Capability Evals** | Low (targeting struggling areas) | "What can this agent do well?" | Finding weaknesses, driving improvement |
| **Regression Evals** | High (~100%) | "Does the agent maintain performance?" | Protecting gains, preventing degradation |

**Key insight**: Capability evals "graduate" into regression evals as the agent improves.

---

## The Three Grader Types

### 1. Code-Based Graders

**Methods:**
- String matching / regex
- Binary tests (pass/fail)
- Static analysis
- Outcome verification (check end state)
- Tool-call verification (check specific tools were used)

**Strengths:** Fast, cheap, objective, reproducible, easy to debug

**Weaknesses:** Brittle to valid variations, lack nuance

**When to use:**
- Deterministic outcomes (file exists, test passes, value equals X)
- Tool usage verification (did it call the right API?)
- Format compliance (JSON schema validation)

### 2. Model-Based Graders (LLM Judges)

**Methods:**
- Rubric-based scoring
- Natural language assertions
- Pairwise comparisons
- Multi-criteria evaluation

**Strengths:** Flexible, scalable, handles open-ended tasks

**Weaknesses:** Non-deterministic, expensive, requires calibration

**When to use:**
- Subjective quality (tone, helpfulness, clarity)
- Open-ended outputs (summaries, creative writing)
- Complex multi-factor assessment

**Critical requirements:**
- Calibrate against human judgments
- Use specific rubrics, not vague criteria
- Run multiple trials to handle variance
- Watch for biases (position, verbosity, self-preference)

### 3. Human Graders

**Methods:**
- Subject matter expert review
- Crowdsourced evaluation
- Spot-checks on samples
- A/B testing with users

**Strengths:** Gold-standard quality, catches subtle issues

**Weaknesses:** Expensive, slow, requires domain experts

**When to use:**
- Calibrating model-based graders
- High-stakes decisions
- Novel failure modes
- Periodic validation

---

## Critical Metrics

### pass@k vs pass^k

| Metric | Formula | Measures | Interpretation |
|--------|---------|----------|----------------|
| **pass@k** | P(≥1 success in k trials) | "Does it work eventually?" | Capability ceiling |
| **pass^k** | P(all k trials succeed) | "Is it reliably consistent?" | Production readiness |

**The divergence problem:**
- At k=10, pass@k approaches 100%
- At k=10, pass^k can drop dramatically
- A 70% single-trial pass rate → 97% pass@10 but only 3% pass^10

**Implication:** High pass@k with low pass^k means the agent CAN do it but isn't RELIABLE.

### When to Use Which

| Scenario | Metric | Rationale |
|----------|--------|-----------|
| Capability exploration | pass@k | Want to know if it's possible |
| Production deployment | pass^k | Need reliability |
| Regression testing | pass^1 or pass^3 | Quick signal on degradation |
| Comparing approaches | Both | Capability AND reliability matter |

---

## Building Evaluation Infrastructure

### Step 0: Start Small

- Begin with 20-50 tasks, not hundreds
- Source from real failures and production issues
- Quality over quantity

### Step 1: Task Design

**Requirements:**
- Unambiguous success criteria (two experts same verdict)
- Reference solutions where possible
- Isolated (no dependencies between tasks)

**Anti-patterns:**
- Vague criteria ("should be helpful")
- Path-dependent grading (checking HOW, not WHAT)
- Overly complex multi-part tasks without partial credit

### Step 2: Dataset Balance

| Include | Why |
|---------|-----|
| Cases where behavior SHOULD occur | Test capability |
| Cases where behavior should NOT occur | Prevent over-triggering |
| Edge cases | Find boundaries |
| Common cases | Ensure basics work |

**Warning:** One-sided datasets create one-sided optimization. If you only test "should search" cases, you'll get a search-happy agent.

### Step 3: Grader Design

**Principles:**
- Grade OUTCOMES, not procedures
- Allow multiple valid paths to success
- Implement partial credit for complex tasks
- Make graders resistant to gaming

**Calibration process:**
1. Run grader on sample with known-good outputs → should score high
2. Run grader on sample with known-bad outputs → should score low
3. Check edge cases → scores should be reasonable
4. Compare to human judgment → should correlate

### Step 4: Harness Requirements

- Clean environment for each trial
- Complete transcript capture
- Deterministic replay capability (where possible)
- Timeout handling
- Error isolation (one failure doesn't crash suite)

---

## Agent-Type Specific Patterns

### Coding Agents

| Grader Type | What It Checks |
|-------------|----------------|
| Code-based | Unit tests pass, code compiles, linting passes |
| Model-based | Code quality, readability, follows conventions |
| Transcript analysis | Tool usage patterns, debugging behavior |

### Conversational Agents

| Grader Type | What It Checks |
|-------------|----------------|
| Code-based | State changes (ticket resolved, data updated) |
| Model-based | Tone, empathy, helpfulness |
| Transcript analysis | Turn count, escalation patterns |

**Key technique:** Simulate user personas for multi-turn stress testing.

### Research Agents

| Grader Type | What It Checks |
|-------------|----------------|
| Code-based | Source count, citation presence |
| Model-based | Groundedness (claims supported), coverage (key facts) |
| Source verification | Quality of sources used |

**Key technique:** Layer graders—separate checks for different aspects.

### Computer Use Agents

| Grader Type | What It Checks |
|-------------|----------------|
| Code-based | DOM state, file system state, backend data |
| Model-based | UI element properties, visual correctness |
| Transcript analysis | Token efficiency, navigation patterns |

**Key technique:** Run in sandboxed environments; verify outcomes through multiple channels.

---

## Debugging Evaluation Failures

### When pass@100 = 0%

**Almost always means:** Broken task, not incapable agent.

**Check for:**
1. Grader bugs (grading logic wrong)
2. Agent harness constraints (environment issues)
3. Task ambiguity (unclear what success means)
4. Missing context (agent lacks needed information)

### Failure Attribution

| Symptom | Likely Cause |
|---------|--------------|
| Passes locally, fails in harness | Environment difference |
| Passes sometimes, fails sometimes | Non-determinism, edge cases |
| Never passes despite valid outputs | Grader too strict |
| Passes with wrong outputs | Grader too lenient |
| Different graders disagree | Criteria misalignment |

### The Transcript Review Imperative

**Read transcripts regularly.** Score improvements don't matter if:
- Agent is gaming the grader
- Grader has bugs
- Success criteria don't match real goals

---

## Optimization Relationships

### Evals Enable Optimization By:

1. **Transforming vague failures** → actionable test cases
2. **Providing clear signal** → hypothesis validation
3. **Preventing regression** → safe to experiment
4. **Enabling comparison** → A/B between approaches

### Evals Can Break Optimization By:

1. **Gaming** → Agent optimizes for grader quirks, not real quality
2. **Imbalance** → One-sided optimization from one-sided dataset
3. **Saturation** → 100% pass rate provides no signal for improvement
4. **Misalignment** → Grader doesn't measure what actually matters

### The Optimization Loop Depends On:

| Eval Quality | Optimization Result |
|--------------|---------------------|
| Good graders, balanced dataset | Real improvement |
| Gaming-prone graders | False improvement |
| Saturated evals | No improvement signal |
| Misaligned criteria | Wrong direction |

---

## Long-Term Maintenance

### Eval Saturation

When pass rate hits 100%:
- Eval no longer drives improvement
- Graduate to regression suite
- Create new capability evals for next frontier

### Ownership Model

- Dedicated eval ownership (not orphaned)
- Clear maintenance responsibility
- Regular review cadence
- Documented update process

### Eval-Driven Development

**Pattern:** Define capability via evals BEFORE building it.

1. Write failing eval for desired capability
2. Build agent to pass eval
3. Eval becomes regression test
4. Repeat

---

## Integration with Broader Evaluation

| Method | Purpose | Timing | Catches |
|--------|---------|--------|---------|
| Automated evals | Fast iteration, reproducibility | Pre-launch, CI/CD | Known failure modes |
| Production monitoring | Real-world ground truth | Post-launch | Unknown unknowns |
| A/B testing | User outcome validation | Scale phase | User preference gaps |
| Transcript review | Intuition building | Ongoing | Gaming, grader bugs |
| Human studies | Gold-standard calibration | As-needed | Subtle quality issues |

**Key insight:** No single layer catches everything. Multiple methods combined create defense in depth.

---

## Quick Reference Checklists

### Before Running Optimization

- [ ] Dataset has 20+ diverse tasks
- [ ] Tasks are unambiguous (two experts agree)
- [ ] Dataset is balanced (positive and negative cases)
- [ ] Graders are calibrated against human judgment
- [ ] Baseline is established
- [ ] Regression guards are in place

### Grader Design Checklist

- [ ] Grades outcomes, not procedures
- [ ] Allows multiple valid paths
- [ ] Has partial credit for complex tasks
- [ ] Is resistant to gaming
- [ ] Correlates with human judgment
- [ ] Handles edge cases reasonably

### After Each Optimization Iteration

- [ ] Review transcripts (not just scores)
- [ ] Check for gaming patterns
- [ ] Verify graders still calibrated
- [ ] Update dataset with new failure cases
- [ ] Check regression metrics

### Signs of Eval Problems

- [ ] High scores but qualitatively bad outputs
- [ ] Scores improve but user satisfaction doesn't
- [ ] Agent behavior changed in unexpected ways
- [ ] pass@k high but pass^k low (reliability issue)
- [ ] Graders disagree with each other significantly
