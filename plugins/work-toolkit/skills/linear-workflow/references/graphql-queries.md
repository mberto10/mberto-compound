# Linear GraphQL Queries

## Authentication

```
Authorization: {API_KEY}
```

Note: Linear uses the API key directly, not as a Bearer token.

## Get My Issues

```graphql
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
```

## Create Issue

```graphql
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
```

Variables:
```json
{
  "input": {
    "teamId": "team-uuid",
    "title": "Issue title",
    "description": "Description in markdown"
  }
}
```

## Update Issue State

```graphql
mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue {
      identifier
      state {
        name
      }
    }
  }
}
```

Variables:
```json
{
  "id": "issue-uuid",
  "input": {
    "stateId": "state-uuid"
  }
}
```

## Search Issues

```graphql
query SearchIssues($filter: IssueFilter) {
  issues(filter: $filter, first: 20) {
    nodes {
      identifier
      title
      state {
        name
      }
      project {
        name
      }
    }
  }
}
```

Variables:
```json
{
  "filter": {
    "title": { "containsIgnoreCase": "search term" }
  }
}
```

## Get Teams

```graphql
query Teams {
  teams(first: 10) {
    nodes {
      id
      name
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
```

## State Types

| Type | Meaning |
|------|---------|
| `backlog` | Not started, in backlog |
| `unstarted` | Ready to start |
| `started` | In progress |
| `completed` | Done |
| `canceled` | Cancelled |

## Priority Values

| Value | Meaning |
|-------|---------|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |
