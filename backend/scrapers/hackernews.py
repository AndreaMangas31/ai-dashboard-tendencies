import asyncio
import httpx
from datetime import datetime
from typing import List, Optional


async def fetch_hackernews_trends() -> List[dict]:
    """Fetch top stories from Hacker News."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                "https://hacker-news.firebaseio.com/v0/topstories.json"
            )
            story_ids = response.json()[:20]
            stories = await asyncio.gather(
                *[fetch_hackernews_story(client, story_id) for story_id in story_ids]
            )
            return [story for story in stories if story]
    except Exception:
        return []


async def fetch_hackernews_story(client: httpx.AsyncClient, story_id: int) -> Optional[dict]:
    try:
        story_response = await client.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        )
        story = story_response.json()
        if not story:
            return None
        title: str = story.get("title", "")
        url: str = story.get("url", "")
        return {
            "id": f"hn-{story_id}",
            "source": "hackernews",
            "title": title,
            "url": url or f"https://news.ycombinator.com/item?id={story_id}",
            "score": story.get("score", 0),
            "comments": story.get("descendants", 0),
            "category": categorize_hackernews(title, url),
            "timestamp": datetime.fromtimestamp(story.get("time", 0)).isoformat(),
        }
    except Exception:
        return None


def categorize_hackernews(title: str, url: str) -> str:
    """Categorize HN story based on title and URL."""
    title_lower = title.lower()
    url_lower = url.lower()

    ai_keywords = ["ai", "llm", "gpt", "claude", "transformer", "neural", "machine learning", "deep learning"]
    web_keywords = ["javascript", "typescript", "react", "vue", "svelte", "nextjs", "html", "css", "web"]
    tools_keywords = ["tool", "cli", "library", "framework", "open source", "github"]

    text = f"{title_lower} {url_lower}"

    if any(keyword in text for keyword in ai_keywords):
        return "ai"
    elif any(keyword in text for keyword in web_keywords):
        return "web"
    elif any(keyword in text for keyword in tools_keywords):
        return "tools"

    return "other"
