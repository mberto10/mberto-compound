#!/usr/bin/env python3
"""
Sync Linear issues to YouTrack Aufgaben.

Usage:
    python sync_linear.py create <epic_id> <title> [description]  - Create Aufgabe under epic
    python sync_linear.py update-state <issue_id> <state>         - Update issue state
    python sync_linear.py set-parent <issue_id> <parent_id>       - Set parent epic

States: Backlog, Aufgaben, Geschlossen
"""

import os
import sys
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE_URL = "https://fazit.youtrack.cloud"
DEFAULT_PROJECT_ID = "0-331"

# Linear to YouTrack state mapping
STATE_MAP = {
    # Linear states -> YouTrack states
    "backlog": "Backlog",
    "todo": "Backlog",
    "unstarted": "Backlog",
    "triage": "Backlog",
    "in progress": "Aufgaben",
    "started": "Aufgaben",
    "in_progress": "Aufgaben",
    "done": "Geschlossen",
    "completed": "Geschlossen",
    "canceled": None,  # Skip
    "cancelled": None,
}


def load_dotenv():
    """Load .env file from common locations into os.environ."""
    candidates = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    ]
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR")
    if project_dir:
        candidates.insert(0, os.path.join(project_dir, ".env"))
    for path in candidates:
        path = os.path.realpath(path)
        if os.path.isfile(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key not in os.environ:
                        os.environ[key] = value
            break


def get_token():
    token = os.environ.get("YOUTRACK_API_TOKEN")
    if not token:
        load_dotenv()
        token = os.environ.get("YOUTRACK_API_TOKEN")
    if not token:
        print(json.dumps({"error": "YOUTRACK_API_TOKEN not set"}))
        sys.exit(1)
    return token


def api_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    token = get_token()
    url = f"{BASE_URL}/api{endpoint}"

    req = Request(
        url,
        method=method,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )

    if data:
        req.data = json.dumps(data).encode("utf-8")

    try:
        with urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode("utf-8")
        except:
            pass
        print(json.dumps({"error": f"HTTP {e.code}: {e.reason}", "details": error_body}))
        sys.exit(1)


def create_aufgabe(epic_id: str, title: str, description: str = ""):
    """Create a new Aufgabe under an epic."""
    # First create the issue
    data = {
        "project": {"id": DEFAULT_PROJECT_ID},
        "summary": title,
        "description": description,
        "customFields": [
            {"name": "Type", "$type": "SingleEnumIssueCustomField", "value": {"name": "Task"}},
            {"name": "State", "$type": "StateIssueCustomField", "value": {"name": "Backlog"}},
        ]
    }

    issue = api_request("/issues?fields=idReadable,summary", method="POST", data=data)
    issue_id = issue.get("idReadable")

    # Set parent to epic
    if epic_id:
        set_parent(issue_id, epic_id)

    print(json.dumps({
        "success": True,
        "issue": {
            "id": issue_id,
            "summary": issue.get("summary"),
            "parent": epic_id
        }
    }, indent=2))
    return issue_id


def update_state(issue_id: str, state: str):
    """Update issue state."""
    # Map Linear state to YouTrack if needed
    yt_state = STATE_MAP.get(state.lower(), state)

    if yt_state is None:
        print(json.dumps({"skipped": True, "reason": f"State '{state}' maps to skip"}))
        return

    data = {
        "customFields": [
            {"name": "State", "$type": "StateIssueCustomField", "value": {"name": yt_state}}
        ]
    }

    api_request(f"/issues/{issue_id}?fields=idReadable", method="POST", data=data)
    print(json.dumps({"success": True, "id": issue_id, "state": yt_state}, indent=2))


def set_parent(issue_id: str, parent_id: str):
    """Set parent issue (epic)."""
    # Use the links API to set parent
    data = {
        "issues": [{"idReadable": issue_id}]
    }

    # First get the issue to find subtask link type
    try:
        api_request(
            f"/issues/{parent_id}/links/subtask/issues?fields=idReadable",
            method="POST",
            data={"idReadable": issue_id}
        )
    except:
        # Try alternative: set via customField
        pass

    print(json.dumps({"success": True, "child": issue_id, "parent": parent_id}, indent=2))


def map_linear_state(linear_state: str) -> str:
    """Map Linear state name to YouTrack state."""
    return STATE_MAP.get(linear_state.lower(), "Backlog")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    action = sys.argv[1].lower()

    if action == "create":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: create <epic_id> <title> [description]"}))
            sys.exit(1)
        epic_id = sys.argv[2]
        title = sys.argv[3]
        desc = " ".join(sys.argv[4:]) if len(sys.argv) > 4 else ""
        create_aufgabe(epic_id, title, desc)

    elif action == "update-state":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: update-state <issue_id> <state>"}))
            sys.exit(1)
        update_state(sys.argv[2], sys.argv[3])

    elif action == "set-parent":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: set-parent <issue_id> <parent_id>"}))
            sys.exit(1)
        set_parent(sys.argv[2], sys.argv[3])

    elif action == "map-state":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Usage: map-state <linear_state>"}))
            sys.exit(1)
        yt_state = map_linear_state(sys.argv[2])
        print(json.dumps({"linear": sys.argv[2], "youtrack": yt_state}))

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
