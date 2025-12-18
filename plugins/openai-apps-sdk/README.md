# OpenAI Apps SDK Plugin

A comprehensive Claude Code plugin for building MCP servers with the OpenAI Apps SDK. Provides skills, commands, and agents for creating ChatGPT apps with Python and TypeScript.

## Features

### Skills (8)

#### Development Skills

| Skill | Triggers | Purpose |
|-------|----------|---------|
| **mcp-server-architecture** | "create MCP server", "set up server" | Core setup, transport types, SDK patterns |
| **mcp-tool-design** | "define tool", "tool schema", "inputSchema" | Tool definitions, annotations, schemas |
| **mcp-widget-development** | "build widget", "window.openai" | HTML widgets, ChatGPT UI integration |
| **mcp-authentication** | "OAuth", "authentication", "security" | OAuth 2.1, protected resources |
| **mcp-state-management** | "widget state", "session", "persist" | State APIs, session management |
| **mcp-deployment-testing** | "deploy MCP", "test server", "ngrok" | HTTPS, testing, ChatGPT connectors |

#### UX Design Skills

| Skill | Triggers | Purpose |
|-------|----------|---------|
| **mcp-ux-brainstorming** | "brainstorm app ideas", "design ChatGPT app", "ideate widget UX" | MCP-native design thinking, concept evaluation |
| **mcp-widget-patterns** | "widget pattern", "inline card", "carousel", "fullscreen mode" | Widget pattern catalog with implementations |

### Commands (2)

| Command | Usage | Purpose |
|---------|-------|---------|
| `/openai-apps-sdk:scaffold` | `/scaffold --lang python` | Generate starter MCP server project |
| `/openai-apps-sdk:validate` | `/validate` | Check server against best practices |

### Agents (1)

| Agent | Triggers | Purpose |
|-------|----------|---------|
| **mcp-server-reviewer** | "review my MCP server" | Comprehensive code review |

## Installation

### Option 1: Clone to plugins directory

```bash
git clone <repo-url> ~/.claude/plugins/openai-apps-sdk
```

### Option 2: Local development

```bash
claude --plugin-dir /path/to/openai-apps-sdk
```

## Usage

### Get started with a new server

```
> /openai-apps-sdk:scaffold --lang python
```

This creates a minimal MCP server project with:
- Server file with example tool
- Widget template
- Configuration files
- README with setup instructions

### Validate your implementation

```
> /openai-apps-sdk:validate
```

Checks your MCP server for:
- Tool definition best practices
- Response pattern correctness
- Security issues
- Widget compliance

### Get help while developing

Ask questions that trigger skills:

```
> How do I create an MCP tool?
> How do I handle OAuth in my MCP server?
> How do I persist widget state?
```

### Brainstorm and design UX

Use the UX design skills for ideation:

```
> Help me brainstorm a ChatGPT app for my restaurant booking service
> What widget pattern should I use for showing search results?
> How should I design the user experience for my e-commerce app?
```

### Request a code review

```
> Review my MCP server and check for issues
```

## Supported Languages

- **Python** - Using FastMCP and the official Python SDK
- **TypeScript** - Using @modelcontextprotocol/sdk

## Key Documentation Sources

| Resource | URL |
|----------|-----|
| Apps SDK Docs | https://developers.openai.com/apps-sdk/ |
| Apps SDK Reference | https://developers.openai.com/apps-sdk/reference/ |
| UI Kit | https://github.com/openai/apps-sdk-ui |
| UX Principles | https://developers.openai.com/apps-sdk/concepts/ux-principles/ |
| UI Guidelines | https://developers.openai.com/apps-sdk/concepts/ui-guidelines/ |
| MCP Specification | https://modelcontextprotocol.io/specification/ |
| Python SDK | https://github.com/modelcontextprotocol/python-sdk |
| TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk |
| Examples Repo | https://github.com/openai/openai-apps-sdk-examples |

## Development

### Plugin Structure

```
openai-apps-sdk/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── mcp-server-architecture/   # Server setup & SDKs
│   ├── mcp-tool-design/           # Tool schemas & annotations
│   ├── mcp-widget-development/    # Widget HTML & window.openai
│   ├── mcp-authentication/        # OAuth & security
│   ├── mcp-state-management/      # State persistence
│   ├── mcp-deployment-testing/    # Deploy & test
│   ├── mcp-ux-brainstorming/      # UX ideation & evaluation
│   └── mcp-widget-patterns/       # Widget pattern catalog
├── commands/
│   ├── scaffold.md
│   └── validate.md
├── agents/
│   └── mcp-server-reviewer.md
└── templates/
    ├── python/
    └── typescript/
```

### Testing

Test the plugin by running Claude Code with:

```bash
claude --plugin-dir /path/to/openai-apps-sdk
```

Then test:
- Skills trigger on appropriate questions
- Commands work correctly
- Agent provides helpful reviews

## License

MIT
