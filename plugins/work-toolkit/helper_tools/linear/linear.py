#!/usr/bin/env python3
"""
Linear CLI - Personal task management via Linear GraphQL API.

Environment Variables:
    LINEAR_API_KEY: Your Linear API key (required)

Usage:
    python linear.py <action> [args...]

Actions:
    tasks              List assigned tasks (not completed)
    today              Tasks due today
    create <title>     Create a new issue
    done <id>          Mark issue as complete
    progress <id>      Move issue to in progress
    search <query>     Search issues by title
"""

import os
import sys
import json
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

LINEAR_API_URL = "https://api.linear.app/graphql"


def get_api_key():
    """Get Linear API key from environment."""
    key = os.environ.get("LINEAR_API_KEY")
    if not key:
        print(json.dumps({"error": "LINEAR_API_KEY not set"}))
        sys.exit(1)
    return key


def graphql_request(query: str, variables: dict = None) -> dict:
    """Execute a GraphQL request to Linear API."""
    api_key = get_api_key()

    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    data = json.dumps(payload).encode("utf-8")

    req = Request(
        LINEAR_API_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": api_key,
        },
    )

    try:
        with urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            if "errors" in result:
                print(json.dumps({"error": result["errors"][0]["message"]}))
                sys.exit(1)
            return result
    except HTTPError as e:
        print(json.dumps({"error": f"HTTP {e.code}: {e.reason}"}))
        sys.exit(1)


def get_my_issues(filter_today: bool = False):
    """Fetch issues assigned to current user."""
    query = """
    query MyIssues {
        viewer {
            assignedIssues(
                filter: {
                    state: { type: { nin: ["completed", "canceled"] } }
                }
                first: 50
                orderBy: updatedAt
            ) {
                nodes {
                    id
                    identifier
                    title
                    priority
                    dueDate
                    state {
                        name
                        type
                    }
                    labels {
                        nodes {
                            name
                        }
                    }
                    project {
                        name
                    }
                }
            }
        }
    }
    """

    result = graphql_request(query)
    issues = result.get("data", {}).get("viewer", {}).get("assignedIssues", {}).get("nodes", [])

    if filter_today:
        today = datetime.now().strftime("%Y-%m-%d")
        issues = [i for i in issues if i.get("dueDate") == today]

    # Group by state type
    in_progress = []
    todo = []

    for issue in issues:
        state_type = issue.get("state", {}).get("type", "")
        item = {
            "id": issue.get("identifier"),
            "title": issue.get("title"),
            "state": issue.get("state", {}).get("name"),
            "priority": issue.get("priority"),
            "dueDate": issue.get("dueDate"),
            "project": issue.get("project", {}).get("name") if issue.get("project") else None,
            "labels": [l["name"] for l in issue.get("labels", {}).get("nodes", [])]
        }

        if state_type == "started":
            in_progress.append(item)
        else:
            todo.append(item)

    output = {
        "in_progress": in_progress,
        "todo": todo,
        "total": len(issues)
    }

    print(json.dumps(output, indent=2))


def create_issue(title: str):
    """Create a new issue."""
    # First get the default team
    team_query = """
    query Teams {
        teams(first: 1) {
            nodes {
                id
                name
            }
        }
    }
    """

    team_result = graphql_request(team_query)
    teams = team_result.get("data", {}).get("teams", {}).get("nodes", [])

    if not teams:
        print(json.dumps({"error": "No teams found"}))
        sys.exit(1)

    team_id = teams[0]["id"]

    # Create the issue
    mutation = """
    mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            success
            issue {
                id
                identifier
                title
                url
            }
        }
    }
    """

    result = graphql_request(mutation, {
        "input": {
            "teamId": team_id,
            "title": title
        }
    })

    issue = result.get("data", {}).get("issueCreate", {}).get("issue", {})
    print(json.dumps({
        "success": True,
        "issue": {
            "id": issue.get("identifier"),
            "title": issue.get("title"),
            "url": issue.get("url")
        }
    }, indent=2))


def update_issue_state(identifier: str, state_type: str):
    """Update issue state."""
    # First find the issue
    find_query = """
    query FindIssue($filter: IssueFilter) {
        issues(filter: $filter, first: 1) {
            nodes {
                id
                identifier
                team {
                    states {
                        nodes {
                            id
                            name
                            type
                        }
                    }
                }
            }
        }
    }
    """

    result = graphql_request(find_query, {
        "filter": {"identifier": {"eq": identifier}}
    })

    issues = result.get("data", {}).get("issues", {}).get("nodes", [])
    if not issues:
        print(json.dumps({"error": f"Issue {identifier} not found"}))
        sys.exit(1)

    issue = issues[0]
    states = issue.get("team", {}).get("states", {}).get("nodes", [])

    # Find target state
    target_state = None
    for state in states:
        if state["type"] == state_type:
            target_state = state
            break

    if not target_state:
        print(json.dumps({"error": f"No {state_type} state found"}))
        sys.exit(1)

    # Update
    mutation = """
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
            success
            issue {
                identifier
                state { name }
            }
        }
    }
    """

    result = graphql_request(mutation, {
        "id": issue["id"],
        "input": {"stateId": target_state["id"]}
    })

    updated = result.get("data", {}).get("issueUpdate", {}).get("issue", {})
    print(json.dumps({
        "success": True,
        "issue": {
            "id": updated.get("identifier"),
            "state": updated.get("state", {}).get("name")
        }
    }, indent=2))


def search_issues(query_text: str):
    """Search issues by title."""
    query = """
    query SearchIssues($filter: IssueFilter) {
        issues(filter: $filter, first: 20) {
            nodes {
                identifier
                title
                state { name }
                project { name }
            }
        }
    }
    """

    result = graphql_request(query, {
        "filter": {"title": {"containsIgnoreCase": query_text}}
    })

    issues = result.get("data", {}).get("issues", {}).get("nodes", [])
    output = [{
        "id": i.get("identifier"),
        "title": i.get("title"),
        "state": i.get("state", {}).get("name"),
        "project": i.get("project", {}).get("name") if i.get("project") else None
    } for i in issues]

    print(json.dumps({"results": output, "count": len(output)}, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    action = sys.argv[1].lower()

    if action == "tasks":
        get_my_issues()
    elif action == "today":
        get_my_issues(filter_today=True)
    elif action == "create":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Title required"}))
            sys.exit(1)
        create_issue(" ".join(sys.argv[2:]))
    elif action == "done":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Issue ID required"}))
            sys.exit(1)
        update_issue_state(sys.argv[2], "completed")
    elif action == "progress":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Issue ID required"}))
            sys.exit(1)
        update_issue_state(sys.argv[2], "started")
    elif action == "search":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Search query required"}))
            sys.exit(1)
        search_issues(" ".join(sys.argv[2:]))
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
