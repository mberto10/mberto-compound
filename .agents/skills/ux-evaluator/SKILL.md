---
name: UX Evaluator (Codex)
description: Use when the user asks to evaluate UX, dogfood a product, assess production readiness, run an MCP app evaluation, trace UI-to-backend gaps, or find UX issues in a flow. Provides three modes (ux-eval, dogfood, mcp-eval) adapted to Codex-native workflows.
version: 0.1.0
---

# UX Evaluator (Codex)

This skill replicates the ux-evaluator plugin in Codex. It provides three modes and replaces Claude-only primitives with Codex-native flows (interactive prompts, sequential phases, file-based handoffs).

## Modes

- **ux-eval**: UX quality assessment using the User Lifecycle Framework.
- **dogfood**: Production readiness from a user perspective, with optional technical and infrastructure audits.
- **mcp-eval**: MCP app evaluation through the conversational intent lens (tool -> widget chain).

## Quick Start (Input Checklist)

Ask for the minimum inputs before starting:

1. **Mode**: `ux-eval`, `dogfood`, or `mcp-eval`
2. **Product context source**:
   - `.codex/ux-evaluator.local.md` (preferred)
   - `.claude/ux-evaluator.local.md` (compat)
   - Linear document (ID or name)
   - Another local markdown file path
3. **Starting URL**: default `http://localhost:3000`
4. **Flow or phase**:
   - `ux-eval`: lifecycle phase or custom focus
   - `dogfood`: target flow (onboarding, core workflow, etc)
   - `mcp-eval`: intent or flow
5. **Evaluation depth** (dogfood only):
   - UX only
   - UX + Code
   - Full (UX + Code + Infrastructure)
6. **MCP mode** (mcp-eval only):
   - Hypothetical tracing
   - Actual tool calling (needs tool endpoint)

If any inputs are missing, ask in short, direct questions and confirm before proceeding.

## Product Context Loading

Supported sources:
- **Local file**: read the file and parse YAML frontmatter fields.
- **Linear document**: fetch and extract the fields below.

Required fields (prompt the user if missing):
- `product_name`
- `value_proposition`
- `target_user`
- `core_loop`
- `success_metrics`
- `dev_server_url` (optional but helpful)

## Tooling Rules

- **Playwright MCP**: use if available (`mcp__playwright__*`).
- **No Playwright**: ask the user to walk the flow and provide notes/screenshots; proceed using their observations.
- **Linear MCP**: if available, create a project and issues; otherwise output a report-only result.
- **Code tracing**: use `rg`, `Read`, `Glob` to trace files when doing technical debugging.

## Mode: ux-eval (User Lifecycle Framework)

### Steps
1. Load product context and confirm understanding.
2. Select lifecycle phase or custom focus.
3. Navigate to the starting URL (Playwright if available).
4. Walk the user path for the selected phase.
5. Apply phase heuristics (see `references/phase-heuristics.md`).
6. Capture evidence (snapshots, console/network issues).
7. Document issues with severity and recommendations.
8. Generate report using `references/report-templates.md`.
9. Optionally create Linear project + issues.

### Output
- Save report: `ux-eval-report-YYYYMMDD-HHmm.md`
- Provide summary: overall score, top issues, report path, Linear URL if created.

## Mode: dogfood (Production Readiness)

Dogfood runs in phases. Do not merge phases.

### Phase 1: Dogfooding Evaluator (User Perspective)
- Become the target user.
- Walk the flow as a real user.
- Document confusion, friction, broken steps, missing value.
- **Do not read code** in this phase.
- Save report: `dogfood-report-{flow}-{timestamp}.md`

### Phase 2: Technical Debugger (Developer Perspective)
- Use the dogfooding report as input.
- Trace each finding to file-level causes.
- Provide concrete fixes.
- Save report: `technical-analysis-{flow}-{timestamp}.md`

### Phase 3: Infrastructure Auditor (Backend Reality)
- Verify persistence, auth, APIs, and integrations.
- Identify stubbed or missing infrastructure.
- Save report: `infrastructure-audit-{flow}-{timestamp}.md`

### Output
- Present a combined summary and the report paths.
- If Linear MCP is available, optionally create a project and issues per layer.

## Mode: mcp-eval (MCP App Evaluation)

### Steps
1. Load product context and derive persona.
2. Define the natural conversation arc for the intent.
3. Walk screens as that persona.
4. At each screen, evaluate the tool -> widget chain.
5. Detect MCP failure patterns (see `references/failure-patterns.md`).
6. Categorize improvements by layer (see `references/improvement-layers.md`).
7. If in actual tool calling mode, call the MCP endpoint and compare outputs.
8. Generate report (see `references/report-templates.md`).
9. Optional technical debugger handoff to trace improvements to code.

### Output
- Save report: `mcp-eval-report-{flow}-{timestamp}.md`
- Provide summary: failure patterns count, improvements by layer, top priorities.

## Reporting Standards

- Use clear severity ratings: Critical, High, Medium, Low.
- Always include reproduction steps and evidence.
- Use ASCII flow diagrams if helpful (templates in `references/report-templates.md`).
- Provide a short executive summary at the top of each report.

## Linear Integration (Optional)

If Linear MCP is available and the user wants it:
- Create a project named for the evaluation and flow.
- Create issues for each finding.
- Map severity to priority: Critical -> Urgent, High -> High, Medium -> Normal, Low -> Low.

## Files

- `references/phase-heuristics.md`
- `references/report-templates.md`
- `references/turn-evaluation-schema.md`
- `references/failure-patterns.md`
- `references/improvement-layers.md`
- `references/value-assessment.md`
- `examples/ux-evaluator.local.md.example`
