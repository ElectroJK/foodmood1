from fastapi import APIRouter, Depends, Query

from ..schemas import InsightsResponse, InsightRule
from ..models.elcs_classifier import waste_classifier
from ..auth import verify_internal_key

router = APIRouter(tags=["insights"])


@router.get("/insights", response_model=InsightsResponse,
            dependencies=[Depends(verify_internal_key)])
def get_insights(top_n: int = Query(20, ge=1, le=100)):
    raw_rules = waste_classifier.extract_rules(top_n=top_n)
    rules = [
        InsightRule(
            **{
                "if": r["if"],
                "then": r["then"],
                "fitness": r["fitness"],
                "accuracy": r["accuracy"],
            }
        )
        for r in raw_rules
    ]
    return InsightsResponse(
        rules=rules,
        samplesSeen=waste_classifier.samples_seen,
        modelVersion=waste_classifier.MODEL_VERSION,
    )
