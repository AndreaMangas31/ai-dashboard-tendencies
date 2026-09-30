from fastapi import APIRouter

from controllers import briefingController, trendsController
from schemas import TrendsResponse

router = APIRouter()


async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


router.add_api_route("/api/trends", trendsController.get_trends, methods=["GET"], response_model=TrendsResponse)
router.add_api_route("/api/briefing", briefingController.get_briefing, methods=["GET"])
router.add_api_route("/health", health_check, methods=["GET"])
