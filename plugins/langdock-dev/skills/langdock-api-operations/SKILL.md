---
name: langdock-api-operations
description: This skill should be used when the user asks to "create langdock assistant via api", "manage langdock assistants", "upload file to langdock", "langdock knowledge folder api", "list langdock models", "langdock api request", "chat with langdock assistant api", or needs to directly interact with Langdock APIs for assistant management, file uploads, and knowledge folder operations.
---

# Langdock API Operations

Direct API operations for creating assistants, managing knowledge folders, uploading files, and interacting with Langdock services.

## When to Use

- Creating or managing assistants via API
- Uploading documents to knowledge folders
- Listing available models
- Making direct chat completion requests
- Managing files and folders programmatically

## Quick Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Chat with assistant | POST | `/assistant/v1/chat/completions` |
| List models | GET | `/assistant/v1/models` |
| Upload file | POST | `/v1/knowledge-folders/{id}/files` |
| List files | GET | `/v1/knowledge-folders/{id}/files` |
| Delete file | DELETE | `/v1/knowledge-folders/{id}/files/{fileId}` |
| Search folder | POST | `/v1/knowledge-folders/{id}/search` |
| Completions | POST | `/v1/completions` |
| Embeddings | POST | `/v1/embeddings` |

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

## Create an Assistant via API

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

### Upload a File

```bash
curl -X POST "https://api.langdock.com/v1/knowledge-folders/FOLDER_ID/files" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -F "file=@/path/to/document.pdf"
```

**Supported formats:** PDF, DOCX, TXT, MD, CSV, JSON, HTML

### List Files in Folder

```bash
curl -X GET "https://api.langdock.com/v1/knowledge-folders/FOLDER_ID/files" \
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
curl -X DELETE "https://api.langdock.com/v1/knowledge-folders/FOLDER_ID/files/FILE_ID" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY"
```

### Search Knowledge Folder

```bash
curl -X POST "https://api.langdock.com/v1/knowledge-folders/FOLDER_ID/search" \
  -H "Authorization: Bearer $LANGDOCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "quarterly revenue projections",
    "limit": 10
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

## Python Examples

### Create and Chat with Temporary Assistant

```python
import requests
import os

API_KEY = os.environ["LANGDOCK_API_KEY"]
BASE_URL = "https://api.langdock.com"

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
def upload_file(folder_id: str, file_path: str) -> dict:
    """Upload a file to a knowledge folder."""
    with open(file_path, "rb") as f:
        response = requests.post(
            f"{BASE_URL}/v1/knowledge-folders/{folder_id}/files",
            headers={"Authorization": f"Bearer {API_KEY}"},
            files={"file": f}
        )
    response.raise_for_status()
    return response.json()

# Usage
result = upload_file("folder-uuid", "/path/to/report.pdf")
print(f"Uploaded: {result['id']}")
```

### Search and Answer with RAG

```python
def search_and_answer(folder_id: str, assistant_id: str, question: str) -> dict:
    """Search knowledge folder and answer using assistant."""

    # Search for relevant content
    search_response = requests.post(
        f"{BASE_URL}/v1/knowledge-folders/{folder_id}/search",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"query": question, "limit": 5}
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
- https://docs.langdock.com/api-endpoints/assistant/assistant
- https://docs.langdock.com/api-endpoints/assistant/assistant-api-guide
- https://docs.langdock.com/api-endpoints/assistant/assistant-models
```
