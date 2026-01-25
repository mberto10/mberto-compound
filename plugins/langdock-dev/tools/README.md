# Langdock CLI Tools

Command-line tools for interacting with the Langdock API.

## Prerequisites

```bash
pip install requests
```

Set your API key:
```bash
export LANGDOCK_API_KEY="your-api-key-here"
```

## Tools

### langdock_agent.py - Agent API

Manage agents and chat with them.

```bash
# Create a new agent
python langdock_agent.py create --name "My Agent" --instruction "You are helpful." --emoji "🤖"

# Get agent details
python langdock_agent.py get --id <agent-uuid>

# Update an agent
python langdock_agent.py update --id <agent-uuid> --name "New Name" --creativity 0.7

# Chat with an existing agent
python langdock_agent.py chat --id <agent-uuid> --message "Hello!"

# Chat with a temporary agent
python langdock_agent.py chat --temp-name "Helper" --temp-instruction "Be concise." --message "Hi"

# List available models
python langdock_agent.py models

# Upload a file attachment
python langdock_agent.py upload --file document.pdf
```

### langdock_knowledge.py - Knowledge Folder API

Manage knowledge folders for RAG.

```bash
# Upload a file to a knowledge folder
python langdock_knowledge.py upload --folder <folder-id> --file document.pdf --url "https://source.com"

# Update a file
python langdock_knowledge.py update --folder <folder-id> --attachment <attachment-id> --file new.pdf

# List files in a folder
python langdock_knowledge.py list --folder <folder-id>
python langdock_knowledge.py list --folder <folder-id> --format table

# Delete a file
python langdock_knowledge.py delete --folder <folder-id> --attachment <attachment-id>

# Search across all shared folders
python langdock_knowledge.py search --query "quarterly revenue"
python langdock_knowledge.py search --query "quarterly revenue" --format table
```

### langdock_export.py - Usage Export API

Export workspace usage data (admin only, requires USAGE_EXPORT_API scope).

```bash
# Export user activity
python langdock_export.py users --from 2024-01-01 --to 2024-01-31

# Export with timezone
python langdock_export.py agents --from 2024-01-01 --to 2024-01-31 --timezone Europe/Berlin

# Download CSV directly
python langdock_export.py models --from 2024-01-01 --to 2024-01-31 --download -o usage.csv

# Other export types
python langdock_export.py workflows --from 2024-01-01 --to 2024-01-31
python langdock_export.py projects --from 2024-01-01 --to 2024-01-31
```

## API Key Scopes

Different tools require different API key scopes:

| Scope | Tools |
|-------|-------|
| `AGENT_API` | langdock_agent.py |
| Knowledge folder shared with API | langdock_knowledge.py |
| `USAGE_EXPORT_API` | langdock_export.py |

Create API keys in the Langdock Dashboard: Settings → API Keys

## Rate Limits

- 500 requests per minute (workspace level)
- 60,000 tokens per minute (workspace level)
- Usage exports: max 1,000,000 rows per request
