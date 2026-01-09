---
name: User Lifecycle Framework
description: This skill should be used when the user asks to "evaluate UX", "run UX evaluation", "check user experience", "evaluate the signup flow", "test the onboarding", "assess user journey", "evaluate a lifecycle phase", or mentions any of the 8 lifecycle phases (DISCOVER, SIGN UP, ONBOARD, ACTIVATE, ADOPT, ENGAGE, RETAIN, EXPAND). Provides systematic UX evaluation methodology using the User Lifecycle Framework and Playwright browser automation.
version: 0.1.0
---

# User Lifecycle Framework for UX Evaluation

Systematic methodology for evaluating frontend user experience by walking actual user paths and assessing against the User Lifecycle Framework.

**Core principle:** Evaluate what users experience, not what code does.

## The Framework: 8 Lifecycle Phases

Every user journey progresses through these phases:

```
DISCOVER → SIGN UP → ONBOARD → ACTIVATE → ADOPT → ENGAGE → RETAIN → EXPAND
```

| Phase | User Question | Evaluation Goal |
|-------|---------------|-----------------|
| DISCOVER | "Why should I care?" | Value communication, conversion triggers |
| SIGN UP | "Let me in" | Friction reduction, trust signals |
| ONBOARD | "Help me get started" | Guidance clarity, progress visibility |
| ACTIVATE | "Aha! This is useful" | First value delivery, success moment |
| ADOPT | "This is how I use it" | Core loop establishment, muscle memory |
| ENGAGE | "I check this regularly" | Habit formation, return triggers |
| RETAIN | "I can't work without this" | Ongoing value demonstration |
| EXPAND | "I want more" | Growth paths, upgrade clarity |

## Evaluation Prerequisites

Before evaluating, establish product context from one of these sources:

### From Linear Document
```
Read the Linear document specified by user.
Extract: product name, value proposition, target user, core loop, success metrics.
```

### From Local Settings File
```
Read .claude/ux-evaluator.local.md
Parse YAML frontmatter for context fields.
```

**Required context fields:**
- `product_name` - What is being evaluated
- `value_proposition` - Core problem solved
- `target_user` - Who the product serves
- `core_loop` - Main user workflow
- `success_metrics` - How success is measured

## Evaluation Workflow

### Step 1: Establish Context

Load product context from specified source (Linear or local file).
Confirm understanding of product goals before proceeding.
Identify what success looks like for the target phase.

### Step 2: Navigate to Starting Point

Use Playwright to navigate to the user-specified URL:
```
browser_navigate → starting URL (typically localhost dev server)
```

### Step 3: Capture Initial State

Take accessibility snapshot to understand page structure:
```
browser_snapshot → captures semantic structure, interactive elements
```

Analyze the snapshot for:
- Semantic hierarchy (headings, landmarks, regions)
- Interactive elements (buttons, links, forms)
- Labels and descriptions
- Focus order and keyboard accessibility

### Step 4: Walk the User Path

For the target phase, simulate actual user behavior:

1. **Identify entry point** - Where does user start for this phase?
2. **Determine goal** - What is user trying to accomplish?
3. **Execute interactions** - Click, type, navigate as user would
4. **Observe responses** - Loading states, feedback, errors
5. **Capture checkpoints** - Snapshot at each significant step

Use these Playwright tools:
- `browser_click` - Interact with buttons, links
- `browser_type` - Fill text inputs
- `browser_fill_form` - Complete forms efficiently
- `browser_snapshot` - Capture state at checkpoints
- `browser_wait_for` - Handle async operations
- `browser_console_messages` - Check for errors
- `browser_network_requests` - Identify slow/failed requests

### Step 5: Apply Phase-Specific Heuristics

Consult `references/phase-heuristics.md` for detailed evaluation criteria.

For each phase, evaluate against:
- **Clarity** - Is the purpose/action obvious?
- **Efficiency** - How many steps to complete?
- **Feedback** - Does user know what's happening?
- **Recovery** - Can user fix mistakes easily?
- **Delight** - Any moments of positive surprise?

### Step 6: Document Findings

For each issue discovered:

```
┌─────────────────────────────────────────┐
│ ISSUE: [Brief title]                    │
│ PHASE: [Lifecycle phase]                │
│ SEVERITY: [Critical/High/Medium/Low]    │
│ LOCATION: [URL or element path]         │
├─────────────────────────────────────────┤
│ OBSERVATION:                            │
│ [What was observed]                     │
│                                         │
│ EXPECTED:                               │
│ [What should happen]                    │
│                                         │
│ RECOMMENDATION:                         │
│ [Specific fix]                          │
└─────────────────────────────────────────┘
```

### Step 7: Generate Report

Create structured report with:
1. **Executive Summary** - Key findings, overall score
2. **Phase Assessment** - Detailed evaluation per phase
3. **Issue List** - All findings with severity
4. **Flow Diagram** - ASCII visualization of user path
5. **Recommendations** - Prioritized action items

See `references/report-templates.md` for ASCII diagram patterns.

### Step 8: Create Linear Issues (if available)

If Linear MCP is accessible:
1. Create Project: "UX Evaluation: [Product] - [Phase]"
2. Create child Issues for each finding
3. Set priority based on severity mapping:
   - Critical → Urgent (1)
   - High → High (2)
   - Medium → Normal (3)
   - Low → Low (4)

## Severity Classification

**Critical** - Blocks user from completing phase goal
- Cannot submit form
- Navigation broken
- Data loss risk

**High** - Significantly degrades experience
- Confusing flow
- Missing feedback
- Accessibility barriers

**Medium** - Noticeable friction
- Extra steps required
- Unclear labels
- Slow responses

**Low** - Minor improvements
- Visual polish
- Copy refinement
- Nice-to-have features

## Custom Focus Evaluations

For evaluations outside the 8 phases, adapt the framework:

1. **Define the focus** - What specific flow or feature?
2. **Identify success criteria** - What does good look like?
3. **Map to nearest phase** - Which phase principles apply?
4. **Apply relevant heuristics** - Use phase criteria as baseline
5. **Document with same structure** - Consistent reporting

## Playwright Tool Usage Patterns

### Form Evaluation Pattern
```
browser_snapshot → identify form fields
browser_fill_form → complete form
browser_snapshot → verify feedback
browser_console_messages → check for errors
```

### Navigation Evaluation Pattern
```
browser_snapshot → identify navigation elements
browser_click → navigate
browser_wait_for → page load
browser_snapshot → verify destination
```

### Error Handling Evaluation Pattern
```
browser_fill_form → submit invalid data
browser_snapshot → capture error state
Evaluate: error clarity, recovery options
```

## Additional Resources

### Reference Files

For detailed evaluation criteria per phase:
- **`references/phase-heuristics.md`** - Comprehensive heuristics for each lifecycle phase

For report generation:
- **`references/report-templates.md`** - ASCII diagram templates and report structure

### Integration Points

- **Playwright MCP** - Browser automation tools
- **Linear MCP** - Issue/project creation (optional)
- **Product context** - From Linear doc or .local.md file
