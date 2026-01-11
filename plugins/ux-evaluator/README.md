# UX Evaluator Plugin

Frontend UX evaluation and production readiness testing using the User Lifecycle Framework and Playwright browser automation.

## Overview

This plugin provides three complementary evaluation modes:

1. **UX Evaluation** (`/ux-eval`) - Assess user experience quality against heuristics
2. **Dogfooding** (`/dogfood`) - Experience the product as a real user, then trace issues to code
3. **MCP Evaluation** (`/mcp-eval`) - Evaluate MCP-powered apps through conversational intent lens

**Core principle:** "As a user of this product, I can understand everything, it works flawlessly, and I see a lot of value out of it."

## Three Evaluation Modes

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│  /ux-eval                    /dogfood                      /mcp-eval                          │
│  ─────────                   ─────────                     ──────────                         │
│  UX Quality Assessment       Production Readiness          MCP App Evaluation                 │
│                                                                                               │
│  "Does this feel right?"     "Does this work?"             "Does the tool→widget chain       │
│                                                             serve user intents?"              │
│                                                                                               │
│  • Apply heuristics          • Experience as user          • Derive persona from concept     │
│  • Evaluate clarity          • Note confusion/friction     • Walk UI as that persona         │
│  • Check accessibility       • Assess value delivery       • Evaluate each screen's chain    │
│  • Generate UX report        • Trace issues to code        • Detect MCP failure patterns     │
│                                                            • Categorize by layer             │
│                                                                                               │
│  Output: UX issues           Output: Experience report     Output: Improvements by layer     │
│  with recommendations        + Technical analysis          (schema/output/widget/flow)       │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Recommended workflow:**
1. Run `/dogfood` first - make sure it works
2. Run `/ux-eval` second - make sure it feels right
3. Run `/mcp-eval` for MCP apps - ensure tool→widget chain serves intents

## MCP Evaluation Framework

The `/mcp-eval` mode uses a specialized framework for MCP-powered apps:

### Why MCP Apps Need Different Evaluation

For MCP apps, users arrive at screens via LLM conversations. The evaluation must consider:
- What tool calls would be made to serve the user's intent
- Whether the tool output contains what the widget needs
- Whether the widget presents information appropriately for the intent

### MCP-Specific Failure Patterns

| Pattern | Description |
|---------|-------------|
| Over-clarifying | Asking what could be inferred from context |
| Under-clarifying | Committing without gathering necessary constraints |
| Tool ping-pong | Multiple calls that could be batched |
| Widget mismatch | Wrong display type for the user's intent |
| Poor edit loop | Cannot refine without starting over |
| No commit gate | Irreversible action without confirmation |
| Error opacity | Technical errors shown verbatim |

### Improvement Layers

Improvements are categorized by what needs to change:

| Layer | What Changes | Example |
|-------|--------------|---------|
| Tool Schema | Parameter definitions | Add `flexibility` param |
| Tool Output | Response structure | Include `recommended` flag |
| Widget | Display, controls | Add filter controls |
| Flow | Screen sequence | Add confirmation step |

### Two Modes

- **Hypothetical tracing** - Infer tool calls from UI and codebase
- **Actual tool calling** - Call MCP tools via HTTP endpoint to verify

## User Lifecycle Framework

The `/ux-eval` and `/dogfood` modes use the 8-phase User Lifecycle Framework:

| Phase | User Question | Goal |
|-------|---------------|------|
| DISCOVER | "Why should I care?" | Communicate value, convert visitors |
| SIGN UP | "Let me in" | Frictionless authentication |
| ONBOARD | "Help me get started" | Guide through initial setup |
| ACTIVATE | "Aha! This is useful" | Deliver first value moment |
| ADOPT | "This is how I use it" | Establish core usage loop |
| ENGAGE | "I check this regularly" | Build habit, bring users back |
| RETAIN | "I can't work without this" | Demonstrate ongoing value |
| EXPAND | "I want more" | Growth, upgrades, referrals |

## Usage

### UX Evaluation

```
/ux-eval
```

Interactively asks for:
1. Product context source (Linear or local file)
2. Evaluation phase (lifecycle phase or custom focus)
3. Starting URL

**Output:**
- UX report with heuristic assessment
- Severity-rated findings
- ASCII flow diagrams
- Linear issues (optional)

### Dogfooding (Production Readiness)

```
/dogfood
```

Interactively asks for:
1. Product concept source (Linear or local file)
2. Target flow (onboarding, core features, etc.)
3. Starting URL
4. Run technical analysis? (Yes/No)

**Output:**
- Experience report (user perspective)
- Technical analysis (code investigation) - if selected
- Combined Linear project with issues (optional)

## Dogfooding: Two-Agent System

The dogfooding mode uses two specialized agents:

```
┌─────────────────────────────────────────────────────────────────────┐
│  DOGFOODING EVALUATOR (User Perspective)                            │
│  ─────────────────────────────────────────                          │
│  • Adopts target user mindset from product concept                  │
│  • Walks through the product naturally                              │
│  • Documents: confusion, friction, broken features, missing value   │
│  • Does NOT read code - stays in user perspective                   │
│                                                                     │
│  Output: Experience Report                                          │
│  "As a user, I found these issues..."                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TECHNICAL DEBUGGER (Developer Perspective)                         │
│  ──────────────────────────────────────────                         │
│  • Takes experience report as input                                 │
│  • Investigates codebase for each finding                           │
│  • Traces issues to specific file:line locations                    │
│  • Provides recommended code fixes                                  │
│                                                                     │
│  Output: Technical Analysis                                         │
│  "These issues stem from these code locations..."                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Example Dogfooding Flow

```
User: /dogfood "onboarding flow"

─────────────────────────────────────────────────────────────────────

DOGFOODING EVALUATOR runs...

Walking onboarding as a new user...

Step 1: Landed on /onboard ✓
Step 2: Filled profile form ✓
Step 3: Clicked "Save" → Nothing happened ✗
        No feedback, no error, button just didn't respond
Step 4: Refreshed page → My data is gone

FINDING: Profile data doesn't persist after form submission
IMPACT: Critical - Cannot proceed with onboarding

─────────────────────────────────────────────────────────────────────

TECHNICAL DEBUGGER runs...

Investigating: "Profile save does nothing"

1. Found form component: src/components/OnboardingForm.tsx
2. Found onSubmit handler at line 47
3. Handler calls updateProfile() but doesn't await result
4. API call returns 401 - auth token not included in headers

ROOT CAUSE: Auth header missing in API client
LOCATION: src/services/api.ts:23

RECOMMENDED FIX:
+ 'Authorization': `Bearer ${getAuthToken()}`

─────────────────────────────────────────────────────────────────────
```

## Product Context

Before evaluation, define your product context:

### Option 1: Linear Document

Create a Linear document with your product concept:

```markdown
# Product Concept

**Product Name:** Dispatch
**Value Proposition:** Editorial command center that saves content teams 2 hours per day
**Target User:** Content managers, editors, publishers
**Core Loop:** Create briefing → Review AI suggestions → Publish
**Success Metrics:** Time to first published briefing

## Key Features
- AI-powered content suggestions
- Team collaboration
- Multi-channel publishing

## User Goals
1. Create professional briefings quickly
2. Maintain consistent brand voice
3. Collaborate with team efficiently
```

### Option 2: Local File

Create `product_concept.md` or `.claude/ux-evaluator.local.md`:

```yaml
---
product_name: "Dispatch"
value_proposition: "Editorial command center that saves content teams 2 hours per day"
target_user: "Content managers, editors, publishers"
core_loop: "Create briefing → Review AI suggestions → Publish"
success_metrics: "Time to first published briefing"
dev_server_url: "http://localhost:3000"
---

# Product Concept

[Additional context about features, goals, etc.]
```

## Requirements

- **Playwright MCP**: Browser automation tools (required)
- **Linear MCP**: For creating projects/issues from findings (optional)

## Components

### Commands

| Command | Purpose |
|---------|---------|
| `/ux-eval` | UX quality assessment with heuristics |
| `/dogfood` | Production readiness through user experience |
| `/mcp-eval` | MCP app evaluation through conversational intent |

### Agents

| Agent | Role |
|-------|------|
| `ux-evaluator` | Autonomous UX assessment against heuristics |
| `dogfooding-evaluator` | User perspective - experiences product naturally |
| `technical-debugger` | Developer perspective - traces issues to code |
| `infrastructure-auditor` | Backend verification - checks if services are connected |
| `mcp-evaluator` | MCP app evaluation - walks UI through intent lens |

### Skills

`user-lifecycle-framework` - Core knowledge including:
- 8 lifecycle phases with evaluation criteria
- Phase-specific heuristics
- Report templates with ASCII diagrams
- Journey evaluation methodology
- Technical investigation patterns

`mcp-evaluation-framework` - MCP-specific knowledge including:
- Turn-based evaluation schema
- MCP failure pattern detection
- Improvement layer categorization
- Intent derivation from product concepts

`backend-readiness-framework` - Backend production readiness knowledge including:
- Infrastructure reality validation
- Security, performance, reliability, observability, and data integrity layers
- Scoring guidance and report templates

## Output Examples

### UX Evaluation Report

```
OVERALL UX SCORE: 72/100

Clarity      [████████████████░░░░] 80%
Efficiency   [██████████████░░░░░░] 70%
Feedback     [████████████░░░░░░░░] 60%
Recovery     [██████████████████░░] 90%
Accessibility[██████████░░░░░░░░░░] 50%
```

### Dogfooding Report

```
VISION ALIGNMENT

Promise                          Delivered?
───────                          ──────────
"Editorial command center"       ◐ Partially
"Save 2 hours per day"           ○ Not yet
"AI-powered suggestions"         ● Yes

Production Readiness: 65%
Ready for: Beta users
Blocking issues: 2
```

### Technical Analysis

```
┌────────────────────────┬──────────┬──────────────────────────────────┐
│ Flow                   │ Status   │ Notes                            │
├────────────────────────┼──────────┼──────────────────────────────────┤
│ Form → Database        │ ✓ PASS   │ User record created correctly    │
│ Database → Profile UI  │ ⚠ WARN   │ Avatar shows placeholder         │
│ Signup → Welcome Email │ ✗ FAIL   │ SMTP not configured              │
└────────────────────────┴──────────┴──────────────────────────────────┘
```

## File Structure

```
ux-evaluator/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── ux-eval.md              # UX quality assessment
│   ├── dogfood.md              # Production readiness testing
│   └── mcp-eval.md             # MCP app evaluation
├── agents/
│   ├── ux-evaluator.md         # Heuristic-based UX evaluation
│   ├── dogfooding-evaluator.md # User perspective evaluation
│   ├── technical-debugger.md   # Code investigation
│   ├── infrastructure-auditor.md # Backend verification
│   └── mcp-evaluator.md        # MCP app evaluation
├── skills/
│   ├── user-lifecycle-framework/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── phase-heuristics.md
│   │       ├── report-templates.md
│   │       ├── journey-evaluation.md
│   │       └── technical-investigation.md
│   └── mcp-evaluation-framework/
│       ├── SKILL.md
│       └── references/
│           ├── turn-evaluation-schema.md
│           ├── failure-patterns.md
│           ├── improvement-layers.md
│           └── intent-derivation.md
│   └── backend-readiness-framework/
│       ├── SKILL.md
│       └── references/
│           ├── layer-checklists.md
│           ├── report-template.md
│           └── scoring-guidance.md
├── examples/
│   └── ux-evaluator.local.md.example
└── README.md
```

## Best Practices

1. **Start with dogfooding** - Ensure things work before evaluating UX
2. **Use detailed product concept** - Better context = better evaluation
3. **Evaluate one flow at a time** - More focused, actionable findings
4. **Run technical analysis** - Get code-level fixes, not just symptoms
5. **Create Linear issues** - Turn findings into trackable work
