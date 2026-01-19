#!/usr/bin/env python3
"""
Unified Langfuse Client

Single source of truth for Langfuse API authentication and connection.
Consolidates previously scattered client code across multiple skills.

Credential Loading (in priority order):
    1. Environment variables (LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY)
    2. Project .env file (current directory)
    3. User config ~/.langfuse.env

Environment Variables:
    LANGFUSE_PUBLIC_KEY: Your Langfuse public API key (required)
    LANGFUSE_SECRET_KEY: Your Langfuse secret API key (required)
    LANGFUSE_HOST: Langfuse host URL (default: https://cloud.langfuse.com)
"""

import os
import sys
from pathlib import Path
from typing import Optional, Dict

# Singleton client instance
_client = None


def _load_env_file(filepath: Path) -> Dict[str, str]:
    """
    Load environment variables from a .env file (simple parser, no dependencies).

    Supports:
        - KEY=value
        - KEY="quoted value"
        - KEY='single quoted'
        - # comments
        - Empty lines
    """
    env_vars = {}
    if not filepath.exists():
        return env_vars

    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Parse KEY=value
                if '=' in line:
                    key, _, value = line.partition('=')
                    key = key.strip()
                    value = value.strip()
                    # Remove quotes if present
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    env_vars[key] = value
    except Exception:
        pass  # Silently ignore read errors

    return env_vars


def _is_placeholder(value: Optional[str]) -> bool:
    """Check if a value is a placeholder that should be ignored."""
    if not value:
        return True
    placeholders = [
        'your_public_key', 'your_secret_key',
        'your-public-key', 'your-secret-key',
        'pk-lf-xxx', 'sk-lf-xxx',
        'YOUR_PUBLIC_KEY', 'YOUR_SECRET_KEY',
        '<your', 'REPLACE_ME', 'TODO',
    ]
    value_lower = value.lower()
    return any(p.lower() in value_lower for p in placeholders)


def _load_credentials() -> Dict[str, str]:
    """
    Load Langfuse credentials from multiple sources.

    Priority (first found wins):
        1. Environment variables (if not placeholders)
        2. Project .env file (current directory)
        3. User config ~/.langfuse.env
    """
    # Start with environment variables (skip obvious placeholders)
    env_public = os.getenv('LANGFUSE_PUBLIC_KEY')
    env_secret = os.getenv('LANGFUSE_SECRET_KEY')

    credentials = {
        'LANGFUSE_PUBLIC_KEY': env_public if not _is_placeholder(env_public) else None,
        'LANGFUSE_SECRET_KEY': env_secret if not _is_placeholder(env_secret) else None,
        'LANGFUSE_HOST': os.getenv('LANGFUSE_HOST'),
    }

    # If valid credentials already set via env vars, return early
    if credentials['LANGFUSE_PUBLIC_KEY'] and credentials['LANGFUSE_SECRET_KEY']:
        return credentials

    # Search locations for .env files
    search_paths = [
        Path.cwd() / '.env',                    # Project .env
        Path.home() / '.langfuse.env',          # User-specific config
        Path.home() / '.env',                   # User's general .env
    ]

    for env_path in search_paths:
        env_vars = _load_env_file(env_path)

        # Fill in missing credentials from this file
        if not credentials['LANGFUSE_PUBLIC_KEY'] and 'LANGFUSE_PUBLIC_KEY' in env_vars:
            credentials['LANGFUSE_PUBLIC_KEY'] = env_vars['LANGFUSE_PUBLIC_KEY']
        if not credentials['LANGFUSE_SECRET_KEY'] and 'LANGFUSE_SECRET_KEY' in env_vars:
            credentials['LANGFUSE_SECRET_KEY'] = env_vars['LANGFUSE_SECRET_KEY']
        if not credentials['LANGFUSE_HOST'] and 'LANGFUSE_HOST' in env_vars:
            credentials['LANGFUSE_HOST'] = env_vars['LANGFUSE_HOST']

        # If we have both keys, we're done
        if credentials['LANGFUSE_PUBLIC_KEY'] and credentials['LANGFUSE_SECRET_KEY']:
            break

    return credentials


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

    # Load credentials from env vars or .env files
    credentials = _load_credentials()
    public_key = credentials['LANGFUSE_PUBLIC_KEY']
    secret_key = credentials['LANGFUSE_SECRET_KEY']
    host = credentials['LANGFUSE_HOST'] or "https://cloud.langfuse.com"

    if not public_key or not secret_key:
        print("ERROR: Missing Langfuse credentials", file=sys.stderr)
        print("", file=sys.stderr)
        print("Set credentials via:", file=sys.stderr)
        print("  1. Environment variables: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY", file=sys.stderr)
        print("  2. Project .env file (in current directory)", file=sys.stderr)
        print("  3. User config: ~/.langfuse.env", file=sys.stderr)
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
