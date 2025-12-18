---
name: MCP Authentication
description: This skill should be used when the user asks to "add authentication", "implement OAuth", "secure MCP server", "security schemes", "protected resources", "token handling", "user authorization", or needs guidance on implementing authentication for OpenAI Apps SDK MCP servers.
version: 0.1.0
---

# MCP Authentication for OpenAI Apps SDK

## Overview

Authentication secures MCP servers and enables user-specific data access. The Apps SDK supports OAuth 2.1 flows, protected resource metadata, and dynamic client registration for flexible authentication patterns.

## Authentication Methods

### 1. OAuth 2.1 (Recommended)

Standard OAuth flow for user authentication:

```
User → ChatGPT → Authorization Server → Token → MCP Server
```

### 2. API Key Authentication

Simple header-based authentication:

```
Authorization: Bearer <api_key>
```

### 3. Custom Authentication

Server-defined authentication schemes.

## OAuth 2.1 Implementation

### Server Configuration

**Python:**
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("secure-server")

# Define security scheme
mcp.security_scheme({
    "type": "oauth2",
    "flows": {
        "authorizationCode": {
            "authorizationUrl": "https://auth.example.com/authorize",
            "tokenUrl": "https://auth.example.com/token",
            "scopes": {
                "read": "Read access",
                "write": "Write access"
            }
        }
    }
})

@mcp.tool(security=["oauth2"])
def get_user_data() -> dict:
    """Get authenticated user's data."""
    # Access token available in request context
    return {"data": "user-specific"}
```

**TypeScript:**
```typescript
const securitySchemes = {
  oauth2: {
    type: "oauth2",
    flows: {
      authorizationCode: {
        authorizationUrl: "https://auth.example.com/authorize",
        tokenUrl: "https://auth.example.com/token",
        scopes: {
          read: "Read access",
          write: "Write access"
        }
      }
    }
  }
};
```

### Protected Resource Metadata

The MCP specification includes protected resource metadata for OAuth discovery:

```json
{
  "resource": "https://api.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["read", "write"],
  "token_endpoint_auth_methods_supported": ["client_secret_post"]
}
```

### Token Handling

Access the authorization token in tool handlers:

**Python:**
```python
from mcp.server.fastmcp import Context

@mcp.tool()
def protected_action(ctx: Context) -> dict:
    """Action requiring authentication."""
    token = ctx.authorization_token
    if not token:
        return {"error": "Authentication required"}

    # Validate token
    user = validate_and_decode_token(token)
    return {"userId": user.id}
```

**TypeScript:**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const token = request.params._meta?.authorization;

  if (!token) {
    return {
      content: [{ type: "text", text: "Authentication required" }],
      isError: true
    };
  }

  const user = await validateToken(token);
  return { /* ... */ };
});
```

## API Key Authentication

### Simple API Key

**Python:**
```python
import os

API_KEY = os.environ.get("API_KEY")

@mcp.tool()
def api_action(api_key: str) -> dict:
    """Action requiring API key."""
    if api_key != API_KEY:
        return {"error": "Invalid API key"}
    return {"success": True}
```

### Header-Based API Key

**Python:**
```python
from mcp.server.fastmcp import Context

@mcp.tool()
def secure_action(ctx: Context) -> dict:
    """Action with header authentication."""
    auth_header = ctx.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"error": "Missing authorization"}

    token = auth_header[7:]  # Remove "Bearer "
    if not validate_api_key(token):
        return {"error": "Invalid API key"}

    return {"success": True}
```

## OAuth Error Handling

Return RFC 7235 WWW-Authenticate challenges on auth failures:

```python
@mcp.tool()
def protected_tool(ctx: Context) -> dict:
    """Tool requiring OAuth."""
    if not ctx.authorization_token:
        return {
            "structuredContent": {"error": "unauthorized"},
            "_meta": {
                "mcp/www_authenticate": 'Bearer realm="example", error="invalid_token"'
            },
            "isError": True
        }

    return {"data": "..."}
```

## Client Metadata Hints

ChatGPT provides metadata hints in requests:

```python
@mcp.tool()
def localized_tool(ctx: Context) -> dict:
    """Tool using client hints."""
    # User's locale (BCP 47)
    locale = ctx.meta.get("openai/locale", "en-US")

    # User's approximate location (for localization only)
    location = ctx.meta.get("openai/userLocation", {})
    timezone = location.get("timezone", "UTC")

    # Anonymized subject ID (for rate limiting)
    subject = ctx.meta.get("openai/subject")

    return {"locale": locale, "timezone": timezone}
```

**Security Note:** Never use `userLocation` or `userAgent` for authorization decisions—they are hints for UX, not security.

## Security Best Practices

1. **Always use HTTPS** - Required for production
2. **Validate tokens server-side** - Never trust client assertions
3. **Use short-lived tokens** - Implement token refresh
4. **Implement rate limiting** - Use `openai/subject` for per-user limits
5. **Log authentication events** - Track failed attempts
6. **Never hardcode secrets** - Use environment variables

## Tool Security Annotations

Mark tools appropriately:

```python
@mcp.tool(
    annotations={
        "readOnlyHint": True  # Safe, read-only operation
    }
)
def view_profile() -> dict:
    """View user profile (read-only)."""
    pass

@mcp.tool(
    annotations={
        "destructiveHint": True  # Modifies/deletes data
    }
)
def delete_data() -> dict:
    """Delete user data (destructive)."""
    pass
```

## Environment Variables

Store credentials securely:

```python
import os

# OAuth configuration
OAUTH_CLIENT_ID = os.environ["OAUTH_CLIENT_ID"]
OAUTH_CLIENT_SECRET = os.environ["OAUTH_CLIENT_SECRET"]

# API keys
API_SECRET_KEY = os.environ["API_SECRET_KEY"]

# Database credentials
DATABASE_URL = os.environ["DATABASE_URL"]
```

Example `.env` file (never commit):

```
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_secret
API_SECRET_KEY=your_api_key
DATABASE_URL=postgresql://...
```

## Additional Resources

### Reference Files

For detailed OAuth patterns:
- **`references/oauth-flows.md`** - Complete OAuth 2.1 implementation guide
- **`references/security-checklist.md`** - Security best practices checklist

### Example Files

Working examples in `examples/`:
- **`examples/oauth-server.py`** - Python OAuth example
- **`examples/api-key-server.py`** - API key authentication example

### Official Documentation

- Apps SDK Authentication: https://developers.openai.com/apps-sdk/build/authenticate-users/
- OAuth 2.1 Spec: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1
