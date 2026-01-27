---
name: create-assistant
description: Create a Langdock assistant from a markdown system prompt file
allowed-tools:
  - Bash
  - Read
argument-hint: "<assistant-name> <emoji> <path-to-markdown-file>"
---

# Create Langdock Assistant

Deploy a new assistant to Langdock using a markdown file containing the system prompt.

## Input Format

The user provides:
1. **Assistant name** - Display name (e.g., "Interview Analysator")
2. **Emoji** - Representative emoji (e.g., 🎙️)
3. **Markdown file path** - Path to the assistant markdown file

## Prerequisites

- `LANGDOCK_API_KEY` environment variable must be set
- The markdown file must contain a system prompt wrapped in ` ````markdown ` / ` ```` ` delimiters

## Command Template

```bash
python3 plugins/langdock-dev/tools/langdock_agent.py create \
  --name "ASSISTANT_NAME" \
  --description "Dieser Agent wird vom GenAI Team verwaltet und regelmäßig auf Basis von Feedback weiterentwickelt. Jegliche AI-Funktionalitäten unterliegen dem **Human-First/Human-Last Prinzip** und müssen vor Verwendung auf Richtigkeit geprüft werden (vor allem bei Assistenten die mit Test markiert sind). Bei Fragen oder Feedback schreiben Sie uns gerne an **team-genai@faz.de**" \
  --emoji "EMOJI" \
  --instruction "$(sed -n '/^````markdown$/,/^````$/p' PATH_TO_MARKDOWN | sed '1d;$d')"
```

## Workflow

### Step 1: Validate Input

Verify all required parameters are provided:
- Assistant name (required)
- Emoji (required)
- Markdown file path (required)

### Step 2: Verify Markdown File

Read the markdown file to confirm:
- File exists
- Contains ` ````markdown ` section with system prompt
- System prompt is not empty

### Step 3: Execute Create Command

Run the `langdock_agent.py create` command with:
- `--name`: The assistant display name
- `--description`: FAZ GenAI Team standard description (with **bold** markdown)
- `--emoji`: The selected emoji
- `--instruction`: System prompt extracted via sed

### Step 4: Report Results

Output:
- Success: Show the created agent ID
- Failure: Show the error message

## Standard Description

All FAZ GenAI assistants use this exact description:

```
Dieser Agent wird vom GenAI Team verwaltet und regelmäßig auf Basis von Feedback weiterentwickelt. Jegliche AI-Funktionalitäten unterliegen dem **Human-First/Human-Last Prinzip** und müssen vor Verwendung auf Richtigkeit geprüft werden (vor allem bei Assistenten die mit Test markiert sind). Bei Fragen oder Feedback schreiben Sie uns gerne an **team-genai@faz.de**
```

Note: The `**bold**` markdown formatting is required.

## Example Usage

```
/create-assistant "Interview Analysator" 🎙️ plugins/langdock-dev/assistants/interview-analysator.md
```

Executes:
```bash
python3 plugins/langdock-dev/tools/langdock_agent.py create \
  --name "Interview Analysator" \
  --description "Dieser Agent wird vom GenAI Team verwaltet und regelmäßig auf Basis von Feedback weiterentwickelt. Jegliche AI-Funktionalitäten unterliegen dem **Human-First/Human-Last Prinzip** und müssen vor Verwendung auf Richtigkeit geprüft werden (vor allem bei Assistenten die mit Test markiert sind). Bei Fragen oder Feedback schreiben Sie uns gerne an **team-genai@faz.de**" \
  --emoji "🎙️" \
  --instruction "$(sed -n '/^````markdown$/,/^````$/p' plugins/langdock-dev/assistants/interview-analysator.md | sed '1d;$d')"
```

## Notes

- The agent ID returned should be saved if you need to update the assistant later
- Use `langdock_agent.py update --id <agent-id>` to modify existing assistants
- Use `langdock_agent.py get --id <agent-id>` to retrieve assistant details
