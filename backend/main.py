import asyncio
from datetime import datetime
import json
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers.hackernews import fetch_hackernews_trends
from scrapers.reddit import fetch_reddit_trends
from scrapers.dev_community import fetch_dev_community_trends
from briefing import stream_briefing

# Cargar variables de entorno desde .env
load_dotenv()


app = FastAPI(title="IntelliTrends API")

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
        dev_community_task = fetch_dev_community_trends()

        hackernews_items, reddit_items, dev_community_items = await asyncio.gather(
            hackernews_task, reddit_task, dev_community_task, return_exceptions=True
        )

        # Handle exceptions gracefully
        hackernews_items = hackernews_items if isinstance(hackernews_items, list) else []
        reddit_items = reddit_items if isinstance(reddit_items, list) else []
        dev_community_items = dev_community_items if isinstance(dev_community_items, list) else []

        # Combine and sort by score
        all_items = hackernews_items + reddit_items + dev_community_items
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
        dev_community_task = fetch_dev_community_trends()

        hackernews_items, reddit_items, dev_community_items = await asyncio.gather(
            hackernews_task, reddit_task, dev_community_task, return_exceptions=True
        )

        hackernews_items = hackernews_items if isinstance(hackernews_items, list) else []
        reddit_items = reddit_items if isinstance(reddit_items, list) else []
        dev_community_items = dev_community_items if isinstance(dev_community_items, list) else []

        all_items = hackernews_items + reddit_items + dev_community_items
        all_items.sort(key=lambda x: x["score"], reverse=True)

        # Extract top 30 titles for the briefing
        topics = [item["title"] for item in all_items[:30]]
        
        
        # Validar que hay tópicos antes de solicitar a Groq
        if not topics:
            print(f"[ERROR] No topics available from scrapers. Aborting Groq request.")
            def error_generator():
                error_response = json.dumps([{"type": "h2", "content": "Error: No trending topics available", "className": "text-lg font-bold", "style": {"color": "#ff4500"}}])
                yield f"data: {error_response}\n\n"
            return StreamingResponse(error_generator(), media_type="text/event-stream")

        # Stream the briefing
        def generate():
            for chunk in stream_briefing(topics):
                # Minificar JSON para SSE (eliminar saltos de línea)
                try:
                    parsed = json.loads(chunk)
                    minified = json.dumps(parsed, separators=(',', ':'))
                    print(f"[DEBUG] Sending minified JSON: {minified[:100]}...")
                    yield f"data: {minified}\n\n"
                except:
                    # Si no es JSON válido, enviar como está
                    yield f"data: {chunk}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        print(f"Error in briefing endpoint: {e}")
        def error_generator():
            error_response = json.dumps([{"type": "h2", "content": f"Error generating briefing", "className": "text-lg font-bold !text-reddit-red", "style": {"color": "#ff4500"}}])
            yield f"data: {error_response}\n\n"

        return StreamingResponse(error_generator(), media_type="text/event-stream")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
