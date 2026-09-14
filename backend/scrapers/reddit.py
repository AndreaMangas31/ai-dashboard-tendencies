import html
import re
import xml.etree.ElementTree as ET
from typing import List

import httpx

ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}
HEADERS = {
    "User-Agent": "TechPulseDashboard/1.0 (news-aggregator)",
    "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml",
}
LINK_RE = re.compile(r'<a href="([^"]+)">\[link\]</a>', re.IGNORECASE)


async def fetch_reddit_trends() -> List[dict]:
    """Fetch trending posts from r/programming and r/technology via public Atom feeds."""
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers=HEADERS) as client:
            response = await client.get(
                "https://www.reddit.com/r/programming+technology/.rss"
            )
            response.raise_for_status()
            return parse_reddit_atom(response.text)
    except Exception as e:
        print(f"Error fetching Reddit trends: {e}")
        return []


def parse_reddit_atom(xml_text: str) -> List[dict]:
    posts: List[dict] = []
    root = ET.fromstring(xml_text)

    for entry in root.findall("a:entry", ATOM_NS):
        title = html.unescape(entry.findtext("a:title", default="", namespaces=ATOM_NS)).strip()
        if not title or title.lower().startswith("announcement"):
            continue

        atom_id = entry.findtext("a:id", default="", namespaces=ATOM_NS)
        post_id = atom_id.replace("t3_", "") if atom_id else ""
        link_el = entry.find("a:link", ATOM_NS)
        comments_url = link_el.get("href") if link_el is not None else ""
        content = entry.findtext("a:content", default="", namespaces=ATOM_NS)
        link_match = LINK_RE.search(content or "")
        url = html.unescape(link_match.group(1)) if link_match else comments_url
        category_el = entry.find("a:category", ATOM_NS)
        subreddit = category_el.get("term") if category_el is not None else ""
        timestamp = entry.findtext("a:updated", default="", namespaces=ATOM_NS)

        if not post_id or not url:
            continue

        posts.append(
            {
                "id": f"reddit-{post_id}",
                "source": "reddit",
                "title": title,
                "url": url,
                "score": 0,
                "comments": 0,
                "category": categorize_reddit(title, subreddit),
                "timestamp": timestamp,
            }
        )

    return posts[:30]


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
