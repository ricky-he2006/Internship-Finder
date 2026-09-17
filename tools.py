"""
Tool definitions: Brave Search integration.
Import TOOL_SCHEMAS and execute_tool() from here.
"""
import json
import logging
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

# ── Tool schemas (the "plugin menu" the model sees) ───────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "brave_search",
            "description": (
                "Search the live web for CURRENT, REAL internship postings. "
                "Use this tool before answering to find actual listings."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Specific search query for internship listings.",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of results to return (max 10).",
                        "default": settings.brave_result_count,
                    },
                },
                "required": ["query"],
            },
        },
    }
]


# ── Tool implementations ──────────────────────────────────────────────────────

async def brave_search(query: str, count: int = 5) -> str:
    """
    Hit the Brave Search API and return a JSON string of results.
    freshness=pm6 → past 6 months, keeps listings current.
    """
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": settings.brave_api_key,
        "User-Agent": "InternFinder/1.0",
    }
    params = {
        "q": query,
        "count": min(count, 10),
        "search_lang": "en",
        "freshness": "pm6",
    }

    try:
        async with httpx.AsyncClient(
            timeout=10,
            headers={"User-Agent": "InternFinder/1.0"},
        ) as client:
            r = await client.get(
                settings.brave_endpoint,
                headers=headers,
                params=params,
            )
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        logger.error("Brave Search HTTP error: %s", e)
        return json.dumps({
            "results": [],
            "message": f"Search service error ({e.response.status_code}). Try again.",
        })
    except httpx.TimeoutException:
        logger.error("Brave Search timed out")
        return json.dumps({
            "results": [],
            "message": "Search timed out. Try a narrower query.",
        })
    except Exception as e:
        logger.error("Brave Search unexpected error: %s", e, exc_info=True)
        return json.dumps({
            "results": [],
            "message": f"Search failed: {e}",
        })

    results = [
        {
            "title": w.get("title", ""),
            "url": w.get("url", ""),
            "description": w.get("description", ""),
        }
        for w in data.get("web", {}).get("results", [])[:count]
    ]

    if results:
        return json.dumps({"results": results})
    return json.dumps({"results": [], "message": "No results found for that query."})


# ── Dispatcher ────────────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict) -> str:
    if name == "brave_search":
        return await brave_search(
            query=args.get("query", ""),
            count=args.get("count", settings.brave_result_count),
        )
    return json.dumps({"error": f"Unknown tool: {name}"})
