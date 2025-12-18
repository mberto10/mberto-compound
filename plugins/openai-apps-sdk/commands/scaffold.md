---
description: Generate a minimal MCP server starter project for OpenAI Apps SDK
argument-hint: [--lang python|typescript]
allowed-tools: Write, Bash(mkdir:*)
---

Create a new MCP server project for the OpenAI Apps SDK.

## Instructions

1. Parse the language argument from `$ARGUMENTS`:
   - If `--lang python` or `python` → create Python project
   - If `--lang typescript` or `typescript` or `ts` → create TypeScript project
   - If no argument or unclear → ask user which language they prefer

2. Create the project structure in the current directory:

### For Python:

Create these files:

**server.py:**
```python
#!/usr/bin/env python3
"""MCP server for OpenAI Apps SDK.

Run with: python server.py
Expose with: ngrok http 8000
"""

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")


@mcp.tool()
def hello(name: str) -> dict:
    """Say hello to someone.

    Args:
        name: The name of the person to greet
    """
    return {
        "structuredContent": {
            "greeting": f"Hello, {name}!",
            "name": name
        },
        "content": [
            {"type": "text", "text": f"Hello, {name}!"}
        ]
    }


@mcp.resource("ui://widget/main.html")
def main_widget() -> str:
    """Serve the main widget."""
    return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .card { background: #f5f5f5; padding: 16px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card" id="output">Loading...</div>
    <script>
        const data = window.openai?.toolOutput?.structuredContent;
        if (data) {
            document.getElementById('output').textContent = data.greeting || JSON.stringify(data);
        }
        window.openai?.notifyIntrinsicHeight(document.body.scrollHeight);
    </script>
</body>
</html>"""


if __name__ == "__main__":
    print("MCP server running on http://localhost:8000/mcp")
    print("Expose with: ngrok http 8000")
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8000)
```

**requirements.txt:**
```
mcp>=1.0.0
```

**.env.example:**
```
# API keys and secrets (copy to .env and fill in)
# API_KEY=your_api_key_here
```

**.gitignore:**
```
.env
__pycache__/
*.pyc
.venv/
venv/
```

**README.md:**
```markdown
# My MCP Server

MCP server for OpenAI Apps SDK.

## Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   python server.py
   ```

4. Expose with ngrok:
   ```bash
   ngrok http 8000
   ```

5. Add the ngrok URL as a ChatGPT connector.

## Tools

- `hello(name)` - Say hello to someone

## Development

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector http://localhost:8000/mcp
```
```

### For TypeScript:

Create these files:

**server.ts:**
```typescript
/**
 * MCP server for OpenAI Apps SDK.
 *
 * Run with: npx tsx server.ts
 * Expose with: ngrok http 8000
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { randomUUID } from "crypto";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "hello",
      description: "Say hello to someone",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the person to greet" }
        },
        required: ["name"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "hello") {
    const greeting = `Hello, ${args.name}!`;
    return {
      structuredContent: { greeting, name: args.name },
      content: [{ type: "text", text: greeting }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "ui://widget/main.html",
      name: "Main Widget",
      mimeType: "text/html+skybridge"
    }
  ]
}));

// Serve resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "ui://widget/main.html") {
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "text/html+skybridge",
        text: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .card { background: #f5f5f5; padding: 16px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card" id="output">Loading...</div>
    <script>
        const data = window.openai?.toolOutput?.structuredContent;
        if (data) {
            document.getElementById('output').textContent = data.greeting || JSON.stringify(data);
        }
        window.openai?.notifyIntrinsicHeight(document.body.scrollHeight);
    </script>
</body>
</html>`
      }]
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Setup Express
const app = express();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()
});

app.use("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, server);
});

await server.connect(transport);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}/mcp`);
  console.log("Expose with: ngrok http " + PORT);
});
```

**package.json:**
```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx watch server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["*.ts"]
}
```

**.env.example:**
```
# API keys and secrets (copy to .env and fill in)
# API_KEY=your_api_key_here
```

**.gitignore:**
```
.env
node_modules/
dist/
```

**README.md:**
```markdown
# My MCP Server

MCP server for OpenAI Apps SDK.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the server:
   ```bash
   npm start
   ```

3. Expose with ngrok:
   ```bash
   ngrok http 8000
   ```

4. Add the ngrok URL as a ChatGPT connector.

## Tools

- `hello(name)` - Say hello to someone

## Development

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector http://localhost:8000/mcp
```

Development mode with auto-reload:
```bash
npm run dev
```
```

3. After creating files, provide next steps:
   - How to install dependencies
   - How to run the server
   - How to test with MCP Inspector
   - How to expose with ngrok
   - How to connect to ChatGPT
