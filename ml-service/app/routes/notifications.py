from fastapi import APIRouter, Depends, HTTPException, Query, Request

from ..auth import verify_internal_key
from ..models.pantry_vectorizer import vectorizer
from ..models.personal_ranker import ranker
from ..schemas import RecipeSuggestionNotificationsResponse
from ..services.notifications import (
    build_recipe_suggestion_notifications,
    load_active_pantry,
)


router = APIRouter(tags=["notifications"])


@router.get(
    "/notifications/recipe-suggestions",
    response_model=RecipeSuggestionNotificationsResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def get_recipe_suggestions(
    request: Request,
    user_id: str = Query(..., alias="userId", min_length=1),
    items_limit: int = Query(3, alias="itemsLimit", ge=1, le=10),
    recipes_per_item: int = Query(3, alias="recipesPerItem", ge=1, le=10),
):
    matcher = request.app.state.matcher
    pantry = await load_active_pantry(user_id)

    try:
        notifications = await build_recipe_suggestion_notifications(
            matcher,
            pantry,
            user_id=user_id,
            items_limit=items_limit,
            recipes_per_item=recipes_per_item,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    ranker_tag = "ranker-on" if ranker.fitted else "ranker-cold"
    return RecipeSuggestionNotificationsResponse(
        notifications=notifications,
        modelVersion=f"{vectorizer.MODEL_VERSION}+{matcher.MODEL_VERSION}+{ranker_tag}",
    )