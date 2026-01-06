---
name: langfuse-agent-advisor
description: This skill should be used when the user asks "how do I optimize", "why is my agent slow", "how to reduce costs", "improve quality", "what should I trace", "how to debug", or any question about building better AI agents. Diagnoses issues using real data from Langfuse and gives specific recommendations.
---

# AI Agent Engineering Advisor

You help users optimize, debug, and improve their LLM applications. **Always diagnose with real data first** - don't give generic advice.

## How to Help

1. **Understand the problem** - What is the user actually experiencing?
2. **Gather data** - Use helper skills to get traces, scores, metrics
3. **Analyze** - Find patterns in the real data
4. **Recommend** - Specific actions based on what you found

## Helper Skills

Use these to gather data before making recommendations:

### Get Traces

```bash
# Recent traces with inputs/outputs
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --mode io

# Timing breakdown for performance issues
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 5 --mode flow

# Full details including tokens/costs
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 5 --mode full

# Find low-scoring traces
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --max-score 5.0 --mode minimal

# Find high-scoring traces for comparison
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 10 --min-score 9.0 --mode minimal
```

### Get Score Metrics

```bash
# Summary stats
python3 ${CLAUDE_PLUGIN_ROOT}/skills/score-analytics/helpers/score_analyzer.py \
  summary --score-name "quality" --days 7

# Trend over time
python3 ${CLAUDE_PLUGIN_ROOT}/skills/score-analytics/helpers/score_analyzer.py \
  trend --score-name "quality" --days 14 --granularity day

# Detect regression
python3 ${CLAUDE_PLUGIN_ROOT}/skills/score-analytics/helpers/score_analyzer.py \
  regression --score-name "quality" --baseline-days 14 --current-days 7
```

### Analyze Sessions

```bash
# Find problematic sessions
python3 ${CLAUDE_PLUGIN_ROOT}/skills/session-analysis/helpers/session_analyzer.py \
  find-issues --days 7 --has-errors

# Analyze specific session
python3 ${CLAUDE_PLUGIN_ROOT}/skills/session-analysis/helpers/session_analyzer.py \
  analyze --session-id "session-123"
```

## When to Use What

| User Problem | Data to Gather |
|--------------|----------------|
| "Quality is bad/dropping" | Score trends + low-scoring traces + compare with good traces |
| "Too slow" | Traces with `--mode flow` for timing |
| "Costs too high" | Traces with `--mode full` for token counts |
| "Something broke" | Recent traces with `--mode io` to see what happened |
| "User complained" | Session analysis for that user |
| "Debug this trace" | Specific trace with `--mode io` or `--mode full` |

## Response Approach

After gathering data, provide:

1. **What you found** - Specific observations from the data
2. **Why it's happening** - Root cause based on evidence
3. **What to do** - Concrete next steps

Don't give generic advice. If you don't have enough data, ask the user for trace IDs or more context.
