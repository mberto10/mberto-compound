---
description: Run goal-driven end-to-end evaluation tracing user goals across system layers
argument-hint: [product] [goal-id]
allowed-tools: Read, Glob, Grep, AskUserQuestion, Task, mcp__playwright__*, mcp__linear-server__*
---

# Goal-Driven E2E Evaluation Command

Evaluate whether users can achieve specific goals by tracing through all relevant system layers.

## Core Concept

```
USER GOAL → LAYER ANALYSIS → ROOT CAUSE IDENTIFICATION → PRIORITIZED FIXES
```

**Key insight:** Problems can originate at one layer but manifest at another. This evaluation traces issues to their root cause.

## Step 1: Gather Inputs

Use AskUserQuestion to collect:

**Question 1:** "Which product area do you want to evaluate?"
Options:
- Design Studio
- Command Center
- Publication Flow
- Other (specify)

**Question 2:** "How do you want to specify the goal?"
Options:
- From goal library (browse available goals)
- Custom goal statement

**If "From goal library":**
Read `goals/index.yaml` to get available products
Read `goals/{product}/*.yaml` to list available goals
Present goals with:
- ID
- Statement
- Type
- Success criteria count

Let user select a goal.

**If "Custom goal statement":**
Ask: "What is the user trying to accomplish? (e.g., 'Create and save my first design')"

**Question 3:** "What is the starting URL?"
Default options based on product:
- Design Studio: http://localhost:3001/design-studio
- Command Center: http://localhost:3001
- Other: http://localhost:3001

**Question 4:** "Which layers should be evaluated?"
Options:
- All relevant layers (Recommended) - Based on goal type
- UX + Code only - Skip infrastructure
- UX only - Quick experience check
- Specific layers (select)

## Step 2: Load Goal Definition

**If from library:**
```
Read goals/{product}/{phase}.yaml
Extract goal by ID:
- statement
- type
- success_criteria
- layer_weights
- preconditions
- evaluation_hints
```

**If custom goal:**
Infer goal properties:
```
Analyze statement to determine:
- Type: navigation/configuration/generation/operational/recovery
- Relevant layers based on type
- Success criteria from statement
```

Present goal analysis:
```
GOAL ANALYSIS
═════════════
Statement: [goal statement]
Type: [inferred or library type]
Phase: [lifecycle phase]

Success Criteria:
- [ ] [criterion 1]
- [ ] [criterion 2]
...

Layer Involvement:
| Layer | Weight | Will Analyze |
|-------|--------|--------------|
| UX    | [0.X]  | [Yes/No]     |
| Code  | [0.X]  | [Yes/No]     |
| AI    | [0.X]  | [Yes/No]     |
| Infra | [0.X]  | [Yes/No]     |
```

Confirm with user before proceeding.

## Step 3: Execute Layer Analysis

Based on goal type, spawn agents **sequentially** using the Task tool - each stage feeds into the next.

### Sequential Stage Flow (Configuration Goals)

```
Stage 1: UX EVALUATOR (User Perspective)
        "Can the user achieve this goal via UI?"
                           │
                           ▼
                  UX Experience Report
                           │
                           ▼
Stage 2: TECHNICAL DEBUGGER (Developer Perspective)
        "Why are the UX issues happening? Where in the code?"
                           │
                           ▼
                 Technical Analysis
                           │
                           ▼
Stage 3: INFRASTRUCTURE AUDITOR (Backend Verification)
        "Is the data actually persisting? Are APIs working?"
                           │
                           ▼
               Infrastructure Audit
                           │
                           ▼
Stage 4: CONFIG FIDELITY TESTER (Round-Trip Verification)
        "Does config survive: UI → API → DB → API → UI?"
                           │
                           ▼
                 Fidelity Report
                           │
                           ▼
              ROOT CAUSE SYNTHESIS
        "Which layer is the ORIGIN of each issue?"
```

**Key principle:** Each stage uses findings from previous stages to focus investigation.

### For Configuration Goals (Design Studio default)

**Stage 1: UX Evaluation**

Use the **ux-evaluator** agent to perform the UX evaluation:

```
Use the ux-evaluator agent to evaluate this goal:

GOAL: [statement]
STARTING URL: [url]
SUCCESS CRITERIA:
[criteria list]

Walk the user journey for this goal and document:
- Can the goal be achieved via UI?
- What friction points exist?
- What feedback is missing?
- Any errors encountered?

Save your report to: goal-eval-[goal_id]-ux.md
```

Wait for the agent to complete and capture the UX report path.

**Stage 2: Technical Analysis** (if code layer selected)

Use the **technical-debugger** agent to analyze code issues:

```
Use the technical-debugger agent to investigate:

GOAL: [statement]
UX REPORT: [path to stage 1 report]
SUCCESS CRITERIA:
[criteria list]

Trace the code path for this goal.
For each UX issue found, determine:
- Is there a code cause?
- Are handlers implemented correctly?
- Do transforms work as expected?

Save your analysis to: goal-eval-[goal_id]-code.md
```

Wait for the agent to complete and capture the technical analysis path.

**Stage 3: Infrastructure Audit** (if infra layer selected)

Use the **infrastructure-auditor** agent to verify backend:

```
Use the infrastructure-auditor agent to audit:

GOAL: [statement]
PREVIOUS REPORTS:
- UX: [path]
- Code: [path]
SUCCESS CRITERIA:
[criteria list]

Verify infrastructure supports this goal:
- Do required endpoints exist?
- Does data persist correctly?
- Can data be retrieved?

Save your audit to: goal-eval-[goal_id]-infra.md
```

Wait for the agent to complete and capture the infrastructure audit path.

**Stage 4: Fidelity Testing** (for configuration goals, optional)

Use the **config-fidelity-tester** agent to test round-trip:

```
Use the config-fidelity-tester agent to test:

GOAL: [statement]
FIELDS TO TEST: [from success criteria]
URL: [url]

Test configuration round-trip:
UI → State → API → Database → API → State → UI

Report fidelity metrics and any data loss.

Save your report to: goal-eval-[goal_id]-fidelity.md
```

Wait for the agent to complete and capture the fidelity report path.

### For Navigation Goals

Only use the ux-evaluator agent (Stage 1).

### For Recovery Goals

Use ux-evaluator then technical-debugger agents sequentially.

### For Generation Goals

Use all stage agents sequentially, plus AI trace analysis (if available).

## Step 4: Synthesize Findings

Use the **goal-orchestrator** agent to correlate findings across all layers:

```
Use the goal-orchestrator agent to synthesize findings:

REPORTS TO ANALYZE:
- UX Report: [path to ux report]
- Technical Analysis: [path to code report]
- Infrastructure Audit: [path to infra report]
- Fidelity Report: [path to fidelity report, if exists]

GOAL: [statement]

For each issue found across all reports:
1. Identify symptom layer (where it was observed)
2. Trace to root cause layer (where it originates)
3. Document the chain

Format each issue as:

ISSUE: [title]

Symptom: [user-facing description]

Layer Trace:
| Layer | Finding |
|-------|---------|
| UX    | [observation] |
| Code  | [observation] |
| Infra | [observation] |

Root Cause:
- Layer: [origin layer]
- Location: [file:line or endpoint]
- Issue: [specific problem]

Fix: [recommendation]
Priority: [Critical/High/Medium/Low]
```

Wait for the agent to complete and use the synthesis for the final report.

## Step 5: Generate Report

Create unified evaluation report:

```
GOAL EVALUATION COMPLETE
════════════════════════

Goal: [statement]
Product: [product]
Type: [goal type]

ACHIEVEMENT STATUS
──────────────────
[✅ ACHIEVED / ⚠️ PARTIALLY ACHIEVED / ❌ NOT ACHIEVED]

Success Criteria:
[✅] [achieved criterion]
[❌] [failed criterion] → Issue #X
...

ISSUES BY ORIGIN LAYER
──────────────────────
UX Layer:     [N] issues
Code Layer:   [N] issues
Infra Layer:  [N] issues
Total:        [N] issues

SEVERITY BREAKDOWN
──────────────────
Critical: [N]
High:     [N]
Medium:   [N]
Low:      [N]

ROOT CAUSE ANALYSIS
───────────────────
[Summary of key root cause chains]

TOP PRIORITIES
──────────────
1. [Critical] [issue title] - [origin layer]
2. [High] [issue title] - [origin layer]
3. [Medium] [issue title] - [origin layer]

REPORTS GENERATED
─────────────────
• UX Evaluation: [path]
• Technical Analysis: [path]
• Infrastructure Audit: [path]
• Fidelity Test: [path] (if applicable)

RECOMMENDED FIX ORDER
─────────────────────
1. [First fix - addresses blocking issue]
2. [Second fix - addresses high impact]
...
```

## Step 6: Create Linear Issues (Optional)

Ask: "Would you like to create Linear issues for these findings?"

If yes:
1. Get teams using `mcp__linear-server__list_teams`
2. Ask which team to use
3. Create project: "Goal Eval: [Product] - [Goal ID]"
4. Create issues organized by origin layer:
   - Label issues with origin layer
   - Set priority based on severity
   - Add blocking relationships

## Usage Examples

### Evaluate a library goal
```
/goal-eval design-studio first_design_creation
```
Loads goal from library, runs full evaluation.

### Evaluate with custom goal
```
/goal-eval design-studio "save a design and reload it"
```
Infers goal type, runs relevant layers.

### Quick UX check
```
/goal-eval design-studio configure_brand_colors
```
Select "UX only" for fast feedback.

### Interactive mode
```
/goal-eval
```
Will prompt for all options.

### List available goals
```
/goal-eval design-studio --list
```
Shows all goals for the product.

## Available Goals (Design Studio)

| Phase | Goal ID | Type |
|-------|---------|------|
| ONBOARD | `first_design_creation` | configuration |
| ONBOARD | `template_start` | configuration |
| ONBOARD | `interface_orientation` | navigation |
| ONBOARD | `configure_brand_colors` | configuration |
| ACTIVATE | `preview_with_content` | configuration |
| ACTIVATE | `add_section` | configuration |
| ACTIVATE | `real_time_preview` | configuration |
| ACTIVATE | `understand_sections` | navigation |
| ADOPT | `edit_existing_design` | configuration |
| ADOPT | `recover_from_mistakes` | recovery |
| ADOPT | `manage_multiple_designs` | operational |
| ADOPT | `rapid_iteration` | configuration |
| ADOPT | `connect_to_composition` | configuration |

## Reference

- Goal schema: `goals/schema.md`
- Goal index: `goals/index.yaml`
- Product goals: `goals/{product}/*.yaml`
- Skill documentation: `skills/goal-driven-evaluation/SKILL.md`
