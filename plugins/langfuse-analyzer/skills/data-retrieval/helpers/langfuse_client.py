#!/usr/bin/env python3
"""
Unified Langfuse Client

Single source of truth for Langfuse API authentication and connection.
Consolidates previously scattered client code across multiple skills.

Environment Variables:
    LANGFUSE_PUBLIC_KEY: Your Langfuse public API key (required)
    LANGFUSE_SECRET_KEY: Your Langfuse secret API key (required)
    LANGFUSE_HOST: Langfuse host URL (default: https://cloud.langfuse.com)
"""

import os
import sys
from typing import Optional

# Singleton client instance
_client = None


def get_langfuse_client():
    """
    Get or create a Langfuse client instance.

    Uses singleton pattern to avoid creating multiple clients.

    Returns:
        Langfuse: Configured client instance

    Raises:
        SystemExit: If credentials are missing or client creation fails
    """
    global _client

    if _client is not None:
        return _client

    try:
        from langfuse import Langfuse
    except ImportError:
        print("ERROR: langfuse package not installed", file=sys.stderr)
        print("Install with: pip install langfuse", file=sys.stderr)
        sys.exit(1)

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

    if not public_key or not secret_key:
        print("ERROR: Missing Langfuse credentials", file=sys.stderr)
        print("Required environment variables:", file=sys.stderr)
        print("  LANGFUSE_PUBLIC_KEY", file=sys.stderr)
        print("  LANGFUSE_SECRET_KEY", file=sys.stderr)
        sys.exit(1)

    try:
        _client = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=host
        )
        return _client
    except Exception as e:
        print(f"ERROR: Failed to create Langfuse client: {e}", file=sys.stderr)
        sys.exit(1)


def test_connection() -> bool:
    """
    Test Langfuse connection by fetching a single trace.

    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        client = get_langfuse_client()
        client.api.trace.list(limit=1)
        return True
    except Exception as e:
        print(f"Connection test failed: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    if test_connection():
        print("Langfuse connection: OK")
        sys.exit(0)
    else:
        print("Langfuse connection: FAILED")
        sys.exit(1)
