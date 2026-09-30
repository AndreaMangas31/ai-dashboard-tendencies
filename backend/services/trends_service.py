import asyncio
from typing import Any, Dict, List

from scrapers.hackernews import fetch_hackernews_trends
from scrapers.reddit import fetch_reddit_trends
from scrapers.dev_community import fetch_dev_community_trends


async def fetch_all_trends() -> List[Dict[str, Any]]:
    """Fetch trends from all sources, skipping failed ones, sorted by score."""
    # Una pasada a cada fuente (sin loop). El front no llama a Reddit directamente.
    results = await asyncio.gather(
        fetch_hackernews_trends(),
        fetch_reddit_trends(),
        fetch_dev_community_trends(),
        return_exceptions=True,
    )

    all_items: List[Dict[str, Any]] = []
    for result in results:
        if isinstance(result, list):
            all_items.extend(result)

    all_items.sort(key=lambda x: x.get("score") or 0, reverse=True)
    return all_items
