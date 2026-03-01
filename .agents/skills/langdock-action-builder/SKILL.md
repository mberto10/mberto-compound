---
name: langdock-action-builder
description: Use when the user asks to build, create, or generate a Langdock action or integration script for an API, including requests that provide API docs URLs and requests requiring Langdock-ready JavaScript action code with metadata comments and robust error handling.
---

# Langdock Action Builder

Generate production-ready Langdock action scripts from API docs or API descriptions.

## Required Workflow

1. Gather API facts from official docs or the user prompt.
2. Determine authentication shape and input parameters.
3. Generate one complete Langdock JavaScript action.
4. Include top metadata comments (`name`, `description`, parameter docs).
5. Include request execution and robust error handling.
6. Return:
   - one copy-pasteable code block
   - a short assumptions list

## Output Rules

- Access inputs through `data.input.*`.
- Access auth via the correct `data.auth.*` key for the API.
- URL-encode user-provided path/query fragments when required.
- Return structured JSON objects, not raw unfiltered payloads.
- Include HTTP status checks and `try/catch`.

## Runtime Safety Default

Load and follow:

- `/Users/max/mberto-compound/codex-skills/langdock-action-builder/references/runtime-caveats.md`

Default to sequential `await ld.request(...)` calls. Use parallel patterns only when explicitly requested and caveats are acknowledged.

## Reference

Use conventions from:

- `/Users/max/mberto-compound/codex-skills/langdock-action-builder/references/action-conventions.md`
