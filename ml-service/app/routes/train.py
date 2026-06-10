from fastapi import APIRouter, Depends, Request
import logging

from ..services.training import retrain_pipeline
from ..services.ranker_training import train_personal_ranker
from ..auth import verify_internal_key

log = logging.getLogger(__name__)
router = APIRouter(tags=["train"])


@router.post("/train", dependencies=[Depends(verify_internal_key)])
async def trigger_train(request: Request):
    matcher = request.app.state.matcher
    result = await retrain_pipeline(matcher)
    request.app.state.training_status = result
    ranker_result = await train_personal_ranker()
    request.app.state.ranker_status = ranker_result
    log.info("Training finished: %s; ranker: %s", result, ranker_result)
    return {**result, "ranker": ranker_result}
