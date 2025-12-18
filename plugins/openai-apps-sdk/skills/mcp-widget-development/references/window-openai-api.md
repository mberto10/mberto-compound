# window.openai API Reference

Complete reference for the ChatGPT widget runtime bridge.

## Data Properties

### toolInput

The arguments passed to the tool that triggered this widget.

```javascript
const input = window.openai.toolInput;
// Example: { query: "search term", limit: 10 }
```

### toolOutput

The complete tool response including structuredContent and _meta.

```javascript
const output = window.openai.toolOutput;

// Access structured content (model sees this)
const data = output.structuredContent;

// Access widget-only metadata
const meta = output._meta;
```

### toolResponseMetadata

Metadata about the tool response including widget state.

```javascript
const metadata = window.openai.toolResponseMetadata;

// Previous widget state
const prevState = metadata?.widgetState;

// Widget session ID
const sessionId = metadata?.widgetSessionId;
```

### theme

Current ChatGPT theme: `"light"` or `"dark"`.

```javascript
const isDark = window.openai.theme === 'dark';
```

### displayMode

Current widget display mode: `"inline"` or `"modal"`.

```javascript
const isModal = window.openai.displayMode === 'modal';
```

### locale

User's locale as BCP 47 string (e.g., `"en-US"`).

```javascript
const locale = window.openai.locale;
// Use for number/date formatting
const formatter = new Intl.NumberFormat(locale);
```

## Methods

### callTool(name, arguments)

Invoke an MCP tool from the widget. Requires the tool to have `openai/widgetAccessible: true`.

```javascript
try {
    const result = await window.openai.callTool('tool_name', {
        param1: 'value1',
        param2: 42
    });
    console.log('Tool result:', result);
} catch (error) {
    console.error('Tool call failed:', error.message);
}
```

**Returns:** Promise resolving to tool result

**Throws:** Error if tool fails or is not accessible

### setWidgetState(state)

Persist widget state across conversation turns.

```javascript
await window.openai.setWidgetState({
    selectedTab: 'details',
    scrollPosition: 150,
    expandedItems: ['item1', 'item2']
});
```

**Note:** State is merged with existing state.

### requestModal()

Request the widget be displayed in modal mode.

```javascript
await window.openai.requestModal();
```

### requestDisplayMode(mode)

Set the widget display mode.

```javascript
// Switch to modal
await window.openai.requestDisplayMode('modal');

// Switch to inline
await window.openai.requestDisplayMode('inline');
```

### notifyIntrinsicHeight(height)

Report the widget's content height for proper iframe sizing.

```javascript
// Report fixed height
window.openai.notifyIntrinsicHeight(400);

// Report dynamic height
window.openai.notifyIntrinsicHeight(document.body.scrollHeight);

// Call after content changes
function render() {
    // ... render content ...
    requestAnimationFrame(() => {
        window.openai.notifyIntrinsicHeight(document.body.scrollHeight);
    });
}
```

### uploadFile(file)

Upload a file from the widget.

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const { fileId } = await window.openai.uploadFile(file);
console.log('Uploaded file ID:', fileId);
```

**Supported types:** PNG, JPEG, WebP images

**Returns:** `{ fileId: string }`

### getFileDownloadUrl(options)

Get a temporary download URL for a file.

```javascript
const { downloadUrl } = await window.openai.getFileDownloadUrl({
    fileId: 'file_abc123'
});

// Use the URL
const response = await fetch(downloadUrl);
```

**Note:** URLs are temporary and expire.

## Events

### Ready State

The `window.openai` object is available immediately when the script runs.

```javascript
// Safe to access immediately
if (window.openai) {
    const data = window.openai.toolOutput;
    render(data);
}
```

### Theme Changes

Listen for theme changes if the user toggles dark mode:

```javascript
// Check theme on load
updateTheme(window.openai.theme);

// Re-check periodically if needed
setInterval(() => {
    updateTheme(window.openai.theme);
}, 1000);
```

## Error Handling

### Tool Call Errors

```javascript
try {
    const result = await window.openai.callTool('my_tool', params);
    handleSuccess(result);
} catch (error) {
    if (error.message.includes('not accessible')) {
        console.error('Tool not marked as widget accessible');
    } else if (error.message.includes('not found')) {
        console.error('Tool does not exist');
    } else {
        console.error('Tool call failed:', error);
    }
}
```

### Missing Data

```javascript
// Always check for existence
const data = window.openai?.toolOutput?.structuredContent;
if (!data) {
    showError('No data available');
    return;
}
```

### File Upload Errors

```javascript
try {
    const { fileId } = await window.openai.uploadFile(file);
} catch (error) {
    if (error.message.includes('file type')) {
        showError('Unsupported file type');
    } else if (error.message.includes('size')) {
        showError('File too large');
    } else {
        showError('Upload failed');
    }
}
```

## TypeScript Definitions

```typescript
interface OpenAIWidgetBridge {
    // Data
    toolInput: Record<string, unknown>;
    toolOutput: {
        structuredContent?: Record<string, unknown>;
        content?: Array<{ type: string; text?: string }>;
        _meta?: Record<string, unknown>;
    };
    toolResponseMetadata?: {
        widgetState?: Record<string, unknown>;
        widgetSessionId?: string;
    };
    theme: 'light' | 'dark';
    displayMode: 'inline' | 'modal';
    locale: string;

    // Methods
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    setWidgetState(state: Record<string, unknown>): Promise<void>;
    requestModal(): Promise<void>;
    requestDisplayMode(mode: 'inline' | 'modal'): Promise<void>;
    notifyIntrinsicHeight(height: number): void;
    uploadFile(file: File): Promise<{ fileId: string }>;
    getFileDownloadUrl(opts: { fileId: string }): Promise<{ downloadUrl: string }>;
}

declare global {
    interface Window {
        openai?: OpenAIWidgetBridge;
    }
}
```

## Best Practices

1. **Always check for window.openai** - It may not exist in testing
2. **Handle async errors** - Use try/catch with all async methods
3. **Report height changes** - Call notifyIntrinsicHeight after renders
4. **Cache tool results** - Avoid redundant tool calls
5. **Respect user theme** - Support both light and dark modes
6. **Persist important state** - Use setWidgetState for UX continuity
