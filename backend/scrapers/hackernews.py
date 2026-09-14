import asyncio
from datetime import datetime
from typing import List, Optional

import httpx

HEADERS = {"User-Agent": "TechPulseDashboard/1.0"}


async def fetch_hackernews_trends() -> List[dict]:
    """Fetch top stories from Hacker News (Algolia, Firebase fallback)."""
    items = await fetch_hackernews_algolia()
    if items:
        return items
    return await fetch_hackernews_firebase()


async def fetch_hackernews_algolia() -> List[dict]:
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers=HEADERS) as client:
            response = await client.get(
                "https://hn.algolia.com/api/v1/search",
                params={"tags": "front_page", "hitsPerPage": 20},
            )
            response.raise_for_status()
            hits = response.json().get("hits") or []
            stories = []
            for hit in hits:
                title = hit.get("title") or ""
                object_id = str(hit.get("objectID") or "")
                if not title or not object_id:
                    continue
                url = hit.get("url") or f"https://news.ycombinator.com/item?id={object_id}"
                stories.append(
                    {
                        "id": f"hn-{object_id}",
                        "source": "hackernews",
                        "title": title,
                        "url": url,
                        "score": hit.get("points") or 0,
                        "comments": hit.get("num_comments") or 0,
                        "category": categorize_hackernews(title, url),
                        "timestamp": hit.get("created_at") or datetime.utcnow().isoformat(),
                    }
                )
            return stories
    except Exception as e:
        print(f"Error fetching Hacker News (Algolia): {e}")
        return []


async def fetch_hackernews_firebase() -> List[dict]:
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers=HEADERS) as client:
            response = await client.get("https://hacker-news.firebaseio.com/v0/topstories.json")
            response.raise_for_status()
            story_ids = response.json()[:20]
            stories = await asyncio.gather(
                *[fetch_hackernews_story(client, story_id) for story_id in story_ids]
            )
            return [story for story in stories if story]
    except Exception as e:
        print(f"Error fetching Hacker News (Firebase): {e}")
        return []


async def fetch_hackernews_story(client: httpx.AsyncClient, story_id: int) -> Optional[dict]:
    try:
        story_response = await client.get(
            f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        )
        story_response.raise_for_status()
        story = story_response.json()
        if not story:
            return None
        title: str = story.get("title") or ""
        if not title:
            return None
        url: str = story.get("url") or ""
        return {
            "id": f"hn-{story_id}",
            "source": "hackernews",
            "title": title,
            "url": url or f"https://news.ycombinator.com/item?id={story_id}",
            "score": story.get("score") or 0,
            "comments": story.get("descendants") or 0,
            "category": categorize_hackernews(title, url),
            "timestamp": datetime.fromtimestamp(story.get("time") or 0).isoformat(),
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
