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
    update <id> [--state=X]     Update issue fields
    comments <id>               List comments on issue
"""

import os
import sys
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote

BASE_URL = "https://fazit.youtrack.cloud"
DEFAULT_PROJECT_ID = "0-331"


def get_token():
    """Get YouTrack API token from environment."""
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


def get_comments(issue_id: str):
    """Get comments for an issue."""
    comments = api_request(
        f"/issues/{issue_id}/comments?fields=id,text,created,author(name)&$top=50"
    )

    output = [{
        "id": c.get("id"),
        "text": c.get("text", "")[:300],
        "author": c.get("author", {}).get("name") if c.get("author") else None,
        "created": c.get("created")
    } for c in comments]

    print(json.dumps({"comments": output, "count": len(output)}, indent=2))


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
        get_comments(sys.argv[2])

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
