import asyncio
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers.hackernews import fetch_hackernews_trends
from scrapers.reddit import fetch_reddit_trends
from scrapers.producthunt import fetch_producthunt_trends
from briefing import stream_briefing

# Cargar variables de entorno desde .env
load_dotenv()


app = FastAPI(title="Tech Pulse API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrendItem(BaseModel):
    id: str
    source: str
    title: str
    url: str
    score: int
    comments: int
    category: str
    timestamp: str


class TrendsResponse(BaseModel):
    items: List[TrendItem]
    fetched_at: str


@app.get("/api/trends", response_model=TrendsResponse)
async def get_trends() -> TrendsResponse:
    """Fetch trending items from all sources."""
    try:
        # Fetch from all sources concurrently
        hackernews_task = fetch_hackernews_trends()
        reddit_task = fetch_reddit_trends()
        producthunt_task = fetch_producthunt_trends()

        hackernews_items, reddit_items, producthunt_items = await asyncio.gather(
            hackernews_task, reddit_task, producthunt_task, return_exceptions=True
        )

        # Handle exceptions gracefully
        hackernews_items = hackernews_items if isinstance(hackernews_items, list) else []
        reddit_items = reddit_items if isinstance(reddit_items, list) else []
        producthunt_items = producthunt_items if isinstance(producthunt_items, list) else []

        # Combine and sort by score
        all_items = hackernews_items + reddit_items + producthunt_items
        all_items.sort(key=lambda x: x["score"], reverse=True)

        items = [TrendItem(**item) for item in all_items[:100]]

        return TrendsResponse(items=items, fetched_at=datetime.utcnow().isoformat())
    except Exception as e:
        print(f"Error fetching trends: {e}")
        return TrendsResponse(items=[], fetched_at=datetime.utcnow().isoformat())


@app.get("/api/briefing")
async def get_briefing():
    """Stream AI-generated briefing of tech trends."""
    try:
        # First, fetch all trends to get the topics
        hackernews_task = fetch_hackernews_trends()
        reddit_task = fetch_reddit_trends()
        producthunt_task = fetch_producthunt_trends()

        hackernews_items, reddit_items, producthunt_items = await asyncio.gather(
            hackernews_task, reddit_task, producthunt_task, return_exceptions=True
        )

        hackernews_items = hackernews_items if isinstance(hackernews_items, list) else []
        reddit_items = reddit_items if isinstance(reddit_items, list) else []
        producthunt_items = producthunt_items if isinstance(producthunt_items, list) else []

        all_items = hackernews_items + reddit_items + producthunt_items
        all_items.sort(key=lambda x: x["score"], reverse=True)

        # Extract top 30 titles for the briefing
        topics = [item["title"] for item in all_items[:30]]

        # Stream the briefing
        def generate():
            for chunk in stream_briefing(topics):
                yield f"data: {chunk}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        print(f"Error in briefing endpoint: {e}")

        def error_generator():
            yield f"data: Error generating briefing: {str(e)}\n\n"

        return StreamingResponse(error_generator(), media_type="text/event-stream")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
