---
name: langfuse-schema-validator
description: This skill should be used when the user asks to "validate prompt schema", "check output contract", "compare schema", or needs to verify that a Langfuse prompt's output_contract matches its function schema definition.
version: 1.0.0
---

# Langfuse Schema Validator

Validates that Langfuse prompt output contracts match their corresponding function/tool schema definitions. Catches schema drift before it causes runtime failures.

## Problem This Solves

A common class of bug occurs when:
1. A prompt's `<output_contract>` section describes one schema
2. The actual function schema (`config.function_schema`) defines a different structure
3. The LLM follows the output_contract, producing invalid data
4. The schema mismatch causes silent failures that propagate through the pipeline

Example from production debugging session:
- Evaluation prompt's output_contract described strings
- Function schema expected structured objects
- Result: model returned strings, refinement node received wrong types, fell back to raw LLM response

## When to Use

- Before deploying prompt changes to production
- When debugging unexpected output types from LLM calls
- As part of prompt review workflows
- When adding new prompts that include output contracts

## Usage

### Validate a Single Prompt

```bash
python schema_validator.py validate \
  --prompt-name "news-evaluator" \
  --schema-file "config/function_schemas.json" \
  --schema-key "evaluate_summary"
```

### Validate All Prompts in a Directory

```bash
python schema_validator.py validate-all \
  --prompts-dir "prompts/" \
  --schemas-file "config/function_schemas.json"
```

### Extract Output Contract from Prompt

```bash
python schema_validator.py extract \
  --prompt-name "news-evaluator"
```

## What Gets Validated

The validator checks for:

1. **Field presence**: All fields in output_contract exist in function schema
2. **Type compatibility**: Declared types match (string vs object vs array)
3. **Required fields**: Required fields in schema are documented in contract
4. **Nested structures**: Recursive validation of nested objects

## Output Format

```json
{
  "status": "valid" | "invalid" | "warning",
  "prompt_name": "...",
  "issues": [
    {
      "severity": "error" | "warning",
      "field": "field_name",
      "message": "Description of mismatch",
      "contract_value": "...",
      "schema_value": "..."
    }
  ],
  "summary": "3 errors, 1 warning"
}
```

## Integration with CI/CD

Add to your pre-commit or CI pipeline:

```bash
python schema_validator.py validate-all --strict
# Exit code 0 = all valid
# Exit code 1 = validation errors found
```

## Related Learning

> "Prompt <output_contract> sections MUST exactly match the function schema definition - mismatches cause silent schema violations that propagate through the pipeline."
>
> Source: 2026-01-12 debugging session
