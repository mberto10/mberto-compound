# Helper Tools

CLI tools for interacting with Linear and YouTrack APIs.

## Setup

Set environment variables:

```bash
# Linear
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxxxxx"

# YouTrack
export YOUTRACK_API_TOKEN="perm:xxxxxxxxxxxxxxxx"
```

## Linear CLI

```bash
cd helper_tools/linear

# List your tasks
python linear.py tasks

# Tasks due today
python linear.py today

# Create a task
python linear.py create "Task title"

# Mark task done
python linear.py done ABC-123

# Move to in progress
python linear.py progress ABC-123

# Search tasks
python linear.py search "RAG"
```

## YouTrack CLI

```bash
cd helper_tools/youtrack

# Get issue details
python yt.py get AI-74

# Search issues
python yt.py search "project: AI State: Open"
python yt.py search "assignee: me"

# Create issue
python yt.py create "Bug: Login fails" "Users cannot log in"

# Add comment
python yt.py comment AI-74 "Fixed in latest commit"

# Get comments
python yt.py comments AI-74

# Get KW updates (current week)
python get_kw_updates.py

# Get KW updates (specific week)
python get_kw_updates.py --kw=50
```

## Output Format

All tools output JSON for easy parsing. Example:

```json
{
  "success": true,
  "issue": {
    "id": "ABC-123",
    "title": "Task title"
  }
}
```

Errors also return JSON:

```json
{
  "error": "Issue not found"
}
```

## Getting API Keys

### Linear
1. Go to Linear Settings → API
2. Create Personal API Key
3. Copy key (starts with `lin_api_`)

### YouTrack
1. Go to YouTrack Profile → Account Security
2. Create Permanent Token
3. Give read/write permissions for issues
