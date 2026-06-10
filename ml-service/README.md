# FoodMood ML Service

FastAPI microservice for FoodMood's machine-learning layer. It provides pantry-aware recipe recommendations for the main Node.js backend and contains the first version of the waste-outcome rule mining pipeline.

The service is intentionally separated from the main backend:

- the Node.js API owns users, authentication, inventory, recipes, and frontend contracts;
- MongoDB is the shared source of truth;
- this ML service reads recipes and food-item history from MongoDB, trains lightweight models, and exposes recommendation/insight endpoints.

## Current Status

Implemented:

- FastAPI application entrypoint: `app.main:app`
- health endpoint: `GET /health`
- recommendation endpoint: `POST /recommend`
- OCR confirmation endpoint: `POST /receipts/confirm`
- protected training endpoint: `POST /train`
- protected rule-insights endpoint: `GET /insights`
- startup auto-training from MongoDB
- automatic retraining after confirmed receipt feedback
- food-only filtering for OCR-confirmed items
- TF-IDF pantry vectorizer
- recipe matcher using cosine similarity, ingredient coverage, and expiry urgency
- ingredient-priority scoring from `app/data/ingredient_priority.csv`
- feedback logging via `POST /feedback`
- Logistic Regression personal ranker trained by `POST /train`, `POST /train/ranker`, and background refresh after feedback
- eLCS-based waste rule mining scaffold
- MongoDB access through Motor

Not yet implemented:

- deep-learning or LLM-based recommendation
- persistent model artifacts
- production-grade receipt/OCR feedback storage
- large recipe corpus
- frontend UI for explaining ML scores

In other words, the current ML model is a solid explainable baseline, not a ChatGPT-like assistant.

## Architecture

```text
React Frontend
      |
      v
Node.js Backend API
      |
      |  POST /recommend
      v
FoodMood ML Service
      |
      v
MongoDB
```

The backend sends a pantry snapshot to the ML service. The ML service returns ranked recipes in the same DTO shape expected by the frontend/backend.

For offline or startup training, the ML service reads directly from MongoDB:

- `fooditems`
- `recipes`
- `users` configured but not heavily used yet

## Model Design

### 1. Pantry Vectorizer

File: `app/models/pantry_vectorizer.py`

Builds a TF-IDF vocabulary over canonicalized food names. Each user's historical food items are treated as one pantry document.

Example conceptual document:

```text
milk pasta chicken tomato onion
```

If there are no usable `FoodItem` records yet, training falls back to the recipe ingredient corpus so the recommendation service can still run in demo mode.

### 2. Recipe Matcher

File: `app/models/recipe_matcher.py`

Ranks recipes using:

- cosine similarity between pantry and recipe ingredients;
- ingredient coverage ratio;
- urgency boost for ingredients that expire soon.
- ingredient-priority boost from the user's ingredient history/priority table.

The final score is not exposed as the primary frontend metric, but it is returned in the ML response for debugging/explainability.

### 3. Personal Ranker

Files:

- `app/models/personal_ranker.py`
- `app/services/ranker_training.py`
- `app/services/ranker_rerank.py`
- `app/routes/feedback.py`

The backend sends `view`, `like`, `dismiss`, and `cook` events to `POST /feedback`.
The ML service stores those events in MongoDB and refreshes the Logistic Regression ranker in the background.
Manual training is also available through `POST /train` and `POST /train/ranker`.

### 4. OCR Food/Non-Food Classifier

File: `app/models/edibility_classifier.py`

This classifier uses character n-gram TF-IDF plus Logistic Regression to filter noisy OCR output.
The backend calls `POST /receipts/filter` before receipt items are added to the inventory.

### 5. Waste Rule Mining

File: `app/models/elcs_classifier.py`

Uses `scikit-eLCS` to mine interpretable rules from finished food-item outcomes:

- `discarded` means wasted;
- `consumed` or `shared` means saved.

This component needs real historical outcome data. It will not fit until there are enough completed `FoodItem` records.

## Data Flow

### Receipt-to-ML Flow

```text
1. User scans a receipt photo.
2. OCR extracts raw text and parsed grocery candidates.
3. The user confirms or corrects the recognized items in the UI.
4. The backend can send the confirmed OCR result to POST /receipts/confirm.
5. The ML service filters out non-food items.
6. Accepted food items are stored as receipt feedback.
7. The ML service retrains automatically if receipt feedback contains food.
8. Future recommendations can use the updated training signal.
```

Important: the ML service does not train directly from photos. It trains from structured, user-confirmed OCR output.

### Recommendation Flow

```text
1. User adds products to pantry on the website.
2. Backend stores them as FoodItem documents in MongoDB.
3. Frontend asks backend for recipe recommendations.
4. Backend loads active FoodItems for the current user.
5. Backend sends pantry snapshot to POST /recommend.
6. ML service normalizes product names.
7. ML service ranks recipes.
8. Backend returns ranked recipes to frontend.
```

### Training Flow

```text
1. ML service starts.
2. It connects to MongoDB.
3. It loads FoodItems and Recipes.
4. It fits the TF-IDF pantry vectorizer.
5. It indexes recipes.
6. If enough completed FoodItems exist, it fits the eLCS rule miner.
```

Manual retraining is available through `POST /train`.

## API

### `GET /health`

Public health and readiness endpoint.

Example response:

```json
{
  "status": "ok",
  "vectorizerFitted": true,
  "recipesIndexed": 4,
  "elcsFitted": false,
  "modelVersion": "pantry-tfidf-1.0+recipe-match-1.1+elcs-waste-0.1"
}
```

Meaning:

- `status: ok` means recommendations are ready;
- `vectorizerFitted: true` means TF-IDF training completed;
- `recipesIndexed > 0` means recipes were loaded from MongoDB;
- `elcsFitted: false` is expected until there are enough consumed/discarded/shared food items.

### `POST /recommend`

Public service-to-service endpoint used by the Node.js backend.

Request:

```json
{
  "pantry": [
    {
      "name": "Milk",
      "quantity": 1,
      "unit": "L",
      "expiryDate": "2026-05-15"
    },
    {
      "name": "Pasta",
      "quantity": 1,
      "unit": "pack",
      "expiryDate": "2026-06-01"
    }
  ],
  "limit": 5
}
```

Response:

```json
{
  "recipes": [
    {
      "id": "recipe_id",
      "name": "Creamy Chicken Pasta",
      "matchPercentage": 50,
      "cookingTime": 30,
      "servings": 4,
      "ingredients": [
        {
          "name": "Milk",
          "amount": "200ml",
          "inPantry": true
        }
      ],
      "instructions": ["Cook pasta according to package instructions"],
      "image": "https://example.com/image.jpg",
      "urgentIngredientsUsed": ["milk"],
      "score": 0.7421
    }
  ],
  "modelVersion": "pantry-tfidf-1.0+recipe-match-1.1"
}
```

### `POST /receipts/confirm`

Service-to-service endpoint for user-confirmed OCR results. It is designed for the backend to call after the user confirms the scanned receipt items.

The service accepts OCR text and parsed items, keeps only confirmed food items, stores them as training feedback, and retrains automatically when `AUTO_TRAIN_ON_RECEIPT_FEEDBACK=true`.

Request:

```json
{
  "userId": "user_id",
  "rawText": "MILK 2.5 1L 650\nTOOTHPASTE 1200\nPASTA 500G 450",
  "meanConfidence": 87,
  "parsedItems": [
    {
      "name": "Milk 2.5 1L",
      "category": "Dairy",
      "quantity": 1,
      "unit": "L",
      "price": 650,
      "expiryDate": "2026-05-15",
      "confidence": 91
    }
  ],
  "confirmedItems": [
    {
      "name": "Milk 2.5 1L",
      "category": "Dairy",
      "quantity": 1,
      "unit": "L",
      "price": 650,
      "expiryDate": "2026-05-15",
      "confidence": 91
    },
    {
      "name": "Toothpaste",
      "category": "Other",
      "quantity": 1,
      "unit": "pcs",
      "price": 1200,
      "confidence": 80
    }
  ]
}
```

Response:

```json
{
  "acceptedFoodItems": 1,
  "rejectedNonFoodItems": 1,
  "acceptedNames": ["Milk 2.5 1L"],
  "rejectedNames": ["Toothpaste"],
  "trainingTriggered": true,
  "trainingStatus": {
    "status": "ok",
    "fooditems": 5,
    "mongo_fooditems": 0,
    "receipt_feedback_items": 1,
    "recipes_indexed": 4,
    "users": 1,
    "elcs_samples": 0
  }
}
```

### `POST /train`

Protected endpoint for manual retraining.

Requires:

```text
X-Internal-Key: change-me
```

Example:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:4200/train" `
  -Headers @{ "X-Internal-Key" = "change-me" }
```

### `GET /insights`

Protected endpoint for eLCS waste rules.

Requires:

```text
X-Internal-Key: change-me
```

Example:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:4200/insights?top_n=20" `
  -Headers @{ "X-Internal-Key" = "change-me" }
```

## Local Setup

Python 3.10+ is recommended.

From the repository root:

```powershell
cd ml-service
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Set environment variables:

```powershell
$env:MONGO_URI="mongodb://localhost:27017"
$env:MONGO_DB="foodmood"
```

When running beside the existing backend `.env`, you can point ML at the same database:

```powershell
$env:MONGODB_URI=(Select-String -Path ..\foodmood-backend\api\.env -Pattern '^MONGODB_URI=').Line.Split('=',2)[1]
```

Run the service:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 4200
```

Open:

```text
http://localhost:4200/health
```

## Environment Variables

Defined in `app/config.py`.

| Variable | Default | Description |
|---|---:|---|
| `APP_NAME` | `FoodMood ML Service` | FastAPI title |
| `HOST` | `0.0.0.0` | Runtime host |
| `PORT` | `4200` | Runtime port |
| `LOG_LEVEL` | `INFO` | Logging level |
| `MONGO_URI` | `mongodb://mongo:27017` | MongoDB server URI |
| `MONGODB_URI` | unset | Optional alias matching the Node backend `.env`; takes precedence over `MONGO_URI` |
| `MONGO_DB` | `foodmood` | Database name |
| `FOODITEMS_COLLECTION` | `fooditems` | FoodItem collection |
| `RECIPES_COLLECTION` | `recipes` | Recipe collection |
| `USERS_COLLECTION` | `users` | User collection |
| `INTERNAL_API_KEY` | `change-me` | Key for protected endpoints |
| `RECEIPT_FEEDBACK_PATH` | `/app/data/receipt_feedback.jsonl` | Confirmed OCR feedback storage |
| `AUTO_TRAIN_ON_START` | `true` | Train during app startup |
| `AUTO_TRAIN_ON_RECEIPT_FEEDBACK` | `true` | Retrain after confirmed receipt food feedback |
| `TFIDF_MAX_FEATURES` | `3000` | TF-IDF max vocabulary size |
| `TFIDF_NGRAM_MAX` | `2` | Maximum n-gram size |
| `URGENT_WINDOW_DAYS` | `3` | Expiry urgency threshold |
| `SOON_WINDOW_DAYS` | `7` | Reserved for broader expiry windows |

## Backend Integration

The Node.js backend should point to this service through:

```text
ML_SERVICE_URL=http://localhost:4200
```

The existing backend contract is:

```text
POST {ML_SERVICE_URL}/recommend
```

The backend already falls back to a rule-based recommender if this service is unavailable or returns an error.

## How to Verify That ML Works

1. Start MongoDB.
2. Seed recipes from the backend API project.
3. Start this ML service.
4. Open `GET /health`.
5. Confirm:

```text
vectorizerFitted = true
recipesIndexed > 0
```

6. Send a manual recommendation request:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:4200/recommend" `
  -ContentType "application/json" `
  -Body '{"pantry":[{"name":"Milk","quantity":1,"unit":"L","expiryDate":"2026-05-15"},{"name":"Pasta","quantity":1,"unit":"pack","expiryDate":"2026-06-01"}],"limit":5}'
```

If recipes are returned, the recommendation pipeline is working.

## Known Limitations

- The current recipe seed contains only a few recipes, so recommendations are limited.
- `elcsFitted` may remain `false` until enough historical outcomes exist.
- There is no event log yet for clicked, viewed, ignored, or cooked recommendations.
- The service currently trains in memory; model persistence can be added later.
- Product normalization is dictionary-based and should be expanded with real receipt/pantry data.
- Receipt feedback is stored locally in JSONL format; production deployments should persist it in MongoDB or object storage.

## Recommended Next Steps

- Add a larger recipe dataset.
- Add a `UserEvent` collection in the backend for recommendation feedback.
- Store OCR scan history and user corrections.
- Feed waste-risk estimates into the recipe ranking score.
- Add model persistence under `data/models`.
- Add integration tests for `/health`, `/train`, and `/recommend`.
