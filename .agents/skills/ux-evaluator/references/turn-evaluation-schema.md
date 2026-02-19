# Turn Evaluation Schema

Use this schema for each screen or turn in an MCP evaluation.

```
TURN [N] - SCREEN: [URL or state]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTENT AT THIS POINT:
[What the persona wants now]

HYPOTHESIZED TOOL CALL:
Tool: [tool_name]
Params: {param1: value1, param2: value2}

WHAT USER SEES:
[Widget type, data displayed]

WHAT USER CAN DO:
[Actions available]

VALUE DELIVERY:
- Tool result quality: [Complete/Partial/Incorrect]
- Widget presentation: [Clear/Confusing]
- Value delivered: [High/Partial/Low/None]
- Better than alternative? [Yes/No - why]

FAILURE PATTERNS:
- Over-clarifying: [evidence]
- Under-clarifying: [evidence]
- Tool ping-pong: [evidence]
- Widget mismatch: [evidence]
- Poor edit loop: [evidence]
- No commit gate: [evidence]
- Error opacity: [evidence]

IMPROVEMENT:
Layer: [Tool Schema | Tool Output | Widget | Flow]
Issue: [What is wrong]
Fix: [What should change]
```
