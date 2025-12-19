#!/usr/bin/env python3
"""
Get KW (Kalenderwoche) updates from YouTrack epic tickets.

Fetches all KW-tagged comments from project tickets (Type: Story, State: Projektticket)
and compiles them into a structured report.

Environment Variables:
    YOUTRACK_API_TOKEN: Your YouTrack permanent token (required)

Usage:
    python get_kw_updates.py [--kw=XX]

Options:
    --kw=XX    Calendar week number (default: current week)
"""

import os
import sys
import json
import re
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote

BASE_URL = "https://fazit.youtrack.cloud"


def get_token():
    """Get YouTrack API token from environment."""
    token = os.environ.get("YOUTRACK_API_TOKEN")
    if not token:
        print(json.dumps({"error": "YOUTRACK_API_TOKEN not set"}))
        sys.exit(1)
    return token


def api_request(endpoint: str) -> dict:
    """Execute API request to YouTrack."""
    token = get_token()
    url = f"{BASE_URL}/api{endpoint}"

    req = Request(
        url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )

    try:
        with urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        print(json.dumps({"error": f"HTTP {e.code}: {e.reason}"}))
        sys.exit(1)


def get_current_kw():
    """Get current calendar week number."""
    return datetime.now().isocalendar()[1]


def get_epic_tickets():
    """Fetch all epic/project tickets."""
    query = quote("project: AI Type: Story State: Projektticket")
    fields = "idReadable,summary"
    return api_request(f"/issues?query={query}&fields={fields}&$top=50")


def get_ticket_comments(ticket_id: str):
    """Get comments for a ticket."""
    return api_request(
        f"/issues/{ticket_id}/comments?fields=id,text,created,author(name)&$top=100"
    )


def filter_kw_comments(comments: list, kw: int):
    """Filter comments that contain KW update for specified week."""
    kw_pattern = re.compile(rf'\bKW\s*{kw}\b', re.IGNORECASE)
    matching = []

    for comment in comments:
        text = comment.get("text", "")
        if kw_pattern.search(text):
            matching.append({
                "text": text,
                "author": comment.get("author", {}).get("name") if comment.get("author") else None,
                "created": comment.get("created")
            })

    return matching


def main():
    # Parse arguments
    kw = get_current_kw()
    for arg in sys.argv[1:]:
        if arg.startswith("--kw="):
            try:
                kw = int(arg.split("=")[1])
            except ValueError:
                print(json.dumps({"error": "Invalid KW number"}))
                sys.exit(1)

    # Get epics
    epics = get_epic_tickets()

    # Collect KW updates
    updates = []
    for epic in epics:
        ticket_id = epic.get("idReadable")
        summary = epic.get("summary")

        comments = get_ticket_comments(ticket_id)
        kw_comments = filter_kw_comments(comments, kw)

        if kw_comments:
            updates.append({
                "project": summary,
                "ticket_id": ticket_id,
                "updates": kw_comments
            })

    output = {
        "kw": kw,
        "projects": updates,
        "total_projects": len(updates)
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
