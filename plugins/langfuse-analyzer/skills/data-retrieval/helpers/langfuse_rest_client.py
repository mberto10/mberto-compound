#!/usr/bin/env python3
"""
Langfuse REST API Client Helper

Bypasses SDK limitations for retrieving dataset runs and items.
The SDK's DatasetClient does not eagerly load relationships, necessitating direct API calls.
"""

import os
import sys
from typing import Any, Dict, List, Optional
import httpx

# Default timeout (seconds)
TIMEOUT = int(os.getenv("LANGFUSE_SDK_TIMEOUT", "30"))


def _get_httpx_client() -> Optional[httpx.Client]:
    """Get authenticated httpx client."""
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")

    if not public_key or not secret_key:
        print("Warning: Missing Langfuse credentials for REST client", file=sys.stderr)
        return None

    return httpx.Client(
        base_url=host,
        auth=(public_key, secret_key),
        timeout=float(TIMEOUT),
        headers={"Content-Type": "application/json"}
    )


def get_dataset_runs(dataset_name: str) -> List[Dict[str, Any]]:
    """
    List all runs for a dataset via REST API.
    GET /api/public/datasets/{name}/runs
    """
    client = _get_httpx_client()
    if not client:
        return []

    try:
        # First we need the dataset name to be URL-encoded if it contains special chars,
        # but httpx handles path params if we pass them correctly? 
        # Actually the API path is /api/public/datasets/{name}/runs
        # We should use the SDK logic or just simple string interpolation if strictly alphanumeric.
        # Safest is to just pass it.
        
        response = client.get(f"/api/public/datasets/{dataset_name}/runs")
        if response.status_code == 404:
            print(f"Dataset '{dataset_name}' not found (404)", file=sys.stderr)
            return []
            
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except Exception as e:
        print(f"Error fetching runs for dataset '{dataset_name}': {e}", file=sys.stderr)
        return []
    finally:
        client.close()


def get_dataset_run_items(dataset_id: str, run_name: str) -> List[Dict[str, Any]]:
    """
    Fetch all items for a specific dataset run.
    GET /api/public/dataset-run-items?datasetId={id}&runName={name}
    Paginates automatically.
    """
    client = _get_httpx_client()
    if not client:
        return []

    try:
        all_items = []
        page = 1
        
        while True:
            params = {
                "datasetId": dataset_id,
                "runName": run_name,
                "limit": 50,
                "page": page
            }
            
            response = client.get("/api/public/dataset-run-items", params=params)
            response.raise_for_status()
            data = response.json()
            
            items = data.get("data", [])
            if not items:
                break
                
            all_items.extend(items)
            
            meta = data.get("meta", {})
            total_pages = meta.get("totalPages", 0)
            
            if page >= total_pages or len(items) < 50:
                break
                
            page += 1
            
        return all_items
    except Exception as e:
        print(f"Error fetching run items for run '{run_name}': {e}", file=sys.stderr)
        return []
    finally:
        client.close()


def get_dataset_by_name(dataset_name: str) -> Optional[Dict[str, Any]]:
    """
    Get dataset metadata to retrieve its ID.
    GET /api/public/datasets/{name}
    """
    client = _get_httpx_client()
    if not client:
        return None

    try:
        response = client.get(f"/api/public/datasets/{dataset_name}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching dataset '{dataset_name}': {e}", file=sys.stderr)
        return None
    finally:
        client.close()


def update_dataset(dataset_name: str, **kwargs) -> Optional[Dict[str, Any]]:
    """
    Update dataset fields.
    PATCH /api/public/datasets/{name}
    """
    client = _get_httpx_client()
    if not client:
        return None
    
    try:
        payload = {}
        if "description" in kwargs:
            payload["description"] = kwargs["description"]
        if "metadata" in kwargs:
            payload["metadata"] = kwargs["metadata"]

        response = client.patch(f"/api/public/datasets/{dataset_name}", json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error patching dataset '{dataset_name}': {e}", file=sys.stderr)
        return None
    finally:
        client.close()



def get_trace(trace_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single trace by ID, including scores.
    GET /api/public/traces/{traceId}
    """
    client = _get_httpx_client()
    if not client:
        return None

    try:
        response = client.get(f"/api/public/traces/{trace_id}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching trace '{trace_id}': {e}", file=sys.stderr)
        return None
    finally:
        client.close()

