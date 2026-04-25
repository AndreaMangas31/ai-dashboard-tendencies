import httpx
import os
from datetime import datetime
from typing import List


async def fetch_producthunt_trends() -> List[dict]:
    """Fetch top products from Product Hunt."""
    api_key = os.environ.get("PRODUCT_HUNT_API_KEY", "")

    if not api_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = """
            {
                productsConnection(first: 20, order: TRENDING) {
                    edges {
                        node {
                            id
                            name
                            tagline
                            url
                            votesCount
                            commentsCount
                            createdAt
                            topics(first: 5) {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """

            response = await client.post(
                "https://api.producthunt.com/graphql",
                json={"query": query},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            print(f"Product Hunt API status: {response}")  # Debug: print status code

            data = response.json()
            print(f"Product Hunt API response: {data}")  # Debug: print API response
            if "errors" in data:
                return []

            products = []
            for edge in data.get("data", {}).get("productsConnection", {}).get("edges", []):
                product = edge.get("node", {})

                id_ph: str = product.get("id", "")
                name: str = product.get("name", "")
                tagline: str = product.get("tagline", "")
                url: str = product.get("url", "")
                votes: int = product.get("votesCount", 0)
                comments: int = product.get("commentsCount", 0)
                created_at: str = product.get("createdAt", "")

                topics = [
                    edge.get("node", {}).get("name", "")
                    for edge in product.get("topics", {}).get("edges", [])
                ]

                title = f"{name}: {tagline}" if tagline else name
                category = categorize_producthunt(title, topics)

                products.append(
                    {
                        "id": f"ph-{id_ph}",
                        "source": "producthunt",
                        "title": title,
                        "url": url,
                        "score": votes,
                        "comments": comments,
                        "category": category,
                        "timestamp": created_at,
                    }
                )

            return products
    except Exception:
        return []


def categorize_producthunt(title: str, topics: List[str]) -> str:
    """Categorize Product Hunt product based on title and topics."""
    title_lower = title.lower()
    topics_lower = [t.lower() for t in topics]
    all_text = f"{title_lower} {' '.join(topics_lower)}"

    ai_keywords = ["ai", "llm", "gpt", "claude", "machine learning", "neural", "agent", "deep learning"]
    web_keywords = ["javascript", "typescript", "react", "vue", "web", "frontend", "nextjs"]
    tools_keywords = ["tool", "cli", "library", "framework", "developer tools", "saas"]

    if any(keyword in all_text for keyword in ai_keywords):
        return "ai"
    elif any(keyword in all_text for keyword in web_keywords):
        return "web"
    elif any(keyword in all_text for keyword in tools_keywords):
        return "tools"

    return "other"
