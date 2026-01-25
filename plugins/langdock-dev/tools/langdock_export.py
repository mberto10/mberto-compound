#!/usr/bin/env python3
"""
Langdock Usage Export API CLI Tool

Usage:
    python langdock_export.py users --from 2024-01-01 --to 2024-01-31
    python langdock_export.py agents --from 2024-01-01 --to 2024-01-31 --timezone Europe/Berlin
    python langdock_export.py workflows --from 2024-01-01 --to 2024-01-31
    python langdock_export.py projects --from 2024-01-01 --to 2024-01-31
    python langdock_export.py models --from 2024-01-01 --to 2024-01-31

Environment:
    LANGDOCK_API_KEY: Required API key with USAGE_EXPORT_API scope (admin only)
"""

import argparse
import json
import os
import sys
from datetime import datetime

import requests

BASE_URL = "https://api.langdock.com"


def get_api_key() -> str:
    """Get API key from environment."""
    key = os.environ.get("LANGDOCK_API_KEY")
    if not key:
        print("Error: LANGDOCK_API_KEY environment variable is required", file=sys.stderr)
        sys.exit(1)
    return key


def parse_date(date_str: str, is_end: bool = False) -> str:
    """Parse date string and return ISO format with time."""
    # Try parsing different formats
    formats = [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            # If only date provided, set time to start or end of day
            if fmt == "%Y-%m-%d":
                if is_end:
                    return f"{date_str}T23:59:59.999"
                else:
                    return f"{date_str}T00:00:00.000"
            # Already has time
            if "." in date_str:
                return date_str
            return f"{date_str}.000"
        except ValueError:
            continue

    print(f"Error: Invalid date format: {date_str}", file=sys.stderr)
    print("Expected formats: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS", file=sys.stderr)
    sys.exit(1)


def export_usage(export_type: str, from_date: str, to_date: str, timezone: str) -> dict:
    """Export usage data for a specific type."""
    api_key = get_api_key()
    url = f"{BASE_URL}/export/{export_type}"

    data = {
        "from": {
            "date": parse_date(from_date, is_end=False),
            "timezone": timezone,
        },
        "to": {
            "date": parse_date(to_date, is_end=True),
            "timezone": timezone,
        },
    }

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

    return response.json()


def cmd_export(args, export_type: str):
    """Generic export command handler."""
    result = export_usage(export_type, args.from_date, args.to_date, args.timezone)

    if args.download and result.get("data", {}).get("downloadUrl"):
        # Download the CSV file
        download_url = result["data"]["downloadUrl"]
        output_file = args.output or f"{export_type}_export.csv"

        print(f"Downloading to {output_file}...")
        response = requests.get(download_url)
        response.raise_for_status()

        with open(output_file, "wb") as f:
            f.write(response.content)

        print(f"Downloaded {len(response.content):,} bytes to {output_file}")
        print(f"Records: {result['data'].get('recordCount', 'N/A')}")
    else:
        print(json.dumps(result, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Langdock Usage Export API CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Common arguments
    parent_parser = argparse.ArgumentParser(add_help=False)
    parent_parser.add_argument(
        "--from", dest="from_date", required=True,
        help="Start date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
    )
    parent_parser.add_argument(
        "--to", dest="to_date", required=True,
        help="End date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
    )
    parent_parser.add_argument(
        "--timezone", default="UTC",
        help="Timezone for dates (e.g., Europe/Berlin, UTC). Default: UTC"
    )
    parent_parser.add_argument(
        "--download", action="store_true",
        help="Download the CSV file instead of just showing the URL"
    )
    parent_parser.add_argument(
        "--output", "-o",
        help="Output file path for download (default: <type>_export.csv)"
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Users export
    users_parser = subparsers.add_parser(
        "users", parents=[parent_parser],
        help="Export user activity metrics"
    )
    users_parser.set_defaults(func=lambda args: cmd_export(args, "users"))

    # Agents/Assistants export
    agents_parser = subparsers.add_parser(
        "agents", parents=[parent_parser],
        help="Export agent/assistant usage data"
    )
    agents_parser.set_defaults(func=lambda args: cmd_export(args, "assistants"))

    # Workflows export
    workflows_parser = subparsers.add_parser(
        "workflows", parents=[parent_parser],
        help="Export workflow execution metrics"
    )
    workflows_parser.set_defaults(func=lambda args: cmd_export(args, "workflows"))

    # Projects export
    projects_parser = subparsers.add_parser(
        "projects", parents=[parent_parser],
        help="Export project activity metrics"
    )
    projects_parser.set_defaults(func=lambda args: cmd_export(args, "projects"))

    # Models export
    models_parser = subparsers.add_parser(
        "models", parents=[parent_parser],
        help="Export per-model usage metrics"
    )
    models_parser.set_defaults(func=lambda args: cmd_export(args, "models"))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
