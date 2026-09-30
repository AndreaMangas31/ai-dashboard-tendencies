import asyncio
import html
import re
import time
import xml.etree.ElementTree as ET
from typing import List, Optional, Tuple

import httpx

ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}
HEADERS = {
    "User-Agent": "TechPulseDashboard/1.0 (news-aggregator)",
    "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml",
}
LINK_RE = re.compile(r'<a href="([^"]+)">\[link\]</a>', re.IGNORECASE)
# El JSON de Reddit está bloqueado (403). Usamos el feed Atom público.
# %2B = "+" de r/programming+technology; sin encodear, algunos runtimes lo tratan como espacio.
# Si el feed combinado falla (típico 429), caemos a r/programming solo.
FEED_URLS = [
    "https://www.reddit.com/r/programming%2Btechnology/.rss",
    "https://www.reddit.com/r/programming/.rss",
]
# Reddit da ~1 petición por ventana por IP y las IPs de Vercel son compartidas:
# guardamos la última lista buena y solo volvemos a Reddit cuando está vieja.
FRESH_SECONDS = 10 * 60
MAX_RESET_WAIT_SECONDS = 8

_last_posts: List[dict] = []
_last_fetched_at = 0.0


async def fetch_reddit_trends() -> List[dict]:
    """Fetch trending posts from public Reddit Atom feeds, falling back to the last good list."""
    global _last_posts, _last_fetched_at
    # Solo se ejecuta cuando alguien llama a /api/trends o /api/briefing; no hay un loop propio.
    if _last_posts and time.time() - _last_fetched_at < FRESH_SECONDS:
        return _last_posts
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=HEADERS) as client:
            for url in FEED_URLS:
                status, xml_text = await fetch_reddit_xml(client, url)
                # Las dos URLs comparten cupo: tras un 429 probar la otra solo gasta otra petición.
                if status == 429:
                    break
                if not xml_text:
                    continue
                posts = parse_reddit_atom(xml_text)
                if posts:
                    _last_posts, _last_fetched_at = posts, time.time()
                    return posts
    except Exception as e:
        print(f"Error fetching Reddit trends: {e}")
    return _last_posts


async def fetch_reddit_xml(client: httpx.AsyncClient, url: str) -> Tuple[int, Optional[str]]:
    response = await client.get(url)
    if response.status_code == 429:
        try:
            reset = float(response.headers.get("x-ratelimit-reset", ""))
        except ValueError:
            reset = None
        if reset is not None and reset <= MAX_RESET_WAIT_SECONDS:
            await asyncio.sleep(reset + 0.5)
            response = await client.get(url)
    if response.status_code >= 400:
        print(f"Reddit feed {url} returned {response.status_code}")
        return response.status_code, None
    if "<entry" not in response.text:
        return response.status_code, None
    return response.status_code, response.text


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
                # El Atom público no trae score ni número de comentarios.
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
