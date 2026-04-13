import httpx
from datetime import datetime
from typing import List


async def fetch_reddit_trends() -> List[dict]:
    """Fetch trending posts from r/programming and r/technology."""
    posts = []

    for subreddit in ["programming", "technology"]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://www.reddit.com/r/{subreddit}/hot.json",
                    headers={
                        "User-Agent": "TechPulseDashboard/1.0 (compatible; educational)"
                    },
                )
                data = response.json()

                for item in data.get("data", {}).get("children", [])[:15]:
                    post = item.get("data", {})

                    title: str = post.get("title", "")
                    url: str = post.get("url", "")
                    score: int = post.get("score", 0)
                    comments: int = post.get("num_comments", 0)
                    created_utc: float = post.get("created_utc", 0)
                    subreddit_name: str = post.get("subreddit", "")

                    # Skip stickied posts and self-posts without meaningful content
                    if post.get("stickied") or post.get("is_self"):
                        continue

                    category = categorize_reddit(title, subreddit_name)

                    posts.append(
                        {
                            "id": f"reddit-{post.get('id')}",
                            "source": "reddit",
                            "title": title,
                            "url": url,
                            "score": score,
                            "comments": comments,
                            "category": category,
                            "timestamp": datetime.fromtimestamp(created_utc).isoformat(),
                        }
                    )
        except Exception:
            continue

    return posts


def categorize_reddit(title: str, subreddit: str) -> str:
    """Categorize Reddit post based on title and subreddit."""
    title_lower = title.lower()

    ai_keywords = ["ai", "llm", "gpt", "claude", "transformer", "neural", "ml", "deep learning"]
    web_keywords = ["javascript", "typescript", "react", "vue", "svelte", "nextjs", "webdev", "frontend"]
    tools_keywords = ["tool", "library", "framework", "cli", "open source"]

    text = title_lower

    if any(keyword in text for keyword in ai_keywords):
        return "ai"
    elif any(keyword in text for keyword in web_keywords):
        return "web"
    elif any(keyword in text for keyword in tools_keywords):
        return "tools"

    return "other"
