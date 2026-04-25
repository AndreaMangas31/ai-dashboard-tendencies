import httpx
from datetime import datetime
from typing import List


async def fetch_hackernews_trends() -> List[dict]:
    """Fetch top stories from Hacker News."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get top 30 story IDs
            response = await client.get(
                "https://hacker-news.firebaseio.com/v0/topstories.json"
            )
            story_ids = response.json()[:30]
     

            # Fetch details for each story
            stories = []
            for story_id in story_ids:
                try:
                    story_response = await client.get(
                        f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
                    )
                    story = story_response.json()
                    if story:
                        title: str = story.get("title", "")
                        url: str = story.get("url", "")
                        score: int = story.get("score", 0)
                        descendants: int = story.get("descendants", 0)
                        time: int = story.get("time", 0)

                        category = categorize_hackernews(title, url)

                        stories.append(
                            {
                                "id": f"hn-{story_id}",
                                "source": "hackernews",
                                "title": title,
                                "url": url or f"https://news.ycombinator.com/item?id={story_id}",
                                "score": score,
                                "comments": descendants,
                                "category": category,
                                "timestamp": datetime.fromtimestamp(time).isoformat(),
                            }
                        )
                except Exception:
                    continue

            return stories
    except Exception:
        return []


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
