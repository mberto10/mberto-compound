---
description: Run interactive UX evaluation using User Lifecycle Framework
argument-hint: [phase-or-focus]
allowed-tools: Read, Glob, Grep, AskUserQuestion, mcp__playwright__*, mcp__linear-server__*
---

# UX Evaluation Command

Execute a systematic UX evaluation by walking actual user paths with Playwright browser automation.

## Step 1: Gather Product Context

First, determine where product context is stored. Use AskUserQuestion to ask:

**Question:** "Where is the product context stored?"
**Options:**
- Linear document (specify document ID or name)
- Local file (.claude/ux-evaluator.local.md)

If Linear:
- Ask for document ID or name
- Read document using `mcp__linear-server__get_document`
- Extract: product_name, value_proposition, target_user, core_loop, success_metrics

If local file:
- Read `.claude/ux-evaluator.local.md`
- Parse YAML frontmatter for context fields

Confirm understanding of product before proceeding.

## Step 2: Define Evaluation Scope

Use AskUserQuestion to determine evaluation focus:

**Question:** "What would you like to evaluate?"
**Options:**
- DISCOVER - Landing page, value communication
- SIGN UP - Registration flow, authentication
- ONBOARD - Initial setup, welcome experience
- ACTIVATE - First value moment, aha experience
- ADOPT - Core usage loop, main workflow
- ENGAGE - Return triggers, habit formation
- RETAIN - Long-term value, loyalty features
- EXPAND - Growth paths, upgrades
- Custom focus (specify)

If custom focus selected, ask for specific focus description.

## Step 3: Get Starting URL

Use AskUserQuestion:

**Question:** "What is the starting URL for evaluation?"
**Default suggestion:** http://localhost:3000 (or extract from product context if available)

Validate URL format before proceeding.

## Step 4: Confirm and Execute

Summarize evaluation parameters:
- Product: [product_name]
- Phase/Focus: [selected phase or custom focus]
- Starting URL: [url]
- Evaluation Depth: Standard (~5-7 minutes)

Ask for confirmation to proceed.

## Step 5: Run Evaluation

Apply the User Lifecycle Framework skill methodology:

1. Navigate to starting URL using `mcp__playwright__browser_navigate`
2. Capture initial accessibility snapshot using `mcp__playwright__browser_snapshot`
3. Walk the user path for the selected phase:
   - Interact with elements using browser_click, browser_type, browser_fill_form
   - Capture snapshots at key checkpoints
   - Monitor console for errors using browser_console_messages
   - Check network requests using browser_network_requests
4. Apply phase-specific heuristics from the framework
5. Document all findings with severity ratings

## Step 6: Generate Report

Create comprehensive report including:
- Executive summary with overall score
- Phase assessment with detailed findings
- Issue list with severity and recommendations
- ASCII flow diagrams showing user path
- Prioritized action items

Save report to: `ux-eval-report-{timestamp}.md` in current directory.

## Step 7: Create Linear Project (if available)

If Linear MCP is accessible:

1. Create new Project:
   - Name: "UX Evaluation: [Product] - [Phase]"
   - Description: Executive summary and link to report
   - Team: Ask user which team (use mcp__linear-server__list_teams first)

2. Create child Issues for each finding:
   - Title: Issue title from report
   - Description: Full issue details including observation, expected behavior, recommendation
   - Priority: Map severity (Critical→Urgent, High→High, Medium→Normal, Low→Low)
   - Labels: Add "ux-evaluation" label

3. Report Linear Project URL to user.

## Output

Provide summary to user:
- Overall score and key findings
- Report file location
- Linear Project URL (if created)
- Top 3 recommended immediate actions
