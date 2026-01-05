#!/bin/bash
# Linear API Helper Functions
#
# Provides bash functions for interacting with Linear GraphQL API.
# Requires LINEAR_API_KEY environment variable.
#
# Usage: source linear-api.sh

set -e

# ============================================================================
# Configuration
# ============================================================================

LINEAR_API_URL="https://api.linear.app/graphql"
TEAM_KEY="MB90"
PROJECT_NAME="_autonomous"

# ============================================================================
# Helper: Execute GraphQL query
# ============================================================================

linear_query() {
  local query="$1"

  if [ -z "$LINEAR_API_KEY" ]; then
    echo '{"error": "LINEAR_API_KEY not set"}' >&2
    return 1
  fi

  curl -s -X POST "$LINEAR_API_URL" \
    -H "Authorization: $LINEAR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$query"
}

# ============================================================================
# Get _autonomous project
# ============================================================================

linear_get_project() {
  local query
  query=$(cat << 'GRAPHQL'
{
  "query": "query GetProject { projects(filter: { name: { eq: \"_autonomous\" } }) { nodes { id name description state } } }"
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  # Extract first project
  echo "$result" | jq -r '.data.projects.nodes[0] // empty'
}

# ============================================================================
# Get team ID for MB90
# ============================================================================

linear_get_team_id() {
  local query
  query=$(cat << 'GRAPHQL'
{
  "query": "query GetTeam { teams(filter: { key: { eq: \"MB90\" } }) { nodes { id name } } }"
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.teams.nodes[0].id // empty'
}

# ============================================================================
# Get recent handoff issues
# ============================================================================

linear_get_handoffs() {
  local limit="${1:-5}"

  local query
  query=$(cat << GRAPHQL
{
  "query": "query GetHandoffs { issues(filter: { project: { name: { eq: \\"_autonomous\\" } }, title: { startsWith: \\"Handoff:\\" } }, first: $limit, orderBy: updatedAt) { nodes { id identifier title description state { name } updatedAt } } }"
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.issues.nodes // []'
}

# ============================================================================
# Get current issues (labeled 'current')
# ============================================================================

linear_get_current_issues() {
  local query
  query=$(cat << 'GRAPHQL'
{
  "query": "query GetCurrentIssues { issues(filter: { project: { name: { eq: \"_autonomous\" } }, labels: { name: { eq: \"current\" } } }) { nodes { id identifier title description state { name } } } }"
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.issues.nodes // []'
}

# ============================================================================
# Get pending issues (Backlog state, not handoffs)
# ============================================================================

linear_get_pending_issues() {
  local limit="${1:-10}"

  local query
  query=$(cat << GRAPHQL
{
  "query": "query GetPendingIssues { issues(filter: { project: { name: { eq: \\"_autonomous\\" } }, state: { name: { eq: \\"Backlog\\" } }, title: { notStartsWith: \\"Handoff:\\" } }, first: $limit, orderBy: createdAt) { nodes { id identifier title state { name } } } }"
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.issues.nodes // []'
}

# ============================================================================
# Create handoff issue
# ============================================================================

linear_create_handoff_issue() {
  local title="$1"
  local body="$2"

  # Get project ID
  local project_id
  project_id=$(linear_get_project | jq -r '.id // empty')

  if [ -z "$project_id" ]; then
    echo '{"error": "Could not find _autonomous project"}' >&2
    return 1
  fi

  # Get team ID
  local team_id
  team_id=$(linear_get_team_id)

  if [ -z "$team_id" ]; then
    echo '{"error": "Could not find MB90 team"}' >&2
    return 1
  fi

  # Escape the body for JSON
  local escaped_body
  escaped_body=$(echo "$body" | jq -Rs '.')

  local query
  query=$(cat << GRAPHQL
{
  "query": "mutation CreateIssue(\$input: IssueCreateInput!) { issueCreate(input: \$input) { success issue { id identifier title } } }",
  "variables": {
    "input": {
      "teamId": "$team_id",
      "projectId": "$project_id",
      "title": "$title",
      "description": $escaped_body
    }
  }
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.issueCreate // empty'
}

# ============================================================================
# Update project ledger (description)
# ============================================================================

linear_update_ledger() {
  local project_id="$1"
  local description="$2"

  # Escape the description for JSON
  local escaped_desc
  escaped_desc=$(echo "$description" | jq -Rs '.')

  local query
  query=$(cat << GRAPHQL
{
  "query": "mutation UpdateProject(\$id: String!, \$input: ProjectUpdateInput!) { projectUpdate(id: \$id, input: \$input) { success project { id name description } } }",
  "variables": {
    "id": "$project_id",
    "input": {
      "description": $escaped_desc
    }
  }
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.projectUpdate // empty'
}

# ============================================================================
# Add comment to issue
# ============================================================================

linear_add_comment() {
  local issue_id="$1"
  local body="$2"

  # Escape the body for JSON
  local escaped_body
  escaped_body=$(echo "$body" | jq -Rs '.')

  local query
  query=$(cat << GRAPHQL
{
  "query": "mutation CreateComment(\$input: CommentCreateInput!) { commentCreate(input: \$input) { success comment { id body } } }",
  "variables": {
    "input": {
      "issueId": "$issue_id",
      "body": $escaped_body
    }
  }
}
GRAPHQL
)

  local result
  result=$(linear_query "$query")

  echo "$result" | jq -r '.data.commentCreate // empty'
}

# ============================================================================
# CLI for testing
# ============================================================================

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    get-project)
      linear_get_project
      ;;
    get-team)
      linear_get_team_id
      ;;
    get-handoffs)
      linear_get_handoffs "${2:-5}"
      ;;
    get-current)
      linear_get_current_issues
      ;;
    create-handoff)
      linear_create_handoff_issue "$2" "$3"
      ;;
    update-ledger)
      linear_update_ledger "$2" "$3"
      ;;
    *)
      echo "Usage: $0 {get-project|get-team|get-handoffs|get-current|create-handoff|update-ledger}"
      exit 1
      ;;
  esac
fi
