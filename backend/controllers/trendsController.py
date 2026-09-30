from datetime import datetime
from typing import List

from schemas import TrendItem, TrendsResponse
from services.trends_service import fetch_all_trends


async def get_trends() -> TrendsResponse:
    """Fetch trending items from all sources."""
    try:
        all_items = await fetch_all_trends()

        items: List[TrendItem] = []
        for item in all_items[:100]:
            try:
                items.append(
                    TrendItem(
                        **{
                            **item,
                            "score": item.get("score") or 0,
                            "comments": item.get("comments") or 0,
                        }
                    )
                )
            except Exception as item_error:
                print(f"Skipping invalid trend item {item.get('id')}: {item_error}")

        return TrendsResponse(items=items, fetched_at=datetime.utcnow().isoformat())
    except Exception as e:
        print(f"Error fetching trends: {e}")
        return TrendsResponse(items=[], fetched_at=datetime.utcnow().isoformat())
