---
idea: The Optimization Stack
sources: ["Original thinking session 2025-12-26"]
connects_to: ["compound-loop", "evolutionary-compounding", "skills-as-modules"]
categories: ["systems-thinking", "mental-models", "meta-cognition"]
---

# The Optimization Stack

## The Three-Layer Structure

Any optimization system has three layers:

1. **Target** — The fitness function. What "success" means. The thing being maximized.
2. **Algorithm** — The mechanism that moves toward the target. The process, the how.
3. **Friction** — What impedes the algorithm from running. Resistance, cost, obstacles.

These are distinct concerns. Conflating them creates confusion.

The structure applies universally: evolution optimizing fitness, compound interest optimizing capital, gradient descent optimizing loss functions, the compound loop optimizing leverage. Same pattern, different instantiations.

---

## The Target Layer

The target defines the optimization landscape. Different targets create different landscapes.

**Properties of good targets:**
- Measurable (even if imperfectly)
- Aligned with actual goals (Goodhart's law: when a measure becomes a target, it ceases to be a good measure)
- Stable enough to optimize against
- Context-appropriate (fitness means different things in different environments)

**The target selection problem:**

Choosing the wrong target is catastrophic. You can have a perfect algorithm with zero friction and still fail—because you're climbing the wrong hill.

Evolution's target (reproductive fitness) is imposed, not chosen. Organisms can't select their fitness function. Humans can—which is both an advantage and a source of error.

**Proxy targets:**

Often the true target is unmeasurable, so we use proxies:
- Revenue as proxy for value created
- Test scores as proxy for learning
- Citations as proxy for scientific contribution
- Engagement as proxy for content quality

Proxy targets drift from true targets. The optimization succeeds at the proxy while failing at the real goal. This is Goodhart's law in action—the metric gets gamed, the underlying goal neglected.

**Multi-objective optimization:**

Real systems often have multiple targets. These can be:
- **Aligned**: Optimizing one helps the other
- **Orthogonal**: Independent, can optimize separately
- **Conflicting**: Trade-offs required (Pareto frontiers)

Most interesting problems involve conflicting targets. The optimization stack doesn't resolve this—it just makes the structure visible.

---

## The Algorithm Layer

The algorithm is the mechanism that moves toward the target. It's the process, the strategy, the how.

**Properties of good algorithms:**
- **Converges** toward the target (actually moves in the right direction)
- **Efficient** (doesn't waste resources)
- **Robust** (works across conditions)
- **Adaptive** (adjusts to feedback)

**Algorithm selection:**

For any target, there are many possible algorithms. Some dominate others:

| Target | Weak Algorithm | Strong Algorithm |
|--------|----------------|------------------|
| Physical strength | Random exercise | Progressive overload |
| Wealth accumulation | Save in cash | Invest in diversified assets |
| Skill acquisition | Passive consumption | Deliberate practice |
| Knowledge retention | Re-reading | Spaced repetition |

The strong algorithm isn't just incrementally better—it often dominates by orders of magnitude. Progressive overload doesn't just work "a bit better" than random exercise; it's categorically more effective.

**Algorithm discovery is a meta-problem:**

How do you find good algorithms? This is itself an optimization problem:
- **Target**: Find algorithms that maximize the original target
- **Algorithm**: Research, experimentation, learning from others
- **Friction**: Search costs, experimentation costs, knowledge access

This recursion is important. The quality of your algorithm-discovery algorithm determines whether you find good algorithms for your actual targets.

**Known vs. unknown algorithms:**

For most common targets, good algorithms already exist. The problem isn't algorithm discovery—it's algorithm adoption. This is a friction problem, not an algorithm problem.

---

## The Friction Layer

Friction is what prevents the algorithm from running. It's the resistance between intention and execution.

**Types of friction:**

| Type | Definition | Examples |
|------|------------|----------|
| **Activation friction** | Cost to start | Setup time, context-switching, decision fatigue, initiation energy |
| **Execution friction** | Cost to continue | Effort, discomfort, resource consumption, attention demands |
| **Feedback friction** | Cost to learn | Delayed signals, noisy measurements, attribution problems |

Each type has different interventions:
- Activation friction → reduce startup costs, pre-commit, default to action
- Execution friction → simplify process, remove steps, automate
- Feedback friction → tighten loops, clarify metrics, improve measurement

**The friction hypothesis:**

**Most failures are friction failures, not target or algorithm failures.**

The algorithm is often known. The target is often clear. What's missing is execution. And execution fails due to friction.

This is counterintuitive. We assume failures are knowledge problems—we don't know what to do. More often, they're friction problems—we know what to do but don't do it.

**Friction compounds:**

Small frictions accumulate. Each friction point is a probability of stopping.

A process with 10 friction points, each 90% passable:
```
P(completion) = 0.9^10 ≈ 0.35
```

Only 35% of attempts complete. Not because any single step is hard, but because friction compounds multiplicatively.

This explains why simplification works. Removing friction points increases end-to-end completion probability. Removing one step from 10 (each 90% passable):
```
P(completion) = 0.9^9 ≈ 0.39
```

That's an 11% relative improvement from removing a single step.

**Friction is often invisible:**

We don't notice friction until we remove it. The process feels "normal" until a simpler version reveals how much resistance existed.

This is why friction reduction often produces surprising gains. The baseline felt acceptable; the improvement feels dramatic.

---

## Why Friction Dominates

The three layers are not equally likely to be the bottleneck:

| Layer | Frequency as bottleneck | Why |
|-------|------------------------|-----|
| Target | Rare | Most systems have reasonably clear targets |
| Algorithm | Sometimes | Known algorithms exist for most common targets |
| Friction | Usually | Execution is hard; friction is everywhere |

**Diagnostic priority:** When something isn't working, check friction first.

**The willpower fallacy:**

We often treat friction problems as willpower problems. "I just need to try harder." But:
- Willpower is a resource that depletes
- Friction is structural—it persists
- Willpower vs. friction is an unfair fight

Friction reduction is structural—it works even when willpower is exhausted. Systems beat intentions. Environment design beats motivation.

**Why we miss friction:**

1. **Attribution error**: We blame ourselves (willpower) instead of the environment (friction)
2. **Invisibility**: Friction is the default; we don't see it until removed
3. **Effort bias**: We value things that are hard; reducing friction feels like cheating

---

## Other Ideas as Instances

The optimization stack is a genus. Other ideas are species:

### Evolution

| Layer | Instantiation |
|-------|---------------|
| Target | Reproductive fitness (imposed by nature, not chosen) |
| Algorithm | Variation + selection + inheritance |
| Friction | Environmental constraints, energy costs, mortality |

Evolution can't choose its target or design its algorithm. It's a blind optimizer. Humans can do both—which is our advantage over evolutionary processes.

Evolution also can't reduce friction intentionally. Organisms that happen to have lower-friction reproduction (faster generation times, more offspring) outcompete—but this is emergent, not designed.

### Compound Interest

| Layer | Instantiation |
|-------|---------------|
| Target | Capital accumulation |
| Algorithm | A = P(1 + r)^n — reinvest returns |
| Friction | Transaction costs, taxes, behavioral biases, liquidity needs |

The algorithm is mathematically simple. Most failures are friction failures:
- Not automating investments (activation friction)
- Paying high fees (execution friction)
- Panic selling in downturns (feedback friction leading to wrong action)

The target is clear. The algorithm is known. Friction is why most people don't achieve compound returns.

### The Compound Loop

| Layer | Instantiation |
|-------|---------------|
| Target | Cumulative leverage (output/effort improving over time) |
| Algorithm | Plan → Work → Review → Compound |
| Friction | What plugins, skills, and commands reduce |

This is why the compound loop is effective: it explicitly addresses all three layers. It defines the target (leverage), specifies the algorithm (the four steps), and systematically reduces friction (tooling).

The plugin ecosystem is a friction-reduction system. Each skill, command, and automation removes friction from the algorithm's execution.

### Machine Learning

| Layer | Instantiation |
|-------|---------------|
| Target | Minimize loss function |
| Algorithm | Gradient descent (or variants) |
| Friction | Computational cost, data quality, hyperparameter tuning |

The target is explicit (loss function). The algorithm is known (backpropagation). Most ML engineering is friction reduction—faster training, better data pipelines, automated hyperparameter tuning.

The field's progress is largely friction reduction: GPUs (execution friction), frameworks like PyTorch (activation friction), pre-trained models (eliminates training friction entirely for many tasks).

---

## The Friction Reduction Hierarchy

Not all friction reduction is equal. There's a hierarchy of effectiveness:

```
1. Eliminate  — Remove the friction source entirely
      ↑
2. Automate   — Make it happen without attention
      ↑
3. Reduce     — Make it easier but still present
      ↑
4. Tolerate   — Accept the friction, work despite it
```

**Eliminate > Automate > Reduce > Tolerate**

Most people operate at "tolerate"—using willpower to push through friction. Moving up the hierarchy is leverage.

**Examples:**

| Friction | Tolerate | Reduce | Automate | Eliminate |
|----------|----------|--------|----------|-----------|
| Manual savings | "I'll remember" | Reminder app | Auto-transfer | Payroll deduction |
| Code formatting | "I'll be careful" | Linter warnings | Auto-format on save | Language with no style choices |
| Meeting scheduling | Email back-and-forth | Shared calendar | Calendly | Standing meetings |

Each level up is a step-change in effectiveness. The further up the hierarchy, the less the friction matters.

---

## Meta-Optimization

The optimization stack applies to itself:

| Layer | Meta-instantiation |
|-------|-------------------|
| Target | Improve the optimization system |
| Algorithm | Reflect → identify bottleneck layer → intervene |
| Friction | Complexity of analysis, effort of change, resistance to meta-work |

This is what compound-loop/discover does: it's a meta-optimization algorithm. It finds patterns that could become new components—new friction-reducing tools.

**The recursion:**

You can optimize your optimization. And optimize that. At some point, diminishing returns kick in—but for most systems, one level of meta is valuable.

The compound loop is one level of meta: optimizing how you work. The discover command is two levels: optimizing how you optimize how you work.

**When to go meta:**

- When the object-level system is mature (basic target/algorithm/friction are sorted)
- When returns at the object level are diminishing
- When the meta-intervention has high leverage (improves many object-level processes)

Going meta too early is a trap. Fix the object-level system first.

---

## Failure Modes by Layer

| Layer | Failure Mode | Symptom |
|-------|--------------|---------|
| **Target** | Wrong target | Success feels empty; winning but not satisfied |
| **Target** | Proxy drift | Metric goes up, actual goal doesn't |
| **Target** | Unstable target | Constant pivoting, no accumulation |
| **Algorithm** | Wrong algorithm | Effort without progress; running in wrong direction |
| **Algorithm** | Suboptimal algorithm | Progress, but slower than possible |
| **Algorithm** | No algorithm | Random action, no systematic approach |
| **Friction** | High activation friction | Never starting |
| **Friction** | High execution friction | Starting but not finishing |
| **Friction** | High feedback friction | Finishing but not learning |

**Diagnosis:** Identify which layer is failing, then intervene at that layer.

Intervening at the wrong layer wastes effort:
- Reducing friction on a bad algorithm makes you faster at the wrong thing
- Improving algorithm when the target is wrong climbs the wrong hill efficiently
- Changing targets when it's really a friction problem creates churn

---

## The Separation Principle

Keep the layers separate in analysis:

1. **First, clarify the target.** What are you actually optimizing for? Is it the right thing? Is it measured well?

2. **Second, evaluate the algorithm.** Given the target, is this the right approach? Are there better known algorithms? Is there an algorithm at all?

3. **Third, reduce friction.** Given target and algorithm, what's preventing execution? Which type of friction dominates?

Mixing layers creates confusion:
- Changing algorithms when the target is wrong
- Reducing friction on a bad algorithm
- Questioning the target when it's really a friction problem
- Adding algorithm complexity when simplification (friction reduction) would work

The layers interact—friction can make algorithm evaluation hard, wrong targets can make any algorithm feel like failure—but distinguishing them is necessary for effective intervention.

---

## Limits of the Model

Where the optimization stack is less useful:

**Domains without clear targets:**
- Meaning, purpose, values — these resist target specification
- Art, beauty, play — optimization framing distorts
- Relationships — transactional framing damages

When the target can't be specified, the optimization stack doesn't apply. Forcing it creates false precision.

**When exploration > exploitation:**

Early in a domain, you don't know the target yet. Exploration to discover targets precedes optimization toward them.

The optimization stack assumes a known target. The prior step—finding the right target—is a different kind of problem (search, not optimization).

**Complex adaptive systems:**

When the target changes based on your actions (reflexive systems), static optimization fails. You need adaptive approaches that update targets as the landscape shifts.

Markets, social systems, and competitive environments often have this property. What was optimal becomes suboptimal because others adapted.

**The hammer problem:**

Seeing everything as optimization makes non-optimization domains look like failures. Sometimes the right move is to stop optimizing—to accept, appreciate, or simply be.

The model is a tool, not a worldview. Knowing when not to apply it is part of using it well.

---

## Synthesis

The optimization stack is a meta-pattern:

```
Target (what) → Algorithm (how) → Friction (why not)
```

**The key insight: most failures are friction failures.**

The target is usually known. The algorithm is usually known. Execution fails because friction is high.

This reframes diagnosis from "what should I do?" to "what's stopping me from doing what I already know?"

The answer is usually: friction. And friction can be reduced structurally—not through willpower, but through systems.

**The practical implication:**

When something isn't working:
1. Check if the target is right (rare problem)
2. Check if the algorithm is right (sometimes the problem)
3. Check if friction is too high (usually the problem)

Then intervene at the correct layer. Don't reduce friction on a bad algorithm. Don't change algorithms when the target is wrong. Don't question targets when execution is the bottleneck.

The optimization stack makes these distinctions visible.
