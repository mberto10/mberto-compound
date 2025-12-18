# Python MCP SDK Reference

## Installation

```bash
pip install mcp
# With FastAPI integration
pip install "mcp[fastapi]"
```

## FastMCP Quick Start

FastMCP provides the simplest way to create MCP servers in Python:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8000)
```

## Tool Definition Patterns

### Basic Tool

```python
@mcp.tool()
def search(query: str) -> dict:
    """Search for items matching the query."""
    results = perform_search(query)
    return {"items": results, "count": len(results)}
```

### Tool with Complex Input

```python
from pydantic import BaseModel
from typing import Optional

class SearchParams(BaseModel):
    query: str
    limit: Optional[int] = 10
    category: Optional[str] = None

@mcp.tool()
def advanced_search(params: SearchParams) -> dict:
    """Perform advanced search with filters."""
    return {"results": [...]}
```

### Tool with Annotations

```python
@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "openWorldHint": False
    }
)
def get_data(id: str) -> dict:
    """Retrieve data by ID (read-only operation)."""
    return fetch_data(id)
```

## Resource Registration

Resources serve static content like HTML widgets:

```python
@mcp.resource("ui://widget/dashboard.html")
def dashboard_widget() -> str:
    """Serve the dashboard widget HTML."""
    with open("widgets/dashboard.html") as f:
        return f.read()

@mcp.resource("ui://widget/chart.html", mime_type="text/html+skybridge")
def chart_widget() -> str:
    """Serve chart widget with Apps SDK mime type."""
    return "<html>...</html>"
```

## Tool Response Patterns

### Structured Response for Apps SDK

```python
@mcp.tool()
def get_order(order_id: str) -> dict:
    """Get order details."""
    order = fetch_order(order_id)

    return {
        # Model sees this for narration
        "structuredContent": {
            "orderId": order.id,
            "status": order.status,
            "total": order.total
        },
        # Optional text content
        "content": [
            {"type": "text", "text": f"Order {order.id}: {order.status}"}
        ],
        # Widget-only data
        "_meta": {
            "orderDetails": order.to_dict(),
            "openai/outputTemplate": "ui://widget/order.html"
        }
    }
```

### Error Response

```python
@mcp.tool()
def process_payment(amount: float) -> dict:
    """Process a payment."""
    try:
        result = charge_card(amount)
        return {
            "structuredContent": {"success": True, "transactionId": result.id},
            "content": [{"type": "text", "text": "Payment processed"}]
        }
    except PaymentError as e:
        return {
            "structuredContent": {"success": False, "error": str(e)},
            "content": [{"type": "text", "text": f"Payment failed: {e}"}]
        }
```

## Transport Configuration

### Streamable HTTP

```python
mcp.run(
    transport="streamable-http",
    host="0.0.0.0",
    port=8000,
    path="/mcp"  # Optional custom path
)
```

### SSE Transport

```python
mcp.run(
    transport="sse",
    host="0.0.0.0",
    port=8000
)
```

### With FastAPI Integration

```python
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP

app = FastAPI()
mcp = FastMCP("my-server")

# Register tools
@mcp.tool()
def my_tool(param: str) -> str:
    return f"Result: {param}"

# Mount MCP on FastAPI
mcp.mount(app, path="/mcp")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Async Support

```python
@mcp.tool()
async def async_search(query: str) -> dict:
    """Async tool for I/O-bound operations."""
    results = await perform_async_search(query)
    return {"results": results}
```

## Context and State

### Accessing Request Context

```python
from mcp.server.fastmcp import Context

@mcp.tool()
def contextual_tool(query: str, ctx: Context) -> dict:
    """Tool with access to request context."""
    # Access client info, session, etc.
    return {"query": query}
```

### Server Lifespan

```python
@mcp.on_startup
async def startup():
    """Initialize resources on server start."""
    await init_database()

@mcp.on_shutdown
async def shutdown():
    """Cleanup on server stop."""
    await close_connections()
```

## File Handling

### Accepting File Uploads

```python
@mcp.tool(
    annotations={
        "openai/fileParams": ["file"]
    }
)
def process_file(file: dict) -> dict:
    """Process an uploaded file.

    file contains: download_url, file_id
    """
    content = download_file(file["download_url"])
    return {"processed": True, "size": len(content)}
```

## Debugging

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

mcp = FastMCP("my-server", debug=True)
```

### Request Logging

```python
@mcp.middleware
async def log_requests(request, call_next):
    print(f"Tool called: {request.method}")
    response = await call_next(request)
    return response
```

## Production Checklist

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (required for ChatGPT)
- [ ] Implement proper error handling
- [ ] Add request validation
- [ ] Set appropriate timeouts
- [ ] Configure CORS if needed
- [ ] Add health check endpoint
- [ ] Set up logging and monitoring
