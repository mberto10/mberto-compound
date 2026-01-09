---
description: Run production readiness evaluation by experiencing product as a user
argument-hint: [flow-name]
allowed-tools: Read, Glob, Grep, AskUserQuestion, Task, mcp__playwright__*, mcp__linear-server__*
---

# Dogfood Command

Experience the product as a real user would, investigate technical issues, and verify infrastructure is actually connected.

## Three-Stage Evaluation

```
Stage 1: DOGFOODING EVALUATOR (User Perspective)
        "As a user, what's confusing, broken, or missing?"
                           │
                           ▼
                  Experience Report
                           │
                           ▼
Stage 2: TECHNICAL DEBUGGER (Developer Perspective)
        "Why are these issues happening? Where in the code?"
                           │
                           ▼
                 Technical Analysis
                           │
                           ▼
Stage 3: INFRASTRUCTURE AUDITOR (Backend Verification)
        "Is the backend actually implemented or just UI facades?"
                           │
                           ▼
               Infrastructure Audit
```

## Step 1: Gather Inputs

Use AskUserQuestion to collect:

**Question 1:** "Where is the product concept stored?"
- Linear document (specify document ID or name)
- Local file (path to product_concept.md or similar)

**Question 2:** "What flow do you want to dogfood?"
Options:
- Onboarding flow (new user experience)
- Core product features (main value delivery)
- Specific workflow (specify)
- Full journey (DISCOVER → ACTIVATE)

**Question 3:** "What is the starting URL?"
Default: http://localhost:3000

**Question 4:** "What evaluation depth do you need?"
- Full evaluation - UX + Code + Infrastructure (Recommended)
- UX + Code - Skip infrastructure audit
- UX only - Quick experience check

## Step 2: Load Product Concept

Based on source selected:

**If Linear document:**
- Use `mcp__linear-server__get_document` to fetch
- Extract the product vision, target user, value proposition

**If local file:**
- Read the specified file
- Parse product concept content

Confirm understanding of product concept before proceeding.

## Step 3: Launch Dogfooding Evaluator

Use the Task tool to launch the `dogfooding-evaluator` agent with:

```
Product Concept: [loaded content]
Target Flow: [selected flow]
Starting URL: [specified URL]

Your mission: Experience this product as the target user described in the concept.
Walk through the [target flow] and document:
- What you understand vs. what confuses you
- What works vs. what doesn't
- What delivers value vs. what feels incomplete

Save your experience report to: dogfood-report-[flow].md
```

Wait for dogfooding-evaluator to complete and return the experience report.

## Step 4: Present Experience Report

Show the user:
- Overall assessment
- Vision alignment percentage
- Count of findings by severity
- Top issues found

## Step 5: Launch Technical Debugger (If Selected)

If user selected "UX + Code" or "Full evaluation":

Use the Task tool to launch the `technical-debugger` agent with:

```
Dogfooding Report: [path to experience report]

Your mission: Investigate the technical root causes of each finding.
For each issue:
- Trace through the codebase to find where it originates
- Document specific file:line locations
- Provide recommended code fixes

Save your analysis to: technical-analysis-[flow].md
```

Wait for technical-debugger to complete.

## Step 6: Launch Infrastructure Auditor (If Selected)

If user selected "Full evaluation":

Use the Task tool to launch the `infrastructure-auditor` agent with:

```
Flow Evaluated: [selected flow]
Product Concept: [loaded content]
Previous Reports:
- Experience Report: [path]
- Technical Analysis: [path]

Your mission: Verify that the backend infrastructure is actually implemented.

Check:
1. DATABASE: Are tables/collections created? Is data persisting?
2. AUTH: Does signup actually create user records in YOUR database?
3. APIs: Do endpoints return real data or mocks/stubs?
4. INTEGRATIONS: Are external services (Supabase, Stripe, etc.) connected?
5. STATE: Is localStorage the only "database"? What survives a refresh?

Key question: If a user goes through this flow, what actually gets saved vs. what disappears?

Save your audit to: infrastructure-audit-[flow].md
```

Wait for infrastructure-auditor to complete.

## Step 7: Create Linear Project (Optional)

If Linear MCP is available, ask:
"Would you like to create a Linear project with issues for each finding?"

If yes:
1. Get teams using `mcp__linear-server__list_teams`
2. Ask which team to use
3. Create project: "Dogfooding: [Product] - [Flow]"
4. Create issues organized by category:
   - **UX Issues** (from dogfooding report) - label: `ux`, `dogfooding`
   - **Code Issues** (from technical analysis) - label: `bug`, `dogfooding`
   - **Infrastructure Gaps** (from audit) - label: `infrastructure`, `dogfooding`

## Step 8: Final Summary

Present combined results:

```
DOGFOODING COMPLETE
═══════════════════

Product: [Name]
Flow Evaluated: [Flow]

PRODUCTION READINESS ASSESSMENT
───────────────────────────────
┌─────────────────┬────────┐
│ Layer           │ Score  │
├─────────────────┼────────┤
│ User Experience │ [X]%   │
│ Code Quality    │ [X]%   │
│ Infrastructure  │ [X]%   │
├─────────────────┼────────┤
│ OVERALL         │ [X]%   │
└─────────────────┴────────┘

FINDINGS BY LAYER
─────────────────
UX Issues:           [N] (Critical: X, High: X, Medium: X, Low: X)
Code Issues:         [N] (Critical: X, High: X, Medium: X, Low: X)
Infrastructure Gaps: [N] (Critical: X, High: X, Medium: X, Low: X)

INFRASTRUCTURE STATUS
─────────────────────
Database:      [Connected/Partial/Missing]
Auth Persist:  [Connected/Partial/Missing]
API Endpoints: [Real/Stubbed/Missing]
Integrations:  [Connected/Partial/Missing]

REPORTS GENERATED
─────────────────
• Experience Report:    [path]
• Technical Analysis:   [path]
• Infrastructure Audit: [path]

TOP PRIORITIES
──────────────
1. [Most critical infrastructure gap - nothing works without this]
2. [Highest impact UX fix]
3. [Critical code issue]

RECOMMENDED NEXT STEPS
──────────────────────
[Specific action items based on the lowest-scoring layer]
```

## Usage Examples

### Full production readiness check
```
/dogfood onboarding
```
Select "Full evaluation" - runs all three stages.

### Quick UX check
```
/dogfood "signup flow"
```
Select "UX only" for quick feedback.

### Code-focused debugging
```
/dogfood "payment flow"
```
Select "UX + Code" to skip infrastructure audit.

### Interactive mode
```
/dogfood
```
Will prompt for all options.
