# Report Templates

Use these templates for consistent output. Adjust sections as needed but keep structure stable.

## UX Evaluation Report

```markdown
# UX Evaluation Report: [Phase or Focus]

**Product:** [Product name]
**Scope:** [Lifecycle phase or custom focus]
**Starting URL:** [URL]
**Date:** [Timestamp]

---

## Executive Summary
[2-3 sentences: overall score, top issues, quick verdict]

## Overall Score
- Clarity: [0-100]
- Efficiency: [0-100]
- Feedback: [0-100]
- Recovery: [0-100]
- Accessibility: [0-100]
- Overall: [0-100]

## User Path (ASCII)
```
[Entry] -> [Step 1] -> [Step 2] -> [Outcome]
             ^ Issue #2
```

## Findings

### Issue #1: [Title]
- Phase: [Lifecycle phase]
- Severity: [Critical/High/Medium/Low]
- Location: [URL or element]
- Observation: [What happened]
- Expected: [What should happen]
- Recommendation: [Specific fix]
- Heuristics violated: [List]

[Repeat for all issues]

## Recommendations
1. [Highest priority fix]
2. [Second priority]
3. [Third priority]

## Appendix
- Screenshots: [list]
- Console errors: [list]
- Network errors: [list]
```

## Dogfooding Report (User Perspective)

```markdown
# Dogfooding Report: [Flow Name]

**Product:** [Product name]
**Flow Evaluated:** [Flow]
**Starting URL:** [URL]
**Date:** [Timestamp]
**User Persona:** [Persona]

---

## Executive Summary
[2-3 sentences: overall experience, key blockers]

## Vision Alignment
| Promise | Delivered | Evidence |
|--------|-----------|----------|
| [Promise 1] | [Yes/Partial/No] | [Evidence] |

Overall Alignment: [X]%

## Journey Narrative
### Step 1
[Story from user perspective]

### Step 2
[Story]

## Findings

### Finding #1: [Title]
- Type: [Confusion/Friction/Broken/Missing/Unexpected]
- Severity: [Critical/High/Medium/Low]
- Location: [URL or screen]
- As a user: [First-person description]
- I expected: [Expectation]
- Impact on my goal: [Impact]

[Repeat]

## Value Assessment
| Question | Answer |
|----------|--------|
| Did I understand the product? | [Yes/Partial/No] |
| Could I complete core workflow? | [Yes/Partial/No] |
| Did I experience "aha" moment? | [Yes/Partial/No] |
| Does it deliver value proposition? | [Yes/Partial/No] |
| Would I use this again? | [Yes/Partial/No] |
| Would I recommend it? | [Yes/Partial/No] |

## Production Readiness
[Score]% - [One sentence assessment]
```

## Technical Analysis Report

```markdown
# Technical Analysis: [Flow Name]

**Based on:** [Dogfooding report]
**Analyzed:** [Timestamp]

---

## Summary
[2-3 sentences: main technical issues]

## Findings

### Finding #1: [Title]
**User Symptom:** [From dogfooding]
**Root Cause:** [Technical cause]
**Code Locations:**
- `path/to/file.ts:line` - [Issue]
**Evidence:** [Console/network/code]
**Recommended Fix:** [Specific changes]
**Fix Complexity:** [Low/Medium/High]
**Category:** [Bug/Integration/Implementation/UX]

[Repeat]

## Recommended Fix Order
1. [First]
2. [Second]
3. [Third]
```

## Infrastructure Audit Report

```markdown
# Infrastructure Audit: [Flow Name]

**Product:** [Product name]
**Flow Evaluated:** [Flow]
**Date:** [Timestamp]

---

## Executive Summary
[Is this flow backed by real infrastructure or mostly UI?]

## Infrastructure Score: [0-100]

| Layer | Status | Evidence |
|-------|--------|----------|
| Database | [Connected/Partial/Missing] | [Evidence] |
| Auth Persistence | [Connected/Partial/Missing] | [Evidence] |
| API Endpoints | [Real/Stubbed/Missing] | [Evidence] |
| External Services | [Connected/Partial/Missing] | [Evidence] |

## Detailed Findings

### [Finding Title]
- Layer: [Database/Auth/API/Integration]
- Severity: [Critical/High/Medium/Low]
- Status: [Not Implemented/Partially Implemented/Stubbed]
- What the UI shows: [Description]
- What actually happens: [Reality]
- Evidence: [File paths, logs]
- To make this real: [Steps]

## Implementation Checklist
- [ ] [Database table/collection]
- [ ] [Endpoint/handler]
- [ ] [Env var/integration]
```

## MCP Evaluation Report

```markdown
# MCP Evaluation Report: [Flow/Intent]

**Product:** [Product name]
**Intent Evaluated:** [Intent]
**Persona:** [Derived persona]
**Mode:** [Hypothetical | Actual Tool Calling]
**Date:** [Timestamp]

---

## Executive Summary
[Does the tool -> widget chain deliver value?]

## Persona and Intent
- Persona: [Who they are]
- Natural first ask: "[User phrasing]"
- Success criteria: [What outcome matters]

## Turn-by-Turn Evaluation
[Use turn schema from references/turn-evaluation-schema.md]

## Failure Patterns Found
- Over-clarifying: [count + examples]
- Under-clarifying: [count + examples]
- Tool ping-pong: [count + examples]
- Widget mismatch: [count + examples]
- Poor edit loop: [count + examples]
- No commit gate: [count + examples]
- Error opacity: [count + examples]

## Improvements by Layer
- Tool Schema: [list]
- Tool Output: [list]
- Widget: [list]
- Flow: [list]

## Priority Ranking
1. [Most critical]
2. [Second]
3. [Third]
```
