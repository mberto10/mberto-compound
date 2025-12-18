# TypeScript MCP SDK Reference

## Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

Ensure `package.json` includes:
```json
{
  "type": "module"
}
```

## Basic Server Setup

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);
```

## Tool Registration

### Listing Tools

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search",
      description: "Search for items",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results" }
        },
        required: ["query"]
      }
    }
  ]
}));
```

### Handling Tool Calls

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search":
      const results = await performSearch(args.query, args.limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }]
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

## Resource Registration

### Static Resources

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "ui://widget/dashboard.html",
      name: "Dashboard Widget",
      mimeType: "text/html+skybridge"
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "ui://widget/dashboard.html") {
    return {
      contents: [{
        uri,
        mimeType: "text/html+skybridge",
        text: await fs.readFile("widgets/dashboard.html", "utf-8")
      }]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

### Inline Widget Content

```typescript
const widgetHtml = `
<!DOCTYPE html>
<html>
<head>
  <script>
    const data = window.openai.toolOutput;
    document.getElementById('content').textContent = JSON.stringify(data);
  </script>
</head>
<body>
  <div id="content"></div>
</body>
</html>
`;

server.setRequestHandler(ReadResourceRequestSchema, async (request) => ({
  contents: [{
    uri: request.params.uri,
    mimeType: "text/html+skybridge",
    text: widgetHtml
  }]
}));
```

## Apps SDK Response Pattern

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const order = await fetchOrder(request.params.arguments.orderId);

  return {
    // Model + widget see this
    structuredContent: {
      orderId: order.id,
      status: order.status,
      total: order.total
    },
    // Text content
    content: [
      { type: "text", text: `Order ${order.id}: ${order.status}` }
    ],
    // Widget-only data
    _meta: {
      orderDetails: order,
      "openai/outputTemplate": "ui://widget/order.html"
    }
  };
});
```

## Transport Setup

### Streamable HTTP

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID()
});

app.use("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, server);
});

await server.connect(transport);
app.listen(8000);
```

### SSE Transport

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

app.get("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/mcp", res);
  await server.connect(transport);
});

app.listen(8000);
```

## Using Zod for Validation

```typescript
import { z } from "zod";

const SearchParamsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(10),
  category: z.string().optional()
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search") {
    const params = SearchParamsSchema.parse(request.params.arguments);
    const results = await search(params.query, params.limit);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
});
```

## Tool Annotations

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "delete_item",
      description: "Delete an item permanently",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      },
      annotations: {
        destructiveHint: true,  // Requires confirmation
        readOnlyHint: false
      }
    },
    {
      name: "get_item",
      description: "Retrieve an item",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      },
      annotations: {
        readOnlyHint: true,  // Safe to auto-approve
        idempotentHint: true
      }
    }
  ]
}));
```

## File Handling

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "process_image",
    description: "Process an uploaded image",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "object",
          properties: {
            download_url: { type: "string" },
            file_id: { type: "string" }
          }
        }
      },
      required: ["image"]
    },
    _meta: {
      "openai/fileParams": ["image"]
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "process_image") {
    const { download_url } = request.params.arguments.image;
    const imageData = await fetch(download_url).then(r => r.arrayBuffer());
    // Process image...
    return { content: [{ type: "text", text: "Image processed" }] };
  }
});
```

## Error Handling

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await processRequest(request);
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        content: [{ type: "text", text: `Validation error: ${error.message}` }],
        isError: true
      };
    }
    throw error;  // Re-throw unexpected errors
  }
});
```

## Complete Server Example

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { z } from "zod";

const server = new Server(
  { name: "example-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "greet",
    description: "Greet a user",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"]
    }
  }]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "greet") {
    const name = request.params.arguments.name;
    return {
      structuredContent: { greeting: `Hello, ${name}!` },
      content: [{ type: "text", text: `Hello, ${name}!` }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Setup transport
const app = express();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID()
});

app.use("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, server);
});

await server.connect(transport);

app.listen(8000, () => {
  console.log("MCP server running on http://localhost:8000/mcp");
});
```

## Production Checklist

- [ ] Use TypeScript strict mode
- [ ] Validate all inputs with Zod
- [ ] Implement proper error handling
- [ ] Use environment variables for config
- [ ] Set up HTTPS (required for ChatGPT)
- [ ] Configure CORS appropriately
- [ ] Add request logging
- [ ] Implement health checks
- [ ] Set up graceful shutdown
