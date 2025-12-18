---
name: mberto-core-setup
description: This skill should be used when the user asks to "setup mberto-core", "configure mcp servers", "setup linear api", "setup langfuse", "what environment variables do I need", or needs help configuring the MCP servers included in mberto-core.
---

# mberto-core Setup Guide

Configure the MCP servers included in the mberto-core plugin.

## Included MCP Servers

| Server | Purpose | Auth Required |
|--------|---------|---------------|
| **context7** | Up-to-date library documentation | None |
| **linear** | Linear issue tracking | `LINEAR_API_TOKEN` |
| **langfuse-docs** | Langfuse documentation | None |
| **langfuse** | Langfuse prompt management | `LANGFUSE_MCP_TOKEN` |
| **playwright** | Browser automation | None |

---

## Context7 (No Setup Required)

Context7 works out of the box. Just include "use context7" in your prompts to get up-to-date documentation for any library.

**Example usage:**
```
Create a Next.js middleware - use context7
```

---

## Linear Setup

### 1. Get API Token

1. Go to [Linear Settings](https://linear.app/settings/api)
2. Click "Personal API keys"
3. Create a new key with appropriate permissions

### 2. Set Environment Variable

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc)
export LINEAR_API_TOKEN="lin_api_xxxxxxxxxxxxx"
```

Or add to project `.env`:
```
LINEAR_API_TOKEN=lin_api_xxxxxxxxxxxxx
```

### 3. Verify

After restarting Claude Code, Linear tools should be available:
- `linear_get_issues` - List issues
- `linear_create_issue` - Create new issues
- `linear_update_issue` - Update existing issues

---

## Langfuse Docs (No Setup Required)

The Langfuse documentation server works without authentication. It provides:
- `searchLangfuseDocs` - Search documentation
- `getLangfuseDocsPage` - Get specific doc pages
- `getLangfuseOverview` - Get documentation index

---

## Langfuse Prompt Management Setup

### 1. Get API Keys

1. Go to your [Langfuse project settings](https://cloud.langfuse.com)
2. Navigate to API Keys
3. Copy your Public Key and Secret Key

### 2. Create Base64 Token

The token is `base64(publicKey:secretKey)`:

```bash
# macOS/Linux
echo -n "pk-lf-xxxxx:sk-lf-xxxxx" | base64

# Or in Python
import base64
token = base64.b64encode(b"pk-lf-xxxxx:sk-lf-xxxxx").decode()
print(token)
```

### 3. Set Environment Variable

```bash
# Add to your shell profile
export LANGFUSE_MCP_TOKEN="cGstbGYteHh4eHg6c2stbGYteHh4eHg="
```

### 4. Regional Endpoints

If using a different Langfuse region, update the URL in `.mcp.json`:

| Region | URL |
|--------|-----|
| EU (default) | `https://cloud.langfuse.com/api/public/mcp` |
| US | `https://us.cloud.langfuse.com/api/public/mcp` |
| Self-hosted | `https://your-instance.com/api/public/mcp` |

---

## Playwright (No Setup Required)

The official Microsoft Playwright MCP server enables browser automation via accessibility snapshots.

**Requirements:**
- Node.js 18 or newer

**Features:**
- Navigate to URLs
- Click elements
- Fill forms
- Take screenshots
- Extract page content

**Available tools:**
- `playwright_navigate` - Go to a URL
- `playwright_click` - Click an element
- `playwright_fill` - Fill input fields
- `playwright_screenshot` - Capture screenshot
- `playwright_evaluate` - Run JavaScript

**Headless mode:** Add `--headless` to args in `.mcp.json` if you don't want browser windows to open.

**First run:** Browser binaries are automatically downloaded on first use.

---

## Quick Setup Script

Run this to set up all environment variables at once:

```bash
# Create/edit your env file
cat >> ~/.zshrc << 'EOF'

# mberto-core MCP servers
export LINEAR_API_TOKEN="your-linear-token"
export LANGFUSE_MCP_TOKEN="your-base64-token"
EOF

# Reload shell
source ~/.zshrc
```

---

## Verifying MCP Servers

After setup, check that servers are connected:

```bash
# In Claude Code
/mcp
```

This shows all connected MCP servers and their available tools.

---

## Troubleshooting

### Server not connecting

1. Check environment variables are set: `echo $LINEAR_API_TOKEN`
2. Restart Claude Code after setting env vars
3. Check for typos in API keys

### HTTP servers failing

For `langfuse` and `langfuse-docs`:
- Ensure you have internet connectivity
- Check if the URL is accessible: `curl https://langfuse.com/api/mcp`

### npx servers failing

For `context7`, `linear`, and `playwright`:
- Ensure Node.js 18+ is installed: `node --version`
- Try clearing npx cache: `npx clear-npx-cache`

### Playwright browser issues

- First run downloads browsers automatically (~200MB)
- If download fails, run manually: `npx playwright install`
- For headless mode, add `"--headless"` to args in `.mcp.json`
