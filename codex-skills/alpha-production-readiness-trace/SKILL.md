---
name: alpha-production-readiness-trace
description: Production readiness evaluation for alpha that traces UI flows end-to-end (UI -> API -> backend -> persistence/integrations), defines what each flow should and should not do, finds stubbed or missing behavior, and produces a gap report and fix checklist. Use when asked to audit alpha readiness, trace UI to infrastructure, verify a feature is real, find backend gaps behind a flow, or evaluate production readiness for alpha users.
---

# Alpha Production Readiness Trace

## Quick start
- Gather product context and pick the alpha-critical flow(s).
- Build a Flow Contract for each flow (see references/flow-contract-template.md).
- Walk the flow in the UI, capture evidence, and build the Trace Matrix (see references/trace-matrix-template.md).
- Classify gaps using references/gap-taxonomy.md and score severity (references/severity-and-priority.md).
- Produce the Alpha Readiness Report (references/report-template.md).
- Create one Linear project per run with findings in the project description and gaps as issues (references/linear-conventions.md).

## Core principles
- Start from the user flow, not the code.
- Define what the feature should do and what it must not do before tracing.
- Prefer evidence over inference: network calls, storage writes, and API handlers.
- Alpha readiness means core value flows are real and safe; polish can wait.

## Workflow
1. Scope and inputs
   - Ask for product concept, target user, and list of alpha-critical flows.
   - Select 1-3 flows that must work for alpha to be usable.
   - Record starting URL and environment notes (auth, test accounts, integrations).

2. Define flow contracts (required)
   - For each flow, define:
     - Goal and success criteria.
     - Expected inputs, outputs, and side effects.
     - Persistence expectations (what must survive refresh).
     - Integrations involved.
     - "Should not do" constraints (from references/anti-goals.md).
   - Use references/flow-contract-template.md.

3. Walk the flow and capture evidence
   - Use Playwright tools if available; otherwise follow UI manually and capture logs.
   - For each user action:
     - Capture the UI result (snapshot/screenshot).
     - Capture network requests and status codes.
     - Capture console errors and storage changes.
   - Use references/evidence-capture.md.

4. Trace end-to-end
   - Map each action to:
     - Frontend handler -> API call -> backend handler -> storage/integration.
   - Note missing links or stubbed responses.
   - Fill the Trace Matrix (references/trace-matrix-template.md).

5. Classify and score gaps
   - Classify each gap by layer and type (references/gap-taxonomy.md).
   - Score severity with alpha rules (references/severity-and-priority.md).
   - Identify "should not do" violations as critical.

6. Decide alpha readiness
   - Apply readiness gates (references/alpha-readiness-gates.md).
   - Provide a verdict: Ready / Not Ready / Ready with Conditions.

7. Report and handoff
   - Produce the Alpha Readiness Report (references/report-template.md).
   - If Linear MCP is available, create one Linear project per run.
   - Put findings summary, readiness verdict, and top blockers in the project description.
   - Create one issue per gap or implementation recommendation with evidence and owner hints.
   - Use references/linear-conventions.md for the exact format.

8. If Linear MCP is not available
   - Record that no project could be created and include the issue list in the report.

## What to avoid
- Do not assume a backend exists without evidence.
- Do not accept UI success states if persistence is missing.
- Do not treat non-core flows as blockers unless they break core value.

## References
- references/alpha-readiness-gates.md
- references/flow-contract-template.md
- references/trace-matrix-template.md
- references/evidence-capture.md
- references/gap-taxonomy.md
- references/severity-and-priority.md
- references/anti-goals.md
- references/report-template.md
- references/linear-conventions.md
