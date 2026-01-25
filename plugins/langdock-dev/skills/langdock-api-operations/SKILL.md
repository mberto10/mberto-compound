---
name: langdock-api-operations
description: This skill should be used when the user asks to "create langdock assistant via api", "manage langdock assistants", "upload file to langdock", "langdock knowledge folder api", "list langdock models", "langdock api request", "chat with langdock assistant api", "export langdock usage", "langdock usage analytics", or needs to directly interact with Langdock APIs for assistant management, file uploads, knowledge folder operations, and usage exports.
---

# Langdock API Operations

Direct API operations for creating agents, managing knowledge folders, uploading files, exporting usage data, and interacting with Langdock services.

## CLI Tools Available

This plugin provides Python CLI tools for direct Langdock API access. Set the `LANGDOCK_API_KEY` environment variable to use them.

### langdock_agent.py - Agent API
```bash
python langdock_agent.py create --name "My Agent" --instruction "You are helpful."
python langdock_agent.py get --id <agent-uuid>
python langdock_agent.py update --id <agent-uuid> --name "New Name"
python langdock_agent.py chat --id <agent-uuid> --message "Hello!"
python langdock_agent.py models
python langdock_agent.py upload --file document.pdf
```

### langdock_knowledge.py - Knowledge Folder API
```bash
python langdock_knowledge.py upload --folder <folder-id> --file doc.pdf
python langdock_knowledge.py update --folder <folder-id> --attachment <id> --file new.pdf
python langdock_knowledge.py list --folder <folder-id>
python langdock_knowledge.py delete --folder <folder-id> --attachment <id>
python langdock_knowledge.py search --query "search terms"
```

### langdock_export.py - Usage Export API
```bash
python langdock_export.py users --from 2024-01-01 --to 2024-01-31
python langdock_export.py agents --from 2024-01-01 --to 2024-01-31 --timezone Europe/Berlin
python langdock_export.py workflows --from 2024-01-01 --to 2024-01-31
python langdock_export.py projects --from 2024-01-01 --to 2024-01-31
python langdock_export.py models --from 2024-01-01 --to 2024-01-31 --download
```

---

## Quick Reference (REST API)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create agent | POST | `/assistant/v1/create` |
| Get agent | GET | `/assistant/v1/get?assistantId={id}` |
| Update agent | PATCH | `/assistant/v1/update` |
| Chat with agent | POST | `/assistant/v1/chat/completions` |
| List models | GET | `/assistant/v1/models` |
| Upload attachment | POST | `/attachment/v1/upload` |
| Upload to folder | POST | `/knowledge/{folderId}` |
| Update file | PATCH | `/knowledge/{folderId}` |
| List files | GET | `/knowledge/{folderId}/list` |
| Delete file | DELETE | `/knowledge/{folderId}/{attachmentId}` |
| Search folders | POST | `/knowledge/search` |
| Export users | POST | `/export/users` |
| Export agents | POST | `/export/assistants` |
| Export workflows | POST | `/export/workflows` |
| Export projects | POST | `/export/projects` |
| Export models | POST | `/export/models` |

**Base URL:** `https://api.langdock.com`

---

## Authentication

All requests require Bearer token:

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"assistantId": "...", "messages": [...]}'
```

**Get API Key:** Langdock Dashboard → Settings → API Keys

---

## Create a Persistent Agent via API

Create agents that persist in your workspace and can be reused:

```bash
curl -X POST https://api.langdock.com/assistant/v1/create \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Document Analyzer",
    "description": "Analyzes and summarizes documents",
    "emoji": "📄",
    "instruction": "You are a helpful agent that analyzes documents. Be thorough but concise.",
    "creativity": 0.5,
    "webSearch": false,
    "dataAnalyst": true
  }'
```

### Agent Create Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Display name (1-255 chars) |
| `description` | string | No | Brief description (max 256 chars) |
| `emoji` | string | No | Visual icon (e.g., "🤖") |
| `instruction` | string | No | System prompt (max 16384 chars) |
| `model` | UUID | No | Model ID (get from `/assistant/v1/models`) |
| `creativity` | number | No | Temperature 0-1 (default: 0.3) |
| `conversationStarters` | string[] | No | Suggested prompts |
| `webSearch` | boolean | No | Enable web search |
| `imageGeneration` | boolean | No | Enable image generation |
| `dataAnalyst` | boolean | No | Enable code interpreter |
| `canvas` | boolean | No | Enable canvas feature |

### Response

```json
{
  "status": "success",
  "message": "Assistant created successfully",
  "assistant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Document Analyzer",
    "emojiIcon": "📄",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Get and Update Agents

### Get Agent Details

```bash
curl -X GET "https://api.langdock.com/assistant/v1/get?assistantId=YOUR_AGENT_ID" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY"
```

### Update Agent

```bash
curl -X PATCH https://api.langdock.com/assistant/v1/update \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Document Analyzer",
    "instruction": "New system prompt here",
    "creativity": 0.7
  }'
```

**Note:** Only provided fields are updated. Array fields (like `conversationStarters`) replace entirely rather than merge. Use `null` to clear optional fields.

---

## Create a Temporary Assistant

Langdock supports **temporary assistants** created on-the-fly via API:

### Basic Temporary Assistant

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant": {
      "name": "My Assistant",
      "instructions": "You are a helpful assistant that answers questions concisely.",
      "description": "A general-purpose helper"
    },
    "messages": [
      {"role": "user", "content": "Hello, what can you do?"}
    ]
  }'
```

### Assistant with Model Override

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant": {
      "name": "Code Reviewer",
      "instructions": "You are a senior developer. Review code for bugs, performance issues, and best practices. Be thorough but concise.",
      "model": "claude-3-5-sonnet-20241022"
    },
    "messages": [
      {"role": "user", "content": "Review this function: def add(a,b): return a+b"}
    ]
  }'
```

### Assistant Configuration Fields

| Field | Required | Max Length | Description |
|-------|----------|------------|-------------|
| `name` | Yes | 64 chars | Display name for the assistant |
| `instructions` | Yes | 16,384 chars | System prompt / behavior instructions |
| `description` | No | 256 chars | Brief description of purpose |
| `model` | No | - | Override default model |

---

## Chat with Existing Assistant

Use an assistant you've already created in the Langdock UI:

### Get Assistant ID

From the URL: `https://app.langdock.com/assistants/ASSISTANT_ID/edit`

### Single Message

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "your-assistant-id-here",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

### Multi-turn Conversation

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "your-assistant-id-here",
    "messages": [
      {"role": "user", "content": "My name is Max"},
      {"role": "assistant", "content": "Nice to meet you, Max! How can I help you today?"},
      {"role": "user", "content": "What is my name?"}
    ]
  }'
```

### Message Format

```json
{
  "role": "user" | "assistant" | "tool",
  "content": "message text",
  "attachmentIds": ["uuid1", "uuid2"]  // Optional: file attachments
}
```

---

## Structured Output (JSON Schema)

Request structured JSON responses:

```bash
curl -X POST https://api.langdock.com/assistant/v1/chat/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "your-assistant-id",
    "messages": [
      {"role": "user", "content": "Extract entities from: Apple CEO Tim Cook announced iPhone 16 in Cupertino"}
    ],
    "output": {
      "type": "json_schema",
      "json_schema": {
        "name": "entity_extraction",
        "schema": {
          "type": "object",
          "properties": {
            "entities": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "type": {"type": "string", "enum": ["person", "organization", "product", "location"]}
                },
                "required": ["name", "type"]
              }
            }
          },
          "required": ["entities"]
        }
      }
    }
  }'
```

---

## List Available Models

```bash
curl -X GET https://api.langdock.com/assistant/v1/models \
  -H "Authorization: Bearer $LANGDOCK_API_KEY"
```

**Response:**
```json
{
  "models": [
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai"},
    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
    {"id": "gemini-pro", "name": "Gemini Pro", "provider": "google"}
  ]
}
```

---

## Knowledge Folder Operations

**Note:** Knowledge folders must be shared with your API key before you can access them. An admin needs to share the folder via the Langdock UI (Integrations → Knowledge Folders → Share → Share with API).

### Upload a File

```bash
curl -X POST "https://api.langdock.com/knowledge/FOLDER_ID" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -F "file=@/path/to/document.pdf" \
  -F "url=https://example.com/source"  # Optional: URL shown when file is cited
```

**Supported formats:** PDF, DOCX, TXT, MD, CSV, JSON, HTML

### Update a File

```bash
curl -X PATCH "https://api.langdock.com/knowledge/FOLDER_ID" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -F "attachmentId=FILE_UUID" \
  -F "file=@/path/to/updated-document.pdf" \
  -F "url=https://example.com/new-source"
```

### List Files in Folder

```bash
curl -X GET "https://api.langdock.com/knowledge/FOLDER_ID/list" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY"
```

**Response:**
```json
{
  "files": [
    {
      "id": "file-uuid",
      "name": "document.pdf",
      "size": 102400,
      "mimeType": "application/pdf",
      "createdAt": "2024-01-15T10:30:00Z",
      "status": "processed"
    }
  ]
}
```

### Delete a File

```bash
curl -X DELETE "https://api.langdock.com/knowledge/FOLDER_ID/FILE_ID" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY"
```

### Search Across All Knowledge Folders

Search across all knowledge folders shared with your API key:

```bash
curl -X POST "https://api.langdock.com/knowledge/search" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "quarterly revenue projections"
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "chunk-uuid",
      "title": "Q3 Financial Report",
      "content": "Revenue increased by 15%...",
      "score": 0.92,
      "fileId": "file-uuid"
    }
  ]
}
```

---

## Direct Completion API

Access models directly without an assistant:

```bash
curl -X POST https://api.langdock.com/v1/completions \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | required | Model ID from `/models` endpoint |
| `messages` | array | required | Conversation messages |
| `temperature` | float | 1.0 | Randomness (0-2) |
| `max_tokens` | int | varies | Maximum response length |
| `top_p` | float | 1.0 | Nucleus sampling |
| `stop` | array | null | Stop sequences |

---

## Embeddings API

Generate vector embeddings for semantic search:

```bash
curl -X POST https://api.langdock.com/v1/embeddings \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "The quick brown fox jumps over the lazy dog"
  }'
```

### Batch Embeddings

```bash
curl -X POST https://api.langdock.com/v1/embeddings \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": [
      "First document text",
      "Second document text",
      "Third document text"
    ]
  }'
```

**Response:**
```json
{
  "data": [
    {"index": 0, "embedding": [0.0023, -0.0142, ...]},
    {"index": 1, "embedding": [0.0156, -0.0089, ...]},
    {"index": 2, "embedding": [-0.0034, 0.0211, ...]}
  ],
  "model": "text-embedding-3-small",
  "usage": {"prompt_tokens": 24, "total_tokens": 24}
}
```

---

## Usage Export API

Export workspace usage data for analytics and billing. Requires API key with `USAGE_EXPORT_API` scope (admin only).

### Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /export/users` | User activity metrics |
| `POST /export/assistants` | Agent/assistant usage |
| `POST /export/workflows` | Workflow execution metrics |
| `POST /export/projects` | Project activity metrics |
| `POST /export/models` | Per-model usage metrics |

### Request Format

All endpoints use the same request structure:

```bash
curl -X POST "https://api.langdock.com/export/users" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "date": "2024-01-01T00:00:00.000",
      "timezone": "Europe/Berlin"
    },
    "to": {
      "date": "2024-01-31T23:59:59.999",
      "timezone": "Europe/Berlin"
    }
  }'
```

### Response Format

```json
{
  "success": true,
  "data": {
    "filePath": "users-usage/workspace-id/2024-01-abc12345.csv",
    "downloadUrl": "https://storage.example.com/signed-url",
    "dataType": "users",
    "recordCount": 1250,
    "dateRange": {
      "from": "2024-01-01T00:00:00.000+01:00",
      "to": "2024-01-31T23:59:59.999+01:00"
    }
  }
}
```

### Limits and Constraints

- **Max rows per export:** 1,000,000 (reduce date range if exceeded)
- **Rate limit:** 500 RPM, 60,000 TPM (workspace level)
- **Privacy:** User data may be excluded based on workspace settings
- **Leaderboards:** Must be enabled in workspace for complete user data

### Python Example

```python
def export_usage(export_type: str, from_date: str, to_date: str, timezone: str = "UTC") -> dict:
    """Export usage data for a date range."""
    response = requests.post(
        f"{BASE_URL}/export/{export_type}",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "from": {"date": from_date, "timezone": timezone},
            "to": {"date": to_date, "timezone": timezone}
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
result = export_usage("users", "2024-01-01T00:00:00.000", "2024-01-31T23:59:59.999", "Europe/Berlin")
print(f"Download URL: {result['data']['downloadUrl']}")
print(f"Records: {result['data']['recordCount']}")
```

---

## Python Examples

### Create a Persistent Agent

```python
import requests
import os

API_KEY = os.environ["LANGDOCK_API_KEY"]
BASE_URL = "https://api.langdock.com"

def create_agent(name: str, instruction: str, **kwargs) -> dict:
    """Create a persistent agent in the workspace."""
    response = requests.post(
        f"{BASE_URL}/assistant/v1/create",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "name": name,
            "instruction": instruction,
            **kwargs
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
agent = create_agent(
    name="Code Reviewer",
    instruction="You are a senior developer. Review code for bugs and best practices.",
    emoji="🔍",
    creativity=0.3,
    dataAnalyst=True
)
print(f"Created agent: {agent['assistant']['id']}")
```

### Create and Chat with Temporary Assistant

```python
def create_assistant_and_chat(name: str, instructions: str, user_message: str) -> str:
    """Create a temporary assistant and get a response."""
    response = requests.post(
        f"{BASE_URL}/assistant/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "assistant": {
                "name": name,
                "instructions": instructions
            },
            "messages": [
                {"role": "user", "content": user_message}
            ]
        }
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

# Usage
response = create_assistant_and_chat(
    name="Python Tutor",
    instructions="You are a Python programming tutor. Explain concepts clearly with examples.",
    user_message="Explain list comprehensions"
)
print(response)
```

### Upload File to Knowledge Folder

```python
def upload_file(folder_id: str, file_path: str, source_url: str = None) -> dict:
    """Upload a file to a knowledge folder."""
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {"url": source_url} if source_url else None
        response = requests.post(
            f"{BASE_URL}/knowledge/{folder_id}",
            headers={"Authorization": f"Bearer {API_KEY}"},
            files=files,
            data=data
        )
    response.raise_for_status()
    return response.json()

# Usage
result = upload_file("folder-uuid", "/path/to/report.pdf", "https://example.com/report")
print(f"Uploaded: {result}")
```

### Search and Answer with RAG

```python
def search_and_answer(assistant_id: str, question: str) -> dict:
    """Search all knowledge folders and answer using assistant."""

    # Search across all shared knowledge folders
    search_response = requests.post(
        f"{BASE_URL}/knowledge/search",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"query": question}
    )
    search_response.raise_for_status()
    results = search_response.json()["results"]

    # Build context
    context = "\n\n".join([f"[{r['title']}]: {r['content']}" for r in results])

    # Ask assistant with context
    chat_response = requests.post(
        f"{BASE_URL}/assistant/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "assistantId": assistant_id,
            "messages": [{
                "role": "user",
                "content": f"Based on this context:\n{context}\n\nAnswer: {question}"
            }]
        }
    )
    chat_response.raise_for_status()

    return {
        "answer": chat_response.json()["choices"][0]["message"]["content"],
        "sources": [r["title"] for r in results]
    }
```

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 500 RPM |
| Tokens per minute | 60,000 TPM |

**Note:** Limits are per workspace, not per API key. Each model has separate limits.

**429 Response:** Rate limit exceeded - implement exponential backoff.

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not found | Verify IDs (assistant, folder, file) |
| 429 | Rate limited | Wait and retry with backoff |
| 500 | Server error | Retry later |

---

## Live Documentation

Fetch latest API details:

```
Use WebFetch on:
- https://docs.langdock.com/api-endpoints/api-introduction
- https://docs.langdock.com/api-endpoints/agent/agent (Agent Chat API)
- https://docs.langdock.com/api-endpoints/agent/agent-create (Create Agent)
- https://docs.langdock.com/api-endpoints/agent/agent-get (Get Agent)
- https://docs.langdock.com/api-endpoints/agent/agent-update (Update Agent)
- https://docs.langdock.com/api-endpoints/agent/agent-models (List Models)
- https://docs.langdock.com/api-endpoints/agent/upload-attachments (Upload Attachment)
- https://docs.langdock.com/api-endpoints/knowledge-folder/upload-file (Upload to Folder)
- https://docs.langdock.com/api-endpoints/knowledge-folder/retrieve-files (List Files)
- https://docs.langdock.com/api-endpoints/knowledge-folder/delete-attachment (Delete File)
- https://docs.langdock.com/api-endpoints/knowledge-folder/search-knowledge-folder (Search)
- https://docs.langdock.com/api-endpoints/usage-export/intro-to-usage-export-api (Usage Export)
```
