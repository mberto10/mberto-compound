#!/usr/bin/env python3
"""
Langdock Knowledge Folder API CLI Tool

Usage:
    python langdock_knowledge.py upload --folder <folder-id> --file document.pdf
    python langdock_knowledge.py update --folder <folder-id> --attachment <attachment-id> --file new.pdf
    python langdock_knowledge.py list --folder <folder-id>
    python langdock_knowledge.py delete --folder <folder-id> --attachment <attachment-id>
    python langdock_knowledge.py search --query "search terms"

Environment:
    LANGDOCK_API_KEY: Required API key (knowledge folder must be shared with API key)
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


def cmd_upload(args):
    """Upload a file to a knowledge folder."""
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    api_key = get_api_key()
    url = f"{BASE_URL}/knowledge/{args.folder}"

    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f)}
        data = {}
        if args.url:
            data["url"] = args.url

        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
            data=data if data else None,
        )

    if not response.ok:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(response.json(), indent=2))


def cmd_update(args):
    """Update a file in a knowledge folder."""
    api_key = get_api_key()
    url = f"{BASE_URL}/knowledge/{args.folder}"

    files = {}
    data = {"attachmentId": args.attachment}

    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        files["file"] = (file_path.name, open(file_path, "rb"))

    if args.url:
        data["url"] = args.url

    response = requests.patch(
        url,
        headers={"Authorization": f"Bearer {api_key}"},
        files=files if files else None,
        data=data,
    )

    # Close file if opened
    if "file" in files:
        files["file"][1].close()

    if not response.ok:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(response.json(), indent=2))


def cmd_list(args):
    """List files in a knowledge folder."""
    api_key = get_api_key()
    url = f"{BASE_URL}/knowledge/{args.folder}/list"

    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {api_key}"},
    )

    if not response.ok:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)

    result = response.json()

    if args.format == "table":
        # Print as table
        files = result.get("files", result.get("data", []))
        if not files:
            print("No files found.")
            return

        print(f"{'ID':<40} {'Name':<30} {'Size':<12} {'Status':<12}")
        print("-" * 94)
        for f in files:
            file_id = f.get("id", "N/A")[:38]
            name = f.get("name", "N/A")[:28]
            size = f.get("size", f.get("sizeInBytes", 0))
            size_str = f"{size:,}" if isinstance(size, int) else str(size)
            status = f.get("status", "N/A")
            print(f"{file_id:<40} {name:<30} {size_str:<12} {status:<12}")
    else:
        print(json.dumps(result, indent=2))


def cmd_delete(args):
    """Delete a file from a knowledge folder."""
    api_key = get_api_key()
    url = f"{BASE_URL}/knowledge/{args.folder}/{args.attachment}"

    response = requests.delete(
        url,
        headers={"Authorization": f"Bearer {api_key}"},
    )

    if not response.ok:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)

    print("Attachment deleted successfully.")
    if response.text:
        try:
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            pass


def cmd_search(args):
    """Search across all shared knowledge folders."""
    api_key = get_api_key()
    url = f"{BASE_URL}/knowledge/search"

    data = {"query": args.query}
    if args.limit:
        data["limit"] = args.limit

    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=data,
    )

    if not response.ok:
        print(f"API Error {response.status_code}: {response.text}", file=sys.stderr)
        sys.exit(1)

    result = response.json()

    if args.format == "table":
        results = result.get("results", [])
        if not results:
            print("No results found.")
            return

        for i, r in enumerate(results, 1):
            score = r.get("score", 0)
            title = r.get("title", "N/A")
            content = r.get("content", "")[:200]
            print(f"\n[{i}] {title} (score: {score:.3f})")
            print(f"    {content}...")
    else:
        print(json.dumps(result, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Langdock Knowledge Folder API CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Upload command
    upload_parser = subparsers.add_parser("upload", help="Upload a file to a knowledge folder")
    upload_parser.add_argument("--folder", required=True, help="Knowledge folder UUID")
    upload_parser.add_argument("--file", required=True, help="File path to upload")
    upload_parser.add_argument("--url", help="Source URL shown when file is cited")
    upload_parser.set_defaults(func=cmd_upload)

    # Update command
    update_parser = subparsers.add_parser("update", help="Update a file in a knowledge folder")
    update_parser.add_argument("--folder", required=True, help="Knowledge folder UUID")
    update_parser.add_argument("--attachment", required=True, help="Attachment UUID to update")
    update_parser.add_argument("--file", help="New file to upload")
    update_parser.add_argument("--url", help="New source URL")
    update_parser.set_defaults(func=cmd_update)

    # List command
    list_parser = subparsers.add_parser("list", help="List files in a knowledge folder")
    list_parser.add_argument("--folder", required=True, help="Knowledge folder UUID")
    list_parser.add_argument("--format", choices=["json", "table"], default="json", help="Output format")
    list_parser.set_defaults(func=cmd_list)

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a file from a knowledge folder")
    delete_parser.add_argument("--folder", required=True, help="Knowledge folder UUID")
    delete_parser.add_argument("--attachment", required=True, help="Attachment UUID to delete")
    delete_parser.set_defaults(func=cmd_delete)

    # Search command
    search_parser = subparsers.add_parser("search", help="Search across all shared knowledge folders")
    search_parser.add_argument("--query", required=True, help="Search query")
    search_parser.add_argument("--limit", type=int, help="Maximum number of results")
    search_parser.add_argument("--format", choices=["json", "table"], default="json", help="Output format")
    search_parser.set_defaults(func=cmd_search)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
