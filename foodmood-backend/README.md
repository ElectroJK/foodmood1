# FoodMood Backend

Backend for the FoodMood diploma project — an intelligent web platform for reducing household food waste.

The system follows the microservice architecture defined in Chapter 6 of the report:

```
React Frontend (Vite, port 5173)
        │
        ▼
┌──────────────────┐        ┌───────────────────┐
│   API Gateway    │ ─────► │ OCR Microservice  │
│  (Express, 4000) │        │  (Tesseract,4100) │
└──────────────────┘        └───────────────────┘
        │
        ▼                   ┌───────────────────┐
   MongoDB (27017)          │  ML Microservice  │
                            │ (teammate, later) │
                            └───────────────────┘
```

## Stack

| Layer        | Tech                                                 |
|--------------|------------------------------------------------------|
| Runtime      | Node.js 20 LTS                                       |
| API server   | Express 4, JWT, Zod, Helmet, express-rate-limit, cors|
| DB           | MongoDB 7 (Mongoose)                                 |
| OCR          | Tesseract.js (free, runs in-process — no GCP key)   |
| Image prep   | sharp                                                |
| File uploads | multer                                               |

This stack matches the technology choices justified in Chapter 7 of the diploma report (Node.js event loop, MongoDB flexible schema, JWT/OAuth2, Helmet/Zod).

## Quick start (Docker — recommended)

```bash
cp api/.env.example api/.env       # edit JWT_SECRET
cp ocr-service/.env.example ocr-service/.env

docker compose up --build
# api  → http://localhost:4000
# ocr  → http://localhost:4100
# db   → mongodb://localhost:27017/foodmood

# Seed the recipe catalogue (in another shell):
docker compose exec api npm run seed
```

## Quick start (local Node)

```bash
# 1. Start MongoDB locally (or use Atlas — paste the URI into api/.env)

# 2. OCR service
cd ocr-service
cp .env.example .env
npm install
npm run dev      # listens on :4100

# 3. API service
cd ../api
cp .env.example .env       # edit JWT_SECRET + MONGODB_URI
npm install
npm run seed     # populate recipes
npm run dev      # listens on :4000
```

Then start the frontend with `VITE_API_URL=http://localhost:4000` in its `.env`.

## API reference

All authenticated endpoints expect `Authorization: Bearer <jwt>`.

### Auth
- `POST /api/auth/register` — `{ name, email, password }` → `{ token, user }`
- `POST /api/auth/login`    — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me`       — current user
- `POST /api/auth/logout`   — no-op (stateless JWT)

### Inventory (Pantry)
- `GET    /api/inventory`              — list active items, sorted by expiry
- `POST   /api/inventory`              — create item
- `POST   /api/inventory/batch`        — create many (used after OCR)
- `PATCH  /api/inventory/:id`          — update
- `DELETE /api/inventory/:id`          — remove
- `POST   /api/inventory/:id/consume`  — mark consumed → updates stats
- `POST   /api/inventory/:id/discard`  — mark discarded
- `POST   /api/inventory/:id/share`    — mark shared → updates stats

### Recipes
- `GET  /api/recipes`              — browse all
- `GET  /api/recipes/:id`          — single recipe
- `GET  /api/recipes/recommend/me` — **expiry-aware recommendations against my pantry**
- `POST /api/recipes/recommend`    — same, but pass a custom pantry snapshot
- `POST /api/recipes/:id/use`      — cooking → consumes matching pantry items

If `ML_SERVICE_URL` is configured the recommendations are proxied to the ML
microservice. Otherwise a rule-based ranker (expiry urgency + ingredient match
+ short-cook bonus) is used. The response shape is identical either way.

### Scan
- `POST /api/scan` (multipart, field `image`) → `{ items: ScannedItem[], rawText, meanConfidence }`
  Proxies to the OCR microservice.

### Community
- `GET  /api/community?lat=&lng=&radius=` — nearby listings
- `POST /api/community`                   — create listing
- `POST /api/community/:id/claim`         — claim a listing
- `DELETE /api/community/:id`             — withdraw

### Stats / Analytics
- `GET /api/stats/me`        — current user stats (foodSavedKg, co2Offset, moneySaved, level)
- `GET /api/stats/analytics?weeks=12` — weekly aggregates + category breakdown

### Notifications
- `GET  /api/notifications`         — live expiry alerts + stored notifications
- `POST /api/notifications/:id/read` — mark stored notification read

## Frontend integration

The frontend (FoodMoodContext.tsx) currently uses `localStorage` + `setTimeout`.
Drop in `frontend-api-client/api.ts` (provided in this repo) into the React app
at `src/lib/api.ts` and replace the mock handlers in
`FoodMoodContext.tsx`, `Login.tsx`, and `Scanner.tsx` with real `api.*` calls.

See `frontend-api-client/INTEGRATION.md` for the exact diff.

## ML integration (for the ML teammate)

The expected contract is:

```
POST {ML_SERVICE_URL}/recommend
Body:    { pantry: [{ name, quantity, unit, expiryDate }], limit }
Returns: { recipes: [{ id, name, matchPercentage, cookingTime, servings,
                      ingredients: [{ name, amount, inPantry }],
                      instructions: [string], image }] }
```

`api/src/services/mlClient.js` is the only file that needs to change if the
contract evolves. The backend falls back to the rule-based recommender if the
ML service is unreachable, so the demo never breaks.
