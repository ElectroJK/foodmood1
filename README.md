# FoodMood

FoodMood is a React/Vite frontend with a Node.js/Express backend, an OCR service, and a Python FastAPI ML service.

## Ports

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- OCR service: `http://localhost:4100`
- ML service: `http://localhost:4200`
- MongoDB: `mongodb://localhost:27017/foodmood`

## Run Locally

Open four PowerShell terminals from the repository root.

Terminal 1 - frontend:

```powershell
npm run dev
```

Terminal 2 - backend:

```powershell
cd foodmood-backend\api
npm run dev
```

Terminal 3 - OCR service:

```powershell
cd foodmood-backend\ocr-service
npm start
```

Terminal 4 - ML service:

```powershell
cd ml-service
$env:MONGODB_URI=(Select-String -Path ..\foodmood-backend\api\.env -Pattern '^MONGODB_URI=').Line.Split('=',2)[1]
$env:MONGO_DB="foodmood"
$env:INTERNAL_API_KEY="local-dev-key"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 4200
```

If `.venv` is missing, create it first:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Verify ML

```powershell
Invoke-RestMethod http://localhost:4200/health
Invoke-RestMethod -Method Post http://localhost:4200/train -Headers @{ "X-Internal-Key"="local-dev-key" }
```

The backend uses ML first, then Spoonacular, then its local rule-based recommender.
