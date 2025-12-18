---
name: MCP State Management
description: This skill should be used when the user asks to "manage widget state", "persist data", "session management", "setWidgetState", "cross-turn data", "widget session ID", "remember state", or needs guidance on state persistence for OpenAI Apps SDK widgets and MCP servers.
version: 0.1.0
---

# MCP State Management for OpenAI Apps SDK

## Overview

State management enables widgets to persist data across conversation turns and tool calls. The Apps SDK provides built-in mechanisms for widget state, session tracking, and server-side state management.

## Widget State

### Saving State

Use `window.openai.setWidgetState()` to persist widget state:

```javascript
// Save current state
await window.openai.setWidgetState({
    selectedTab: 'details',
    expandedSections: ['section1', 'section2'],
    scrollPosition: 250,
    userPreferences: {
        showAdvanced: true,
        sortOrder: 'desc'
    }
});
```

### Reading Previous State

Access previous state from `toolResponseMetadata`:

```javascript
// Get previous state
const prevState = window.openai.toolResponseMetadata?.widgetState;

if (prevState) {
    // Restore UI state
    setSelectedTab(prevState.selectedTab || 'overview');
    setExpandedSections(prevState.expandedSections || []);

    // Restore scroll position
    if (prevState.scrollPosition) {
        window.scrollTo(0, prevState.scrollPosition);
    }
}
```

### State Merge Behavior

State updates are merged with existing state:

```javascript
// Initial state: { a: 1 }
await window.openai.setWidgetState({ b: 2 });
// Result: { a: 1, b: 2 }

await window.openai.setWidgetState({ a: 3 });
// Result: { a: 3, b: 2 }
```

## Session Management

### Widget Session ID

Track widget sessions with the session ID:

```javascript
const sessionId = window.openai.toolResponseMetadata?.widgetSessionId;

// Use for server-side session tracking
await window.openai.callTool('update_session', {
    sessionId: sessionId,
    action: 'viewed_product',
    productId: '12345'
});
```

### Server-Side Session State

**Python:**
```python
from collections import defaultdict

# In-memory session store (use Redis in production)
sessions = defaultdict(dict)

@mcp.tool()
def get_cart(session_id: str) -> dict:
    """Get shopping cart for session."""
    cart = sessions[session_id].get('cart', [])
    return {
        "structuredContent": {
            "itemCount": len(cart),
            "total": sum(item['price'] for item in cart)
        },
        "_meta": {
            "items": cart,
            "widgetSessionId": session_id
        }
    }

@mcp.tool()
def add_to_cart(session_id: str, product_id: str, quantity: int) -> dict:
    """Add item to cart."""
    cart = sessions[session_id].setdefault('cart', [])
    cart.append({
        "productId": product_id,
        "quantity": quantity,
        "price": get_product_price(product_id)
    })
    return {"success": True, "itemCount": len(cart)}
```

**TypeScript:**
```typescript
const sessions = new Map<string, Record<string, unknown>>();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_cart') {
    const sessionId = request.params.arguments.session_id;
    const session = sessions.get(sessionId) || {};
    const cart = (session.cart as Array<unknown>) || [];

    return {
      structuredContent: {
        itemCount: cart.length
      },
      _meta: {
        items: cart,
        widgetSessionId: sessionId
      }
    };
  }
});
```

## State Patterns

### Form State Persistence

Preserve form input across turns:

```javascript
// Widget initialization
const prevState = window.openai.toolResponseMetadata?.widgetState;

// Restore form values
document.getElementById('name').value = prevState?.formData?.name || '';
document.getElementById('email').value = prevState?.formData?.email || '';

// Save on change
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => saveFormState());
});

async function saveFormState() {
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value
    };
    await window.openai.setWidgetState({ formData });
}
```

### Navigation State

Track multi-step wizard progress:

```javascript
const state = {
    currentStep: 1,
    completedSteps: [],
    stepData: {}
};

async function goToStep(step) {
    state.completedSteps.push(state.currentStep);
    state.currentStep = step;
    await window.openai.setWidgetState(state);
    renderStep(step);
}

async function saveStepData(step, data) {
    state.stepData[step] = data;
    await window.openai.setWidgetState(state);
}
```

### Pagination State

Remember pagination position:

```javascript
let currentPage = 1;

// Restore from previous state
const prevState = window.openai.toolResponseMetadata?.widgetState;
if (prevState?.currentPage) {
    currentPage = prevState.currentPage;
}

async function goToPage(page) {
    currentPage = page;
    await window.openai.setWidgetState({ currentPage });

    // Fetch page data
    const data = await window.openai.callTool('get_items', {
        page: currentPage,
        limit: 10
    });
    renderItems(data);
}
```

## Server-Side State

### Database Persistence

**Python with SQLite:**
```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def get_db():
    conn = sqlite3.connect('app.db')
    try:
        yield conn
    finally:
        conn.close()

@mcp.tool()
def save_preference(user_id: str, key: str, value: str) -> dict:
    """Save user preference."""
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO preferences (user_id, key, value) VALUES (?, ?, ?)",
            (user_id, key, value)
        )
        conn.commit()
    return {"saved": True}

@mcp.tool()
def get_preferences(user_id: str) -> dict:
    """Get all user preferences."""
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT key, value FROM preferences WHERE user_id = ?",
            (user_id,)
        )
        prefs = dict(cursor.fetchall())
    return {"preferences": prefs}
```

### Redis State Store

**Python with Redis:**
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

@mcp.tool()
def set_session_data(session_id: str, data: dict) -> dict:
    """Store session data with expiration."""
    r.setex(
        f"session:{session_id}",
        3600,  # 1 hour TTL
        json.dumps(data)
    )
    return {"success": True}

@mcp.tool()
def get_session_data(session_id: str) -> dict:
    """Retrieve session data."""
    raw = r.get(f"session:{session_id}")
    if raw:
        return {"data": json.loads(raw)}
    return {"data": None}
```

## State Best Practices

1. **Keep widget state small** - Only store essential UI state
2. **Use server-side for business data** - Don't store sensitive data in widgets
3. **Implement state versioning** - Handle state schema changes gracefully
4. **Set appropriate TTLs** - Clean up stale sessions
5. **Handle missing state** - Always provide defaults
6. **Avoid circular references** - State must be JSON-serializable

## Additional Resources

### Reference Files

For detailed state patterns:
- **`references/state-patterns.md`** - Advanced state management patterns
- **`references/persistence-options.md`** - Database and storage options

### Example Files

Working examples in `examples/`:
- **`examples/stateful-widget.html`** - Widget with state persistence
- **`examples/session-server.py`** - Server-side session management

### Official Documentation

- Apps SDK State Management: https://developers.openai.com/apps-sdk/build/manage-state/
