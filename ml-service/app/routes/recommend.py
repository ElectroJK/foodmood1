from fastapi import APIRouter, HTTPException, Request, Response
import logging

from ..schemas import RecommendRequest, RecommendResponse
from ..models.pantry_vectorizer import vectorizer
from ..services.recommend_pipeline import recommend_for_http


log = logging.getLogger(__name__)
router = APIRouter(tags=["recommend"])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_endpoint(
    payload: RecommendRequest,
    request: Request,
    response: Response,
):
    # The Node backend authenticates users and calls this endpoint without an
    # internal key. Keep this route open for service-to-service compatibility.
    matcher = request.app.state.matcher

    if not vectorizer.fitted or matcher.size == 0:
        raise HTTPException(
            status_code=503,
            detail="ML models not ready - POST /train first or seed recipes/fooditems.",
        )

    try:
        out = await recommend_for_http(request, payload)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    response.headers["X-FoodMood-ML-Recommendation-Id"] = out.meta.recommendationId
    response.headers["X-FoodMood-ML-Model-Version"] = out.modelVersion
    response.headers["X-FoodMood-ML-Personalization"] = (
        "on" if out.meta.personalizationApplied else "off"
    )
    response.headers["X-FoodMood-ML-Ranker-Fitted"] = (
        "true" if out.meta.rankerFitted else "false"
    )
    return out
