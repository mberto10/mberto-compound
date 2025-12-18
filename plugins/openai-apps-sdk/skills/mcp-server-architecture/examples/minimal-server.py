#!/usr/bin/env python3
"""Minimal MCP server for OpenAI Apps SDK.

This example demonstrates the basic structure of an MCP server
that can be used with ChatGPT apps.

Usage:
    pip install mcp
    python minimal-server.py

Then expose via ngrok:
    ngrok http 8000
"""

from mcp.server.fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("minimal-server")


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


@mcp.tool()
def add_numbers(a: float, b: float) -> dict:
    """Add two numbers together.

    Args:
        a: First number
        b: Second number
    """
    result = a + b
    return {
        "structuredContent": {
            "result": result,
            "operation": "addition",
            "operands": [a, b]
        },
        "content": [
            {"type": "text", "text": f"{a} + {b} = {result}"}
        ]
    }


@mcp.resource("ui://widget/main.html")
def main_widget() -> str:
    """Serve a simple widget that displays tool output."""
    return """<!DOCTYPE html>
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
</html>"""


if __name__ == "__main__":
    print("Starting MCP server on http://localhost:8000/mcp")
    print("Expose with: ngrok http 8000")
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8000)
