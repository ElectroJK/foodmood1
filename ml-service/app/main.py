from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_client
from .models.recipe_matcher import RecipeMatcher
from .routes import feedback, health, insights, notifications, receipts, recommend, train
from .services.ranker_training import train_personal_ranker
from .services.training import retrain_pipeline


logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.matcher = RecipeMatcher()
    app.state.training_status = {
        "status": "not_started",
        "fooditems": 0,
        "recipes_indexed": 0,
        "users": 0,
        "elcs_samples": 0,
    }
    app.state.ranker_status = {"status": "not_started"}

    if settings.auto_train_on_start:
        try:
            app.state.training_status = await retrain_pipeline(app.state.matcher)
            log.info("Auto-training finished: %s", app.state.training_status)
        except Exception as exc:
            app.state.training_status = {
                "status": "failed",
                "error": str(exc),
                "fooditems": 0,
                "recipes_indexed": 0,
                "users": 0,
                "elcs_samples": 0,
            }
            log.exception("Auto-training failed; service will return 503 until trained")

        # Ranker training is independent and silent on empty feedback
        try:
            app.state.ranker_status = await train_personal_ranker()
            log.info("Ranker auto-training finished: %s", app.state.ranker_status)
        except Exception as exc:
            app.state.ranker_status = {"status": "failed", "error": str(exc)}
            log.exception("Ranker auto-training failed; will fall back to matcher score")

    try:
        yield
    finally:
        await close_client()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(recommend.router)
app.include_router(notifications.router)
app.include_router(receipts.router)
app.include_router(train.router)
app.include_router(insights.router)
app.include_router(feedback.router)