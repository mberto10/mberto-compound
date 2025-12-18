/**
 * Minimal MCP server for OpenAI Apps SDK (TypeScript)
 *
 * This example demonstrates the basic structure of an MCP server
 * that can be used with ChatGPT apps.
 *
 * Usage:
 *   npm install @modelcontextprotocol/sdk zod express
 *   npx tsx minimal-server.ts
 *
 * Then expose via ngrok:
 *   ngrok http 8000
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

// Create the MCP server
const server = new Server(
  { name: "minimal-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// List available tools
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
    },
    {
      name: "add_numbers",
      description: "Add two numbers together",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" }
        },
        required: ["a", "b"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "hello": {
      const greeting = `Hello, ${args.name}!`;
      return {
        structuredContent: {
          greeting,
          name: args.name
        },
        content: [{ type: "text", text: greeting }]
      };
    }

    case "add_numbers": {
      const result = args.a + args.b;
      return {
        structuredContent: {
          result,
          operation: "addition",
          operands: [args.a, args.b]
        },
        content: [{ type: "text", text: `${args.a} + ${args.b} = ${result}` }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// List available resources
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
  const { uri } = request.params;

  if (uri === "ui://widget/main.html") {
    return {
      contents: [{
        uri,
        mimeType: "text/html+skybridge",
        text: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: system-ui, sans-serif;
            padding: 16px;
            margin: 0;
        }
        .result {
            background: #f0f0f0;
            padding: 12px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="result" id="output">Loading...</div>
    <script>
        const data = window.openai?.toolOutput?.structuredContent;
        if (data) {
            document.getElementById('output').textContent = JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>`
      }]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Setup Express and transport
const app = express();

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()
});

app.use("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, server);
});

// Connect and start
await server.connect(transport);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}/mcp`);
  console.log("Expose with: ngrok http " + PORT);
});
