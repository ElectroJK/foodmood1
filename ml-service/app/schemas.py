from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date, datetime, time, timezone


# request contract from Node.js backend (matches mlClient.js)

class PantryItem(BaseModel):
    name: str = Field(..., min_length=1)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = None
    expiryDate: Optional[datetime] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)

    @field_validator("expiryDate", mode="before")
    @classmethod
    def parse_expiry_date(cls, value):
        if value in (None, ""):
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, date):
            return datetime.combine(value, time.min, tzinfo=timezone.utc)
        if isinstance(value, str):
            raw = value.strip()
            try:
                return datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except ValueError:
                return datetime.combine(date.fromisoformat(raw), time.min, tzinfo=timezone.utc)
        return value


class RecommendRequest(BaseModel):
    pantry: List[PantryItem] = Field(..., min_length=1)
    limit: int = Field(12, ge=1, le=50)
    userId: Optional[str] = None


# response contract returned to Node.js backend

class RecipeIngredientOut(BaseModel):
    name: str
    amount: str
    inPantry: bool


class RecipeOut(BaseModel):
    id: str
    name: str
    matchPercentage: int
    cookingTime: Optional[int] = None
    servings: Optional[int] = None
    ingredients: List[RecipeIngredientOut]
    instructions: List[str] = Field(default_factory=list)
    image: Optional[str] = None
    urgentIngredientsUsed: List[str] = Field(default_factory=list)
    score: float
    personalRank: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Personal relevance for this user (0–100). From ranker P(positive) when userId is set.",
    )
    mlInsight: Optional[str] = Field(
        default=None,
        description="Human-readable explanation of why this recipe was recommended.",
    )


class RecommendMeta(BaseModel):
    recommendationId: str
    pantryCanonicalCount: int
    urgentCanonicalCount: int
    candidatePoolSize: int
    rankerFitted: bool
    personalizationApplied: bool
    trainingLastStatus: str
    vectorizerVersion: str
    matcherVersion: str
    rankerVersion: str


class RecommendResponse(BaseModel):
    recipes: List[RecipeOut]
    modelVersion: str
    meta: RecommendMeta


class RecipeSuggestionNotification(BaseModel):
    id: str
    type: str = "recipe_suggestion"
    title: str
    body: str
    itemName: str
    canonicalName: str
    daysToExpiry: int
    recipes: List[RecipeOut]


class RecipeSuggestionNotificationsResponse(BaseModel):
    notifications: List[RecipeSuggestionNotification]
    modelVersion: str


# OCR confirmation feedback

class ReceiptItem(BaseModel):
    name: str = Field(..., min_length=1)
    category: Optional[str] = None
    quantity: Optional[float] = Field(1, ge=0)
    unit: Optional[str] = "pcs"
    price: Optional[float] = Field(0, ge=0)
    expiryDate: Optional[datetime] = None
    confidence: Optional[float] = Field(None, ge=0, le=100)

    @field_validator("expiryDate", mode="before")
    @classmethod
    def parse_expiry_date(cls, value):
        return PantryItem.parse_expiry_date(value)


class ReceiptConfirmationRequest(BaseModel):
    userId: Optional[str] = None
    rawText: Optional[str] = None
    meanConfidence: Optional[float] = Field(None, ge=0, le=100)
    parsedItems: List[ReceiptItem] = Field(default_factory=list)
    confirmedItems: List[ReceiptItem] = Field(..., min_length=1)


class ReceiptConfirmationResponse(BaseModel):
    acceptedFoodItems: int
    rejectedNonFoodItems: int
    acceptedNames: List[str]
    rejectedNames: List[str]
    trainingTriggered: bool
    trainingStatus: Optional[dict] = None


class FilteredReceiptItem(ReceiptItem):
    isFood: bool
    confidence: float


class ReceiptFilterRequest(BaseModel):
    parsedItems: List[ReceiptItem] = Field(..., min_length=1)


class ReceiptFilterResponse(BaseModel):
    filteredItems: List[FilteredReceiptItem]
    rejectedItems: List[FilteredReceiptItem]


# rule mining (eLCS)

class InsightRule(BaseModel):
    if_condition: str = Field(..., alias="if")
    then_outcome: str = Field(..., alias="then")
    fitness: float
    accuracy: float
    model_config = {"populate_by_name": True}


class InsightsResponse(BaseModel):
    rules: List[InsightRule]
    samplesSeen: int
    modelVersion: str


class HealthResponse(BaseModel):
    status: str
    vectorizerFitted: bool
    recipesIndexed: int
    elcsFitted: bool
    modelVersion: str
    rankerFitted: bool = False
    rankerSamplesSeen: int = 0
    trainingPipelineStatus: str = "unknown"
