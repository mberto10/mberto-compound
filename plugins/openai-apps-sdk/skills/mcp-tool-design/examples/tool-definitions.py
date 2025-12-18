"""Example MCP tool definitions for OpenAI Apps SDK (Python).

Demonstrates various tool patterns including:
- Basic tools with different parameter types
- Tools with annotations
- File handling tools
- Widget-connected tools
"""

from mcp.server.fastmcp import FastMCP
from typing import Optional
from pydantic import BaseModel

mcp = FastMCP("tool-examples")


# =============================================================================
# Basic Tools
# =============================================================================

@mcp.tool()
def search_products(query: str, limit: int = 10) -> dict:
    """Search for products in the catalog.

    Returns matching products with prices and availability.
    Use when the user wants to find or browse products.

    Args:
        query: Search query to find products
        limit: Maximum number of results to return (default: 10)
    """
    # Simulate search
    results = [
        {"id": f"prod_{i}", "name": f"Product {i}", "price": 9.99 * i}
        for i in range(1, min(limit + 1, 6))
    ]

    return {
        "structuredContent": {
            "query": query,
            "count": len(results),
            "results": results
        },
        "content": [
            {"type": "text", "text": f"Found {len(results)} products for '{query}'"}
        ]
    }


@mcp.tool()
def get_product(product_id: str) -> dict:
    """Get detailed information about a specific product.

    Args:
        product_id: The unique identifier of the product
    """
    # Simulate product lookup
    product = {
        "id": product_id,
        "name": "Example Product",
        "description": "A great product",
        "price": 29.99,
        "inStock": True,
        "category": "electronics"
    }

    return {
        "structuredContent": product,
        "content": [
            {"type": "text", "text": f"Product: {product['name']} - ${product['price']}"}
        ]
    }


# =============================================================================
# Tools with Annotations
# =============================================================================

@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "idempotentHint": True
    }
)
def get_user_profile(user_id: str) -> dict:
    """Retrieve user profile information.

    This is a read-only operation that doesn't modify any data.

    Args:
        user_id: The user's unique identifier
    """
    return {
        "structuredContent": {
            "id": user_id,
            "name": "John Doe",
            "email": "john@example.com"
        }
    }


@mcp.tool(
    annotations={
        "destructiveHint": True
    }
)
def delete_account(user_id: str, confirm: bool) -> dict:
    """Permanently delete a user account.

    WARNING: This action cannot be undone.

    Args:
        user_id: The user's unique identifier
        confirm: Must be True to confirm deletion
    """
    if not confirm:
        return {
            "structuredContent": {"error": "Deletion not confirmed"},
            "content": [{"type": "text", "text": "Please confirm deletion"}],
            "isError": True
        }

    return {
        "structuredContent": {
            "deleted": True,
            "userId": user_id
        },
        "content": [
            {"type": "text", "text": f"Account {user_id} has been deleted"}
        ]
    }


@mcp.tool(
    annotations={
        "openWorldHint": True
    }
)
def post_to_social(message: str, platform: str) -> dict:
    """Post a message to social media.

    This publishes content to external platforms.

    Args:
        message: The message to post
        platform: Target platform (twitter, facebook, linkedin)
    """
    return {
        "structuredContent": {
            "posted": True,
            "platform": platform,
            "postId": "post_12345"
        },
        "content": [
            {"type": "text", "text": f"Posted to {platform}"}
        ]
    }


# =============================================================================
# Tools with Complex Input
# =============================================================================

class OrderItem(BaseModel):
    product_id: str
    quantity: int


class CreateOrderParams(BaseModel):
    items: list[OrderItem]
    shipping_address: str
    express: bool = False


@mcp.tool()
def create_order(params: CreateOrderParams) -> dict:
    """Create a new order with multiple items.

    Args:
        params: Order parameters including items and shipping
    """
    order_id = "order_" + "12345"
    total = sum(item.quantity * 10.0 for item in params.items)

    return {
        "structuredContent": {
            "orderId": order_id,
            "items": len(params.items),
            "total": total,
            "express": params.express
        },
        "content": [
            {"type": "text", "text": f"Order {order_id} created: ${total:.2f}"}
        ]
    }


# =============================================================================
# Tools with Widget Output
# =============================================================================

@mcp.tool()
def get_dashboard() -> dict:
    """Get the user's dashboard with analytics.

    Returns a visual dashboard widget.
    """
    stats = {
        "totalOrders": 42,
        "revenue": 1234.56,
        "customers": 18,
        "products": 95
    }

    return {
        "structuredContent": {
            "summary": "Dashboard loaded",
            "highlights": ["42 orders", "$1,234.56 revenue"]
        },
        "_meta": {
            "stats": stats,  # Full data for widget only
            "charts": [...],  # Chart data for widget
            "openai/outputTemplate": "ui://widget/dashboard.html"
        }
    }


@mcp.tool()
def view_order(order_id: str) -> dict:
    """View detailed order information with visual layout.

    Args:
        order_id: The order identifier
    """
    order = {
        "id": order_id,
        "status": "shipped",
        "items": [
            {"name": "Product A", "qty": 2, "price": 19.99},
            {"name": "Product B", "qty": 1, "price": 49.99}
        ],
        "total": 89.97,
        "tracking": "1Z999AA10123456784"
    }

    return {
        "structuredContent": {
            "orderId": order_id,
            "status": order["status"],
            "total": order["total"]
        },
        "_meta": {
            "order": order,  # Full order for widget
            "openai/outputTemplate": "ui://widget/order-details.html"
        }
    }


# =============================================================================
# File Handling Tools
# =============================================================================

@mcp.tool(
    annotations={
        "openai/fileParams": ["image"]
    }
)
def analyze_image(image: dict) -> dict:
    """Analyze an uploaded image.

    Args:
        image: The uploaded image file with download_url and file_id
    """
    # In real implementation, download and process the image
    download_url = image.get("download_url")
    file_id = image.get("file_id")

    return {
        "structuredContent": {
            "analyzed": True,
            "fileId": file_id,
            "dimensions": "1920x1080",
            "format": "PNG"
        },
        "content": [
            {"type": "text", "text": "Image analyzed: 1920x1080 PNG"}
        ]
    }


# =============================================================================
# Private Tools (Widget-Only)
# =============================================================================

@mcp.tool()
def _internal_refresh(widget_id: str) -> dict:
    """Internal refresh for widget use only.

    This tool is private and not visible to the model.
    Only widgets can call it via window.openai.callTool.

    Args:
        widget_id: Widget session identifier
    """
    return {
        "structuredContent": {"refreshed": True},
        "_meta": {
            "openai/visibility": "private"
        }
    }


# =============================================================================
# Run Server
# =============================================================================

if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8000)
