#!/usr/bin/env python3
"""
Local Langfuse client helper for the optimization loop plugin.

Environment variables:
  LANGFUSE_PUBLIC_KEY (required)
  LANGFUSE_SECRET_KEY (required)
  LANGFUSE_HOST (optional, defaults to cloud)
"""

import os
import sys

_CLIENT = None


def get_langfuse_client():
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT

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
        print("Required: LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY", file=sys.stderr)
        sys.exit(1)

    try:
        _CLIENT = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=host,
        )
        return _CLIENT
    except Exception as exc:
        print(f"ERROR: Failed to create Langfuse client: {exc}", file=sys.stderr)
        sys.exit(1)


def test_connection() -> bool:
    """Verify credentials and connectivity with a lightweight API call."""
    try:
        client = get_langfuse_client()
        client.api.trace.list(limit=1)
        return True
    except Exception as exc:
        print(f"Connection test failed: {exc}", file=sys.stderr)
        return False


if __name__ == "__main__":
    if test_connection():
        print("Langfuse connection: OK")
        raise SystemExit(0)
    print("Langfuse connection: FAILED")
    raise SystemExit(1)
