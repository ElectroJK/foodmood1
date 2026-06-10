from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field

from ..auth import verify_internal_key
from ..models.personal_ranker import FEATURE_NAMES, ranker
from ..services.feedback_store import log_feedback
from ..services.ranker_training import train_personal_ranker


router = APIRouter(tags=["feedback"])
log = logging.getLogger(__name__)


class FeedbackEvent(BaseModel):
    userId: str = Field(..., min_length=1)
    recipeId: str = Field(..., min_length=1)
    action: Literal["view", "cook", "dismiss", "like"]
    canonicalTarget: Optional[str] = None
    scoreShown: Optional[float] = None
    daysToExpiry: Optional[int] = None


class FeedbackResponse(BaseModel):
    accepted: bool
    action: str


async def _refresh_ranker_background(request: Request) -> None:
    try:
        result = await train_personal_ranker()
        request.app.state.ranker_status = result
        log.info("Ranker background refresh finished after feedback: %s", result)
    except Exception as exc:
        request.app.state.ranker_status = {"status": "failed", "error": str(exc)}
        log.exception("Ranker background refresh failed")


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def post_feedback(
    event: FeedbackEvent,
    request: Request,
    background_tasks: BackgroundTasks,
):
    await log_feedback(
        user_id=event.userId,
        recipe_id=event.recipeId,
        action=event.action,
        canonical_target=event.canonicalTarget,
        score_shown=event.scoreShown,
        days_to_expiry=event.daysToExpiry,
    )
    background_tasks.add_task(_refresh_ranker_background, request)
    return FeedbackResponse(accepted=True, action=event.action)


@router.post(
    "/train/ranker",
    dependencies=[Depends(verify_internal_key)],
)
async def trigger_ranker_training():
    result = await train_personal_ranker()
    return result


@router.get(
    "/insights/ranker",
    dependencies=[Depends(verify_internal_key)],
)
async def ranker_insights():
    return {
        "fitted": ranker.fitted,
        "samplesSeen": ranker.samples_seen,
        "modelVersion": ranker.MODEL_VERSION,
        "features": FEATURE_NAMES,
    }
