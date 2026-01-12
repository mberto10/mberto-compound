#!/usr/bin/env python3
"""
Schema Validator for Langfuse Prompts

Validates that prompt output_contract sections match their function schema definitions.
Catches schema drift before it causes runtime failures.

USAGE:
    # Validate a single prompt against a schema
    python schema_validator.py validate --prompt-name "eval-prompt" --schema-file schemas.json --schema-key "evaluate"

    # Extract output_contract from a prompt
    python schema_validator.py extract --prompt-name "eval-prompt"

    # Validate prompt text directly (without Langfuse)
    python schema_validator.py validate-text --prompt-file prompt.txt --schema-file schemas.json --schema-key "key"

    # Compare two schemas
    python schema_validator.py compare --schema-a '{"type":"object"}' --schema-b '{"type":"string"}'
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Import shared Langfuse client
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "data-retrieval" / "helpers"))


# =============================================================================
# OUTPUT CONTRACT EXTRACTION
# =============================================================================

def extract_output_contract(prompt_text: str) -> Optional[Dict[str, Any]]:
    """
    Extract output_contract section from prompt text.

    Looks for patterns like:
    - <output_contract>...</output_contract>
    - <output_schema>...</output_schema>
    - ```json ... ``` blocks after "output" headers

    Returns parsed JSON if found, None otherwise.
    """
    # Pattern 1: XML-style tags
    patterns = [
        r'<output_contract>\s*([\s\S]*?)\s*</output_contract>',
        r'<output_schema>\s*([\s\S]*?)\s*</output_schema>',
        r'<response_format>\s*([\s\S]*?)\s*</response_format>',
    ]

    for pattern in patterns:
        match = re.search(pattern, prompt_text, re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            # Try to parse as JSON
            try:
                # Handle markdown code blocks
                if content.startswith('```'):
                    content = re.sub(r'^```\w*\n?', '', content)
                    content = re.sub(r'\n?```$', '', content)
                return json.loads(content)
            except json.JSONDecodeError:
                # Return as raw text description
                return {"_raw_text": content, "_parsed": False}

    # Pattern 2: Look for JSON blocks after output-related headers
    output_section = re.search(
        r'(?:output|response|return)\s*(?:format|schema|contract)?:?\s*```json\s*([\s\S]*?)\s*```',
        prompt_text,
        re.IGNORECASE
    )
    if output_section:
        try:
            return json.loads(output_section.group(1))
        except json.JSONDecodeError:
            pass

    return None


def extract_described_fields(contract: Dict[str, Any]) -> Dict[str, str]:
    """
    Extract field names and their described types from an output contract.

    Handles both JSON Schema format and informal descriptions.
    """
    fields = {}

    # JSON Schema format
    if "properties" in contract:
        for name, prop in contract["properties"].items():
            fields[name] = prop.get("type", "unknown")
    elif "type" in contract:
        fields["_root"] = contract["type"]

    # Raw text format - parse field descriptions
    if "_raw_text" in contract:
        # Look for patterns like "field_name: type" or "- field_name (type)"
        text = contract["_raw_text"]
        for match in re.finditer(r'[`"\']?(\w+)[`"\']?\s*[:\-]\s*(\w+)', text):
            fields[match.group(1)] = match.group(2).lower()

    return fields


# =============================================================================
# SCHEMA COMPARISON
# =============================================================================

def compare_schemas(
    contract: Dict[str, Any],
    schema: Dict[str, Any],
    path: str = ""
) -> List[Dict[str, Any]]:
    """
    Compare an output contract against a function schema.

    Returns list of issues found.
    """
    issues = []

    # Handle unparsed contracts
    if contract.get("_parsed") is False:
        issues.append({
            "severity": "warning",
            "field": path or "_root",
            "message": "Output contract is not valid JSON, cannot fully validate",
            "contract_value": contract.get("_raw_text", "")[:200],
            "schema_value": None
        })
        return issues

    # Get contract type
    contract_type = contract.get("type")
    schema_type = schema.get("type")

    # Type mismatch at current level
    if contract_type and schema_type and contract_type != schema_type:
        issues.append({
            "severity": "error",
            "field": path or "_root",
            "message": f"Type mismatch: contract says '{contract_type}', schema says '{schema_type}'",
            "contract_value": contract_type,
            "schema_value": schema_type
        })

    # Compare properties for objects
    contract_props = contract.get("properties", {})
    schema_props = schema.get("properties", {})

    # Fields in contract but not in schema
    for field in contract_props:
        if field not in schema_props:
            issues.append({
                "severity": "warning",
                "field": f"{path}.{field}" if path else field,
                "message": f"Field '{field}' in contract but not in schema",
                "contract_value": contract_props[field],
                "schema_value": None
            })

    # Required fields in schema missing from contract
    schema_required = set(schema.get("required", []))
    contract_required = set(contract.get("required", []))

    for field in schema_required:
        if field not in contract_props:
            issues.append({
                "severity": "error",
                "field": f"{path}.{field}" if path else field,
                "message": f"Required field '{field}' in schema but not documented in contract",
                "contract_value": None,
                "schema_value": schema_props.get(field)
            })

    # Recursively compare nested properties
    for field in contract_props:
        if field in schema_props:
            nested_issues = compare_schemas(
                contract_props[field],
                schema_props[field],
                f"{path}.{field}" if path else field
            )
            issues.extend(nested_issues)

    # Compare array items
    if contract_type == "array" and schema_type == "array":
        contract_items = contract.get("items", {})
        schema_items = schema.get("items", {})
        if contract_items and schema_items:
            nested_issues = compare_schemas(
                contract_items,
                schema_items,
                f"{path}[]" if path else "[]"
            )
            issues.extend(nested_issues)

    return issues


# =============================================================================
# LANGFUSE INTEGRATION
# =============================================================================

def fetch_prompt_from_langfuse(prompt_name: str, version: Optional[int] = None) -> Optional[str]:
    """Fetch prompt text from Langfuse."""
    try:
        from langfuse_client import get_langfuse_client
        client = get_langfuse_client()

        if version:
            prompt = client.get_prompt(prompt_name, version=version)
        else:
            prompt = client.get_prompt(prompt_name)

        if hasattr(prompt, 'prompt'):
            return prompt.prompt
        elif hasattr(prompt, 'get_langchain_prompt'):
            # For chat prompts, combine messages
            return str(prompt.get_langchain_prompt())
        return None
    except Exception as e:
        print(f"Error fetching prompt: {e}", file=sys.stderr)
        return None


# =============================================================================
# MAIN COMMANDS
# =============================================================================

def cmd_validate(args) -> Dict[str, Any]:
    """Validate a Langfuse prompt against a schema."""
    # Fetch prompt
    prompt_text = fetch_prompt_from_langfuse(args.prompt_name, args.version)
    if not prompt_text:
        return {"status": "error", "message": f"Could not fetch prompt: {args.prompt_name}"}

    # Extract contract
    contract = extract_output_contract(prompt_text)
    if not contract:
        return {
            "status": "warning",
            "prompt_name": args.prompt_name,
            "message": "No output_contract found in prompt",
            "issues": []
        }

    # Load schema
    try:
        with open(args.schema_file) as f:
            schemas = json.load(f)
        schema = schemas.get(args.schema_key, schemas)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return {"status": "error", "message": f"Could not load schema: {e}"}

    # Compare
    issues = compare_schemas(contract, schema)

    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]

    return {
        "status": "invalid" if errors else ("warning" if warnings else "valid"),
        "prompt_name": args.prompt_name,
        "issues": issues,
        "summary": f"{len(errors)} errors, {len(warnings)} warnings"
    }


def cmd_validate_text(args) -> Dict[str, Any]:
    """Validate prompt text from a file against a schema."""
    try:
        with open(args.prompt_file) as f:
            prompt_text = f.read()
    except FileNotFoundError:
        return {"status": "error", "message": f"Prompt file not found: {args.prompt_file}"}

    contract = extract_output_contract(prompt_text)
    if not contract:
        return {
            "status": "warning",
            "prompt_file": args.prompt_file,
            "message": "No output_contract found in prompt",
            "issues": []
        }

    try:
        with open(args.schema_file) as f:
            schemas = json.load(f)
        schema = schemas.get(args.schema_key) if args.schema_key else schemas
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return {"status": "error", "message": f"Could not load schema: {e}"}

    issues = compare_schemas(contract, schema)
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]

    return {
        "status": "invalid" if errors else ("warning" if warnings else "valid"),
        "prompt_file": args.prompt_file,
        "issues": issues,
        "summary": f"{len(errors)} errors, {len(warnings)} warnings"
    }


def cmd_extract(args) -> Dict[str, Any]:
    """Extract output_contract from a prompt."""
    prompt_text = fetch_prompt_from_langfuse(args.prompt_name, args.version)
    if not prompt_text:
        return {"status": "error", "message": f"Could not fetch prompt: {args.prompt_name}"}

    contract = extract_output_contract(prompt_text)
    if not contract:
        return {
            "status": "not_found",
            "prompt_name": args.prompt_name,
            "message": "No output_contract found in prompt"
        }

    return {
        "status": "found",
        "prompt_name": args.prompt_name,
        "output_contract": contract,
        "fields": extract_described_fields(contract)
    }


def cmd_compare(args) -> Dict[str, Any]:
    """Compare two schemas directly."""
    try:
        schema_a = json.loads(args.schema_a)
        schema_b = json.loads(args.schema_b)
    except json.JSONDecodeError as e:
        return {"status": "error", "message": f"Invalid JSON: {e}"}

    issues = compare_schemas(schema_a, schema_b)
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]

    return {
        "status": "different" if errors else ("similar" if warnings else "identical"),
        "issues": issues,
        "summary": f"{len(errors)} differences, {len(warnings)} minor variations"
    }


def main():
    parser = argparse.ArgumentParser(
        description="Validate Langfuse prompt output contracts against function schemas",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # validate command
    validate_parser = subparsers.add_parser(
        "validate",
        help="Validate a Langfuse prompt against a schema file"
    )
    validate_parser.add_argument("--prompt-name", required=True, help="Langfuse prompt name")
    validate_parser.add_argument("--version", type=int, help="Specific prompt version")
    validate_parser.add_argument("--schema-file", required=True, help="Path to schema JSON file")
    validate_parser.add_argument("--schema-key", help="Key within schema file (if nested)")

    # validate-text command
    validate_text_parser = subparsers.add_parser(
        "validate-text",
        help="Validate prompt text from a file"
    )
    validate_text_parser.add_argument("--prompt-file", required=True, help="Path to prompt file")
    validate_text_parser.add_argument("--schema-file", required=True, help="Path to schema JSON file")
    validate_text_parser.add_argument("--schema-key", help="Key within schema file")

    # extract command
    extract_parser = subparsers.add_parser(
        "extract",
        help="Extract output_contract from a prompt"
    )
    extract_parser.add_argument("--prompt-name", required=True, help="Langfuse prompt name")
    extract_parser.add_argument("--version", type=int, help="Specific prompt version")

    # compare command
    compare_parser = subparsers.add_parser(
        "compare",
        help="Compare two schemas directly"
    )
    compare_parser.add_argument("--schema-a", required=True, help="First schema (JSON string)")
    compare_parser.add_argument("--schema-b", required=True, help="Second schema (JSON string)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "validate":
        result = cmd_validate(args)
    elif args.command == "validate-text":
        result = cmd_validate_text(args)
    elif args.command == "extract":
        result = cmd_extract(args)
    elif args.command == "compare":
        result = cmd_compare(args)
    else:
        parser.print_help()
        sys.exit(1)

    print(json.dumps(result, indent=2))

    # Exit with error code if validation failed
    if result.get("status") == "invalid":
        sys.exit(1)
    elif result.get("status") == "error":
        sys.exit(2)


if __name__ == "__main__":
    main()
