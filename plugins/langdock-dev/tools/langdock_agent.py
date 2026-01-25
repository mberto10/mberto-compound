#!/usr/bin/env python3
"""
Langdock Agent API CLI Tool

Usage:
    python langdock_agent.py create --name "My Agent" --instruction "You are helpful."
    python langdock_agent.py get --id <agent-uuid>
    python langdock_agent.py update --id <agent-uuid> --name "New Name"
    python langdock_agent.py chat --id <agent-uuid> --message "Hello!"
    python langdock_agent.py models
    python langdock_agent.py upload --file document.pdf

Environment:
    LANGDOCK_API_KEY: Required API key with AGENT_API scope
"""

import argparse
import json
import os
import sys
from pathlib import Path

import requests

BASE_URL = "https://api.langdock.com"


def get_api_key() -> str:
    """Get API key from environment."""
    key = os.environ.get("LANGDOCK_API_KEY")
    if not key:
        print("Error: LANGDOCK_API_KEY environment variable is required", file=sys.stderr)
        sys.exit(1)
    return key


def api_request(
    endpoint: str,
    method: str = "GET",
    json_data: dict = None,
    files: dict = None,
) -> dict:
    """Make an API request to Langdock."""
    api_key = get_api_key()
    url = f"{BASE_URL}{endpoint}"

    headers = {"Authorization": f"Bearer {api_key}"}
    if json_data and not files:
        headers["Content-Type"] = "application/json"

    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json_data if not files else None,
            files=files,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_create(args):
    """Create a new persistent agent."""
    data = {"name": args.name}

    if args.instruction:
        data["instruction"] = args.instruction
    if args.description:
        data["description"] = args.description
    if args.emoji:
        data["emoji"] = args.emoji
    if args.model:
        data["model"] = args.model
    if args.creativity is not None:
        data["creativity"] = args.creativity
    if args.web_search:
        data["webSearch"] = True
    if args.image_generation:
        data["imageGeneration"] = True
    if args.data_analyst:
        data["dataAnalyst"] = True
    if args.canvas:
        data["canvas"] = True
    if args.conversation_starters:
        data["conversationStarters"] = args.conversation_starters

    result = api_request("/assistant/v1/create", "POST", data)
    print(json.dumps(result, indent=2))


def cmd_get(args):
    """Get agent details by ID."""
    result = api_request(f"/assistant/v1/get?assistantId={args.id}")
    print(json.dumps(result, indent=2))


def cmd_update(args):
    """Update an existing agent."""
    data = {"assistantId": args.id}

    if args.name:
        data["name"] = args.name
    if args.instruction:
        data["instruction"] = args.instruction
    if args.description:
        data["description"] = args.description
    if args.emoji:
        data["emoji"] = args.emoji
    if args.model:
        data["model"] = args.model
    if args.creativity is not None:
        data["creativity"] = args.creativity
    if args.web_search is not None:
        data["webSearch"] = args.web_search
    if args.image_generation is not None:
        data["imageGeneration"] = args.image_generation
    if args.data_analyst is not None:
        data["dataAnalyst"] = args.data_analyst
    if args.canvas is not None:
        data["canvas"] = args.canvas
    if args.conversation_starters:
        data["conversationStarters"] = args.conversation_starters

    result = api_request("/assistant/v1/update", "PATCH", data)
    print(json.dumps(result, indent=2))


def cmd_chat(args):
    """Chat with an agent."""
    messages = [{"role": "user", "content": args.message}]

    # Load conversation history if provided
    if args.history:
        with open(args.history) as f:
            messages = json.load(f) + messages

    data = {"messages": messages}

    if args.id:
        data["assistantId"] = args.id
    elif args.temp_name and args.temp_instruction:
        data["assistant"] = {
            "name": args.temp_name,
            "instructions": args.temp_instruction,
        }
        if args.temp_model:
            data["assistant"]["model"] = args.temp_model
    else:
        print("Error: Either --id or (--temp-name and --temp-instruction) required", file=sys.stderr)
        sys.exit(1)

    if args.max_steps:
        data["maxSteps"] = args.max_steps

    if args.output_schema:
        with open(args.output_schema) as f:
            data["output"] = json.load(f)

    result = api_request("/assistant/v1/chat/completions", "POST", data)
    print(json.dumps(result, indent=2))


def cmd_models(args):
    """List available models."""
    result = api_request("/assistant/v1/models")
    print(json.dumps(result, indent=2))


def cmd_upload(args):
    """Upload a file attachment."""
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f)}
        api_key = get_api_key()

        response = requests.post(
            f"{BASE_URL}/attachment/v1/upload",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
        )
        response.raise_for_status()
        print(json.dumps(response.json(), indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Langdock Agent API CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new agent")
    create_parser.add_argument("--name", required=True, help="Agent name (1-255 chars)")
    create_parser.add_argument("--instruction", help="System prompt (max 16384 chars)")
    create_parser.add_argument("--description", help="Description (max 256 chars)")
    create_parser.add_argument("--emoji", help="Emoji icon (e.g., '🤖')")
    create_parser.add_argument("--model", help="Model UUID")
    create_parser.add_argument("--creativity", type=float, help="Temperature 0-1 (default: 0.3)")
    create_parser.add_argument("--web-search", action="store_true", help="Enable web search")
    create_parser.add_argument("--image-generation", action="store_true", help="Enable image generation")
    create_parser.add_argument("--data-analyst", action="store_true", help="Enable code interpreter")
    create_parser.add_argument("--canvas", action="store_true", help="Enable canvas")
    create_parser.add_argument("--conversation-starters", nargs="+", help="Suggested prompts")
    create_parser.set_defaults(func=cmd_create)

    # Get command
    get_parser = subparsers.add_parser("get", help="Get agent details")
    get_parser.add_argument("--id", required=True, help="Agent UUID")
    get_parser.set_defaults(func=cmd_get)

    # Update command
    update_parser = subparsers.add_parser("update", help="Update an agent")
    update_parser.add_argument("--id", required=True, help="Agent UUID")
    update_parser.add_argument("--name", help="New name")
    update_parser.add_argument("--instruction", help="New system prompt")
    update_parser.add_argument("--description", help="New description")
    update_parser.add_argument("--emoji", help="New emoji")
    update_parser.add_argument("--model", help="New model UUID")
    update_parser.add_argument("--creativity", type=float, help="New temperature")
    update_parser.add_argument("--web-search", type=bool, help="Enable/disable web search")
    update_parser.add_argument("--image-generation", type=bool, help="Enable/disable image generation")
    update_parser.add_argument("--data-analyst", type=bool, help="Enable/disable code interpreter")
    update_parser.add_argument("--canvas", type=bool, help="Enable/disable canvas")
    update_parser.add_argument("--conversation-starters", nargs="+", help="New suggested prompts")
    update_parser.set_defaults(func=cmd_update)

    # Chat command
    chat_parser = subparsers.add_parser("chat", help="Chat with an agent")
    chat_parser.add_argument("--id", help="Agent UUID (for existing agent)")
    chat_parser.add_argument("--message", required=True, help="User message")
    chat_parser.add_argument("--history", help="JSON file with conversation history")
    chat_parser.add_argument("--max-steps", type=int, help="Max reasoning steps (1-20)")
    chat_parser.add_argument("--output-schema", help="JSON file with output schema")
    chat_parser.add_argument("--temp-name", help="Temporary agent name")
    chat_parser.add_argument("--temp-instruction", help="Temporary agent instructions")
    chat_parser.add_argument("--temp-model", help="Temporary agent model")
    chat_parser.set_defaults(func=cmd_chat)

    # Models command
    models_parser = subparsers.add_parser("models", help="List available models")
    models_parser.set_defaults(func=cmd_models)

    # Upload command
    upload_parser = subparsers.add_parser("upload", help="Upload a file attachment")
    upload_parser.add_argument("--file", required=True, help="File path to upload")
    upload_parser.set_defaults(func=cmd_upload)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
