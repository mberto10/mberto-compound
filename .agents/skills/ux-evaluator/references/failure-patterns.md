# MCP Failure Patterns

Use these patterns during MCP evaluations.

## Over-clarifying
- UI asks for information that can be inferred or retrieved.
- Signal: extra questions that do not change the tool call.

## Under-clarifying
- UI commits to actions without necessary constraints.
- Signal: actions executed with missing parameters or poor defaults.

## Tool Ping-Pong
- Multiple sequential tool calls that should be batched.
- Signal: redundant intermediate screens or partial results.

## Widget Mismatch
- Display type is wrong for the intent.
- Signal: table shown when a summary or decision view is needed.

## Poor Edit Loop
- User cannot refine results without restarting.
- Signal: missing filters, no editable inputs, hard reset.

## No Commit Gate
- Irreversible action lacks confirmation.
- Signal: immediate destructive changes without review.

## Error Opacity
- Raw technical errors are shown to users.
- Signal: stack traces, JSON blobs, or unclear error messages.
