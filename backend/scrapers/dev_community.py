import httpx
from datetime import datetime
from typing import List


async def fetch_dev_community_trends() -> List[dict]:
    """Fetch trending articles from DEV Community."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch top articles from DEV Community
            response = await client.get(
                "https://dev.to/api/articles",
                params={
                    "per_page": 30,
                    "sort_by": "hot",
                }
            )
            articles = response.json()

            items = []
            for article in articles:
                title: str = article.get("title", "")
                url: str = article.get("url", "")
                positive_reactions: int = article.get("positive_reactions_count", 0)
                comments: int = article.get("comments_count", 0)
                published_at: str = article.get("published_at", "")
                tags: list = article.get("tag_list", [])

                category = categorize_dev_community(title, tags)

                items.append(
                    {
                        "id": f"dev-{article.get('id', '')}",
                        "source": "dev_community",
                        "title": title,
                        "url": url,
                        "score": positive_reactions,
                        "comments": comments,
                        "category": category,
                        "timestamp": published_at,
                    }
                )

            return items
    except Exception as e:
        print(f"Error fetching DEV Community trends: {e}")
        return []


def categorize_dev_community(title: str, tags: list) -> str:
    """Categorize DEV Community article based on title and tags."""
    title_lower = title.lower()
    tags_lower = [tag.lower() for tag in tags]

    ai_keywords = ["ai", "llm", "gpt", "claude", "transformer", "neural", "machine learning", "deep learning"]
    web_keywords = ["javascript", "typescript", "react", "vue", "svelte", "nextjs", "html", "css", "web", "frontend"]
    tools_keywords = ["tool", "cli", "library", "framework", "open source", "github", "devops"]

    text = f"{title_lower} {' '.join(tags_lower)}"

    if any(keyword in text for keyword in ai_keywords):
        return "ai"
    elif any(keyword in text for keyword in web_keywords):
        return "web"
    elif any(keyword in text for keyword in tools_keywords):
        return "tools"

    return "other"
