---
name: langfuse-trace-analysis
description: This skill should be used when the user says "analyze trace", "debug workflow", "why did this fail", "investigate issue", "trace shows wrong output", "output quality is bad", "missing data in output", "wrong tool used", or describes any problem with a workflow run. Combines Langfuse trace data with codebase investigation to find root causes and suggest fixes.
---

# Langfuse Trace Analysis

Agent-driven diagnostic analysis that bridges trace observations with codebase investigation. Produces structured reports with actionable diff suggestions.

## Analysis Workflow

### Step 1: Retrieve the Trace

Use the data-retrieval skill to get trace data:

```bash
# Get trace with inputs/outputs (recommended for most analyses)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <id> --mode io

# For performance issues, use flow mode
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <id> --mode flow

# For prompt quality issues, use prompts mode
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --trace-id <id> --mode prompts
```

### Step 2: Classify the Symptom

Map the user's free-text description to an investigation strategy:

| Symptom Pattern | Category | Primary Investigation |
|-----------------|----------|----------------------|
| "missing data", "incomplete", "didn't include X" | `research_gap` | tools.yaml, research node outputs |
| "wrong tone", "doesn't sound right", "style is off" | `style_mismatch` | guard.yaml foundation/markers |
| "wrong tool", "used X instead of Y" | `tool_selection` | tools.yaml required/optional, research node |
| "failed", "error", "timeout", "crashed" | `execution_error` | Error observations, code implementations |
| "slow", "took too long", "performance" | `latency` | Flow timing, tool response times |
| "quality is bad", "not what I expected" | `quality_general` | Full investigation across config + trace |
| "cost too high", "expensive" | `cost` | Token usage, model selection |

### Step 3: Investigation Strategies

#### For `research_gap` (Missing Data)

**Trace Investigation:**
1. Find research/tool call observations
2. Check: Was the expected tool called?
3. Check: Did the tool return data or empty/error?
4. Check: Was data passed to writer node input?

**Config Investigation:**
```bash
# Check tools.yaml for the case
Read: writing_ecosystem/config/cases/<case_id>/tools.yaml

# Look for:
# - Is the tool in required_tools or optional_tools?
# - Is there a research pattern that uses this tool?
# - Are the input parameters correct (endpoint, date range)?
```

**Common Root Causes:**
- Tool not in required_tools list
- Wrong endpoint configured
- Date range excludes relevant data
- API returned empty (upstream issue)
- Data present but writer prompt doesn't use it
- Injected Prompts from Config Files are not optimal

#### For `style_mismatch` (Wrong Tone/Voice)

**Trace Investigation:**
1. Find editor node observations
2. Check: What style scores were given?
3. Check: Were style checks passing but output still wrong?
4. Find writer node output to see what was generated

**Config Investigation:**
```bash
# Check guard.yaml foundation section
Read: writing_ecosystem/config/cases/<case_id>/guard.yaml

# Look for:
# - foundation.voice_and_tone settings
# - foundation.editorial_stance
# - markers with category: "style"
# - Are style markers too lenient (low thresholds)?
```

**Common Root Causes:**
- Foundation voice/tone not specific enough
- Style markers not checking the right aspects
- Writer prompt overriding style guidance
- Missing exemplars for style matching

#### For `tool_selection` (Wrong Tool Used)

**Trace Investigation:**
1. Find research node reasoning/decisions
2. Check: What tools were available?
3. Check: What was the selection rationale?
4. Check: Did required tools get called?

**Config Investigation:**
```bash
# Check tools.yaml
Read: writing_ecosystem/config/cases/<case_id>/tools.yaml

# Look for:
# - required_tools list (must be called)
# - optional_tools list (may be called)
# - research_patterns steps and conditions
```

**Common Root Causes:**
- Tool in optional_tools but should be required
- Research pattern conditions excluding the tool
- Tool name mismatch between config and registry

#### For `execution_error` (Failures/Crashes)

**Trace Investigation:**
1. Find observations with level: ERROR
2. Check status_message fields
3. Find the last successful observation before failure

**Code Investigation:**
```bash
# Check node implementations
Grep: "raise" or "except" in writing_ecosystem/workflows/nodes/
Grep: error handling in writing_ecosystem/tools/atomic/
```

**Common Root Causes:**
- API key missing or invalid
- Rate limiting
- Malformed input to tool
- Network timeout
- Unhandled edge case in node logic

#### For `quality_general` (Vague Quality Issues)

Start broad, then narrow:

1. Get full trace with `--mode io`
2. Check each node's output against expectations
3. Compare final output with guard.yaml requirements
4. Look for gaps between what was researched and what was written

### Step 4: Generate Report

Use the report generator or format manually:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/analysis/helpers/report_generator.py \
  --symptom "user's original description" \
  --category <classified_category> \
  --root-cause "identified root cause" \
  --evidence-file /tmp/evidence.md \
  --config-file <path_to_relevant_config>
```

Or format the report manually following this template:

```markdown
# Trace Analysis Report

## Symptom
> [User's original description]

**Trace ID:** `<id>`
**Case ID:** `<case_id>`
**Category:** `<classified_category>`

---

## Root Cause

[Clear explanation of what went wrong and why]

---

## Evidence

### From Trace

[Relevant excerpts from trace observations]

### From Configuration

[Relevant config snippets that contributed to the issue]

---

## Recommended Fixes

### Fix 1: [Title]

**File:** `writing_ecosystem/config/cases/<case_id>/tools.yaml`

```diff
 research_patterns:
   default: standard_research
   patterns:
     standard_research:
       steps:
+        - tool: finnhub
+          input:
+            endpoint: calendar_earnings
+            symbol: "{{ticker}}"
+          save_as: earnings_data
         - tool: perplexity
           input:
             query: "{{topic}}"
```

**Rationale:** [Why this fix addresses the root cause]

### Fix 2: [Title]

[Additional fixes if needed]

---

## Verification

After applying fixes, verify by:
1. Re-run workflow: `python run_workflow.py --case <case_id> --topic "..."`
2. Check new trace for expected tool calls
3. Verify output includes previously missing data
```

---

## Standard Playbooks

For routine analyses, use pre-defined playbooks:

### Tool Utilization Analysis

```bash
# See: ${CLAUDE_PLUGIN_ROOT}/skills/analysis/playbooks/tool_utilization.md
```

Analyzes which tools are configured vs actually used, identifies underutilized tools and potential gaps.

---

## Config File Reference

Quick reference for what each config controls:

| File | Controls | Key Sections |
|------|----------|--------------|
| `guard.yaml` | Content contract | `foundation` (voice, stance), `instructions` (requirements), `markers` (validation) |
| `tools.yaml` | Research behavior | `required_tools`, `optional_tools`, `research_patterns` |
| `push.yaml` | Delivery | `provider`, `field_mapping`, `transforms` |
| `media.yaml` | Assets | `assets` list (images, charts, audio) |

**Config location:** `writing_ecosystem/config/cases/<case_id>/`

---

## Code Reference

Where to look for implementation issues:

| Component | Location | When to Check |
|-----------|----------|---------------|
| Research logic | `workflows/nodes/research_node.py` | Tool selection issues |
| Writer logic | `workflows/nodes/write_node.py` | Content generation issues |
| Editor logic | `workflows/nodes/editor_node.py` | Validation issues |
| Tool wrappers | `tools/atomic/<provider>/` | API/integration errors |
| State definition | `workflows/state.py` | Data flow issues |

---

## Tips for Effective Analysis

1. **Start with the trace** - Always retrieve trace data first before looking at config/code
2. **Follow the data flow** - Research → Writer input → Writer output → Editor
3. **Check both presence and content** - A tool being called doesn't mean it returned useful data
4. **Compare config to trace** - What's configured vs what actually happened
5. **Look for the gap** - Where did the expected flow diverge from actual?
