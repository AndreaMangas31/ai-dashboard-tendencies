import json

from fastapi.responses import StreamingResponse

from services.briefing_service import stream_briefing
from services.trends_service import fetch_all_trends


def _sse_error(message: str) -> StreamingResponse:
    def error_generator():
        error_response = json.dumps([{"type": "h2", "content": message, "className": "text-lg font-bold", "style": {"color": "#ff4500"}}])
        yield f"data: {error_response}\n\n"

    return StreamingResponse(error_generator(), media_type="text/event-stream")


async def get_briefing() -> StreamingResponse:
    """Stream AI-generated briefing of tech trends."""
    try:
        all_items = await fetch_all_trends()
        topics = [item["title"] for item in all_items[:30]]

        # Validar que hay tópicos antes de solicitar a Groq
        if not topics:
            print("[ERROR] No topics available from scrapers. Aborting Groq request.")
            return _sse_error("Error: No trending topics available")

        def generate():
            for chunk in stream_briefing(topics):
                # Minificar JSON para SSE (eliminar saltos de línea)
                try:
                    parsed = json.loads(chunk)
                    minified = json.dumps(parsed, separators=(',', ':'))
                    print(f"[DEBUG] Sending minified JSON: {minified[:100]}...")
                    yield f"data: {minified}\n\n"
                except Exception:
                    # Si no es JSON válido, enviar como está
                    yield f"data: {chunk}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        print(f"Error in briefing endpoint: {e}")
        return _sse_error("Error generating briefing")
