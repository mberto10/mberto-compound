#!/usr/bin/env python3
"""
YouTrack CLI - Ticket management via YouTrack REST API.

Environment Variables:
    YOUTRACK_API_TOKEN: Your YouTrack permanent token (required)

Configuration:
    Base URL: https://fazit.youtrack.cloud
    Default Project: AI (ID: 0-331)

Usage:
    python yt.py <action> [args...]

Actions:
    get <id>                    Get issue details (e.g., AI-74)
    search <query>              Search issues with YouTrack query
    create <title> [desc]       Create new issue
    comment <id> <text>         Add comment to issue
    update-comment <issue_id> <comment_id> <text>  Update existing comment
    comments <id>               List comments on issue (full text with --full)
    find-epic <project_name>    Find epic ticket by project name
    team-epics [name]           List active epics, filter by Bearbeiter name
    health-check [name]         Check epic health (descriptions, milestones, updates)
"""

import os
import sys
import json
import re
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote

BASE_URL = "https://fazit.youtrack.cloud"
DEFAULT_PROJECT_ID = "0-331"


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
    """Get YouTrack API token from environment."""
    token = os.environ.get("YOUTRACK_API_TOKEN")
    if not token:
        load_dotenv()
        token = os.environ.get("YOUTRACK_API_TOKEN")
    if not token:
        print(json.dumps({"error": "YOUTRACK_API_TOKEN not set"}))
        sys.exit(1)
    return token


def api_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Execute API request to YouTrack."""
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


def get_issue(issue_id: str):
    """Get issue details."""
    fields = "idReadable,summary,description,created,updated,reporter(name),assignee(name),customFields(name,value(name))"
    issue = api_request(f"/issues/{issue_id}?fields={fields}")

    # Extract custom fields
    custom_fields = {}
    for cf in issue.get("customFields", []):
        name = cf.get("name")
        value = cf.get("value")
        if value:
            if isinstance(value, dict):
                custom_fields[name] = value.get("name")
            elif isinstance(value, list):
                custom_fields[name] = [v.get("name") for v in value if isinstance(v, dict)]
            else:
                custom_fields[name] = value

    output = {
        "id": issue.get("idReadable"),
        "summary": issue.get("summary"),
        "description": issue.get("description", "")[:500],
        "reporter": issue.get("reporter", {}).get("name") if issue.get("reporter") else None,
        "assignee": issue.get("assignee", {}).get("name") if issue.get("assignee") else None,
        "fields": custom_fields
    }

    print(json.dumps(output, indent=2))


def search_issues(query: str):
    """Search issues with YouTrack query."""
    encoded_query = quote(query)
    fields = "idReadable,summary,description,customFields(name,value(name))"
    issues = api_request(f"/issues?query={encoded_query}&fields={fields}&$top=30")

    output = []
    for issue in issues:
        state = None
        for cf in issue.get("customFields", []):
            if cf.get("name") == "State" and cf.get("value"):
                state = cf["value"].get("name")
                break

        output.append({
            "id": issue.get("idReadable"),
            "summary": issue.get("summary"),
            "state": state
        })

    print(json.dumps({"results": output, "count": len(output)}, indent=2))


def create_issue(title: str, description: str = ""):
    """Create a new issue."""
    data = {
        "project": {"id": DEFAULT_PROJECT_ID},
        "summary": title,
        "description": description
    }

    issue = api_request("/issues?fields=idReadable,summary", method="POST", data=data)

    print(json.dumps({
        "success": True,
        "issue": {
            "id": issue.get("idReadable"),
            "summary": issue.get("summary")
        }
    }, indent=2))


def add_comment(issue_id: str, text: str):
    """Add comment to issue."""
    data = {
        "text": text,
        "usesMarkdown": True
    }

    comment = api_request(
        f"/issues/{issue_id}/comments?fields=id,text,created,author(name)",
        method="POST",
        data=data
    )

    print(json.dumps({
        "success": True,
        "comment": {
            "id": comment.get("id"),
            "author": comment.get("author", {}).get("name") if comment.get("author") else None,
            "created": comment.get("created")
        }
    }, indent=2))


def get_comments(issue_id: str, full: bool = False):
    """Get comments for an issue."""
    comments = api_request(
        f"/issues/{issue_id}/comments?fields=id,text,created,author(name)&$top=100"
    )

    output = [{
        "id": c.get("id"),
        "text": (c.get("text") or "") if full else (c.get("text") or "")[:300],
        "author": c.get("author", {}).get("name") if c.get("author") else None,
        "created": c.get("created")
    } for c in comments]

    print(json.dumps({"comments": output, "count": len(output)}, indent=2))


def update_comment(issue_id: str, comment_id: str, text: str):
    """Update an existing comment."""
    data = {
        "text": text,
        "usesMarkdown": True
    }

    comment = api_request(
        f"/issues/{issue_id}/comments/{comment_id}?fields=id,text,created,author(name)",
        method="POST",
        data=data
    )

    print(json.dumps({
        "success": True,
        "comment": {
            "id": comment.get("id"),
            "author": comment.get("author", {}).get("name") if comment.get("author") else None,
            "updated": True
        }
    }, indent=2))


def find_epic(project_name: str):
    """Find epic ticket by project name."""
    # Search for Story type with Projektticket state matching the name
    query = f'project: AI Type: Story "{project_name}"'
    encoded_query = quote(query)
    fields = "idReadable,summary,customFields(name,value(name))"
    issues = api_request(f"/issues?query={encoded_query}&fields={fields}&$top=10")

    # Find best match (prefer Projektticket state)
    results = []
    for issue in issues:
        state = None
        for cf in issue.get("customFields", []):
            if cf.get("name") == "State" and cf.get("value"):
                state = cf["value"].get("name")
                break

        results.append({
            "id": issue.get("idReadable"),
            "summary": issue.get("summary"),
            "state": state
        })

    # Sort to prioritize Projektticket state
    results.sort(key=lambda x: (x["state"] != "Projektticket", x["id"]))

    if results:
        print(json.dumps({"epic": results[0], "alternatives": results[1:5]}, indent=2))
    else:
        print(json.dumps({"error": f"No epic found for '{project_name}'", "epic": None}, indent=2))


def list_team_epics(bearbeiter: str = None):
    """List active epics, optionally filtered by Bearbeiter."""
    query = "project: AI Type: Story State: Projektticket"
    encoded_query = quote(query)
    fields = "idReadable,summary,description,customFields(name,value(name)),comments(id,text,created)"
    issues = api_request(f"/issues?query={encoded_query}&fields={fields}&$top=50")

    results = []
    for issue in issues:
        # Extract custom fields
        state = None
        assignee = None
        support = None

        for cf in issue.get("customFields", []):
            name = cf.get("name")
            value = cf.get("value")
            if name == "State" and value:
                state = value.get("name") if isinstance(value, dict) else value
            elif name in ("Bearbeiter", "Assignee") and value:
                assignee = value.get("name") if isinstance(value, dict) else value
            elif name == "Support" and value:
                if isinstance(value, list):
                    support = [v.get("name") for v in value if isinstance(v, dict)]
                elif isinstance(value, dict):
                    support = [value.get("name")]

        # Filter by Bearbeiter if specified
        if bearbeiter:
            if not assignee or bearbeiter.lower() not in assignee.lower():
                continue

        # Get latest KW comment
        latest_kw = None
        comments = issue.get("comments", [])
        for comment in reversed(comments):  # Most recent first
            text = comment.get("text", "")
            if "KW" in text and ("Update" in text or "**Updates:**" in text):
                latest_kw = {
                    "id": comment.get("id"),
                    "preview": text[:200],
                    "created": comment.get("created")
                }
                break

        results.append({
            "id": issue.get("idReadable"),
            "summary": issue.get("summary"),
            "bearbeiter": assignee,
            "support": support,
            "description_preview": (issue.get("description") or "")[:300],
            "latest_kw": latest_kw
        })

    print(json.dumps({
        "epics": results,
        "count": len(results),
        "filter": {"bearbeiter": bearbeiter} if bearbeiter else None
    }, indent=2))


def health_check(bearbeiter: str = None):
    """Check health of active epics."""
    query = "project: AI Type: Story State: Projektticket"
    encoded_query = quote(query)
    fields = "idReadable,summary,description,customFields(name,value(name)),comments(id,text,created)"
    issues = api_request(f"/issues?query={encoded_query}&fields={fields}&$top=50")

    # Current time for staleness check
    now = datetime.now()
    two_weeks_ago = now - timedelta(weeks=2)
    two_weeks_ms = int(two_weeks_ago.timestamp() * 1000)

    missing_description = []
    missing_milestones = []
    missing_bearbeiter = []
    stale_updates = []
    healthy = []

    for issue in issues:
        epic_id = issue.get("idReadable")
        summary = issue.get("summary")
        description = issue.get("description") or ""

        # Extract Bearbeiter
        assignee = None
        for cf in issue.get("customFields", []):
            name = cf.get("name")
            value = cf.get("value")
            if name in ("Bearbeiter", "Assignee") and value:
                assignee = value.get("name") if isinstance(value, dict) else value
                break

        # Filter by Bearbeiter if specified
        if bearbeiter:
            if not assignee or bearbeiter.lower() not in assignee.lower():
                continue

        epic_info = {
            "id": epic_id,
            "summary": summary,
            "bearbeiter": assignee
        }

        issues_found = []

        # Check for Projektziel
        has_projektziel = "projektziel" in description.lower() or "## projektziel" in description.lower()
        if not has_projektziel and len(description) < 50:
            missing_description.append(epic_info)
            issues_found.append("no_description")

        # Check for Meilensteine
        has_milestones = "meilenstein" in description.lower() or "| meilenstein" in description.lower() or "KW" in description
        if not has_milestones:
            missing_milestones.append(epic_info)
            issues_found.append("no_milestones")

        # Check for Bearbeiter
        if not assignee:
            missing_bearbeiter.append(epic_info)
            issues_found.append("no_bearbeiter")

        # Check for recent KW comment
        latest_kw_time = None
        comments = issue.get("comments") or []
        for comment in reversed(comments):
            text = comment.get("text") or ""
            if text and "KW" in text and ("Update" in text or "**Updates:**" in text):
                latest_kw_time = comment.get("created")
                break

        if not latest_kw_time or latest_kw_time < two_weeks_ms:
            weeks_ago = "never"
            if latest_kw_time:
                days = (now - datetime.fromtimestamp(latest_kw_time / 1000)).days
                weeks_ago = f"{days // 7} weeks ago"
            stale_updates.append({**epic_info, "last_update": weeks_ago})
            issues_found.append("stale")

        # If no issues, it's healthy
        if not issues_found:
            healthy.append(epic_info)

    # Get orphaned Aufgaben count (tasks without parent)
    orphan_count = 0  # Skip orphan check due to query complexity

    print(json.dumps({
        "summary": {
            "total_epics": len(missing_description) + len(healthy) + len([e for e in stale_updates if e not in missing_description]),
            "healthy": len(healthy),
            "issues_found": len(missing_description) + len(missing_milestones) + len(missing_bearbeiter) + len(stale_updates)
        },
        "missing_description": missing_description,
        "missing_milestones": missing_milestones,
        "missing_bearbeiter": missing_bearbeiter,
        "stale_updates": stale_updates,
        "healthy": healthy,
        "orphaned_aufgaben": orphan_count,
        "filter": {"bearbeiter": bearbeiter} if bearbeiter else None
    }, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    action = sys.argv[1].lower()

    if action == "get":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Issue ID required"}))
            sys.exit(1)
        get_issue(sys.argv[2])

    elif action == "search":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Query required"}))
            sys.exit(1)
        search_issues(" ".join(sys.argv[2:]))

    elif action == "create":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Title required"}))
            sys.exit(1)
        title = sys.argv[2]
        desc = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""
        create_issue(title, desc)

    elif action == "comment":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Issue ID and comment text required"}))
            sys.exit(1)
        add_comment(sys.argv[2], " ".join(sys.argv[3:]))

    elif action == "comments":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Issue ID required"}))
            sys.exit(1)
        full = "--full" in sys.argv
        get_comments(sys.argv[2], full=full)

    elif action == "update-comment":
        if len(sys.argv) < 5:
            print(json.dumps({"error": "Issue ID, comment ID, and text required"}))
            sys.exit(1)
        update_comment(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))

    elif action == "find-epic":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Project name required"}))
            sys.exit(1)
        find_epic(" ".join(sys.argv[2:]))

    elif action == "team-epics":
        bearbeiter = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None
        list_team_epics(bearbeiter)

    elif action == "health-check":
        bearbeiter = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None
        health_check(bearbeiter)

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
