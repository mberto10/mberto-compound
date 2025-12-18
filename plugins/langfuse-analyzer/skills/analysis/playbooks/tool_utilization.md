# Tool Utilization Analysis Playbook

Standard analysis to understand how tools are being used in workflows.

## Purpose

Answers these questions:
- Which tools are configured but never called?
- Which tools are called but returning empty/errors?
- Are required tools actually being used?
- What's the tool success rate?

## When to Use

- Routine optimization review
- After adding new tools to a case
- When research quality seems inconsistent
- Before removing "unused" tools (verify they're actually unused)

## Analysis Steps

### 1. Get Recent Traces

```bash
# Get last 5 traces for the case with flow mode (shows tool calls)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 5 --case <case_id> --mode io
```

### 2. Extract Tool Call Observations

From the trace output, identify all observations where:
- `type` is `SPAN` or `EVENT`
- `name` matches a tool name (e.g., "finnhub", "perplexity", "exa")

Create a tally:
```
Tool Calls Found:
- perplexity: 3 calls
- finnhub: 5 calls (2 errors)
- exa: 0 calls
```

### 3. Compare to Configuration

```bash
# Read the tools.yaml for the case
Read: writing_ecosystem/config/cases/<case_id>/tools.yaml
```

Extract:
- `required_tools` list
- `optional_tools` list
- Tools referenced in `research_patterns`

### 4. Generate Utilization Matrix

| Tool | Configured As | Times Called | Success Rate | Notes |
|------|---------------|--------------|--------------|-------|
| perplexity | required | 3 | 100% | Working as expected |
| finnhub | required | 5 | 60% | 2 failures - check API |
| exa | optional | 0 | N/A | Never called - consider removing or making conditions clearer |
| firecrawl | pattern-only | 1 | 100% | Called conditionally |

### 5. Identify Issues

**Underutilized Tools:**
- Tools in `optional_tools` with 0 calls across multiple traces
- May indicate: unclear conditions, tool not useful for this case

**High Failure Rate:**
- Tools with >20% error rate
- May indicate: API issues, wrong parameters, rate limiting

**Missing Required Tools:**
- Tools in `required_tools` not appearing in traces
- May indicate: bug in research pattern, tool registry issue

**Orphaned Configuration:**
- Tools in config but not in tool registry
- Will never be called - remove from config

### 6. Report Template

```markdown
# Tool Utilization Report

**Case:** <case_id>
**Traces Analyzed:** 5
**Time Range:** Last 7 days

## Summary

| Metric | Value |
|--------|-------|
| Configured Tools | 6 |
| Tools Actually Used | 4 |
| Utilization Rate | 67% |
| Overall Success Rate | 85% |

## Tool Breakdown

### ✅ Healthy Tools

| Tool | Calls | Success Rate |
|------|-------|--------------|
| perplexity | 15 | 100% |
| finnhub.quote | 10 | 100% |

### ⚠️ Tools Needing Attention

| Tool | Issue | Recommendation |
|------|-------|----------------|
| finnhub.earnings | 40% failure rate | Check API key, verify endpoint |
| exa | Never called | Remove from optional_tools or add to pattern |

### ❌ Unused Tools

| Tool | Configured As | Recommendation |
|------|---------------|----------------|
| firecrawl | optional | Remove if not needed for this case |

## Recommended Config Changes

### Remove Unused Optional Tool

**File:** `writing_ecosystem/config/cases/<case_id>/tools.yaml`

```diff
 tool_configuration:
   required_tools:
     - perplexity
     - finnhub
   optional_tools:
     - exa
-    - firecrawl
```

### Fix Failing Tool

**File:** `writing_ecosystem/config/cases/<case_id>/tools.yaml`

```diff
 research_patterns:
   patterns:
     default:
       steps:
         - tool: finnhub
           input:
             endpoint: calendar_earnings
-            symbol: "{{ticker}}"
+            symbol: "{{ticker | upper}}"
+          on_error: continue
           save_as: earnings
```
```

## Cross-Reference: Tool Registry

To verify a tool exists in the registry:

```bash
# Check tool registry
Grep: "register_tool" in writing_ecosystem/tools/
Glob: writing_ecosystem/tools/atomic/**/*.py
```

Common tool locations:
- `tools/atomic/finance/` - Finnhub, financial data
- `tools/atomic/search/` - Perplexity, Exa, You.com
- `tools/atomic/web/` - Firecrawl

## Automation Potential

This analysis could be partially automated with a script that:
1. Fetches N traces for a case
2. Counts tool call observations
3. Reads tools.yaml
4. Generates utilization matrix

For now, follow the manual steps above. Script automation is a future enhancement.
