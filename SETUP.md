# CarbonWise v2.0 — Complete Setup Guide

## What's changed from v1
- ✅ Passwords are now hashed with bcrypt (no more plain text)
- ✅ JWT authentication — all API routes are protected
- ✅ Real distance calculation using OpenStreetMap (no fake random numbers)
- ✅ FastAPI ML service replaces fragile Python child process
- ✅ Proper Random Forest model trained on 500 realistic rows
- ✅ Neural Network (MLP) forecasting model for 30-day predictions
- ✅ Anomaly detection on every save
- ✅ Full Analytics page with charts, scope pie, and AI forecast
- ✅ GHG Scope labels (1, 2, 3) on all reports
- ✅ Working CSV + PDF export
- ✅ Protected frontend routes (no unauthenticated access)
- ✅ Dark mode across the whole app
- ✅ Emissions page (was empty before)

---

## Prerequisites
- Node.js v18+
- Python 3.9+
- Your existing Neon PostgreSQL database

---

## Step 1 — Run the database migration

Open your [Neon Console](https://console.neon.tech), go to your project's SQL editor, and run the contents of:

```
carbon-footprint-backend/migrate.sql
```

This adds a `role` column to `users` and a `scope` column to `reports`. It's safe to run on an existing database.

---

## Step 2 — Set up the backend (Node.js)

```bash
cd carbon-footprint-backend
npm install
```

Create a `.env` file in `carbon-footprint-backend/`:

```env
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=pick-a-long-random-string-here
PORT=5000
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

Start the backend:
```bash
npm run dev
# → CarbonWise API running on http://localhost:5000
```

---

## Step 3 — Set up the Python ML service

```bash
cd carbon-footprint-backend
pip install -r requirements.txt
```

Train the models (only needs to be done once):
```bash
python train_models.py
# Creates: carbon_model.pkl, forecast_model.pkl, forecast_scaler.pkl
```

Start the ML service:
```bash
uvicorn predict_service:app --port 8000 --reload
# → FastAPI ML service on http://localhost:8000
```

You can verify it's working at: http://localhost:8000/health

---

## Step 4 — Set up the frontend (React)

```bash
# From the root of the project
npm install
npm run dev
# → App running on http://localhost:5173
```

---

## Running everything together

You need **3 terminals** running simultaneously:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `carbon-footprint-backend/` | `npm run dev` |
| 2 | `carbon-footprint-backend/` | `uvicorn predict_service:app --port 8000 --reload` |
| 3 | project root | `npm run dev` |

---

## Important notes for your presentation

### The ML Service is optional at runtime
If the FastAPI service (`predict_service.py`) is not running when a prediction is requested, the backend automatically falls back to a physics-based formula. The app will never crash because of the ML service being down.

### New user accounts
Existing user accounts (created with the old plain-text password system) will NOT be able to log in after this update, because the passwords stored in the database are plain text but the new server expects bcrypt hashes. Ask existing test users to **register again** with a new account.

### JWT tokens
The frontend now stores a `token` key in localStorage (in addition to `user`). This token expires after 7 days. If a user gets a 401 error, they will be automatically redirected to the login page.

---

## Architecture Overview

```
Frontend (React/Vite :5173)
      ↓ JWT Bearer token on every request
Backend API (Express :5000)
      ↓ axios calls for AI features
ML Service (FastAPI :8000)
      ↓ loads pkl files
carbon_model.pkl          ← Random Forest (vehicle CO2 prediction)
forecast_model.pkl        ← Neural Network MLP (30-day forecasting)
forecast_scaler.pkl       ← MinMaxScaler for the forecaster
      ↓
Neon PostgreSQL (cloud)
```

---

## Troubleshooting

**"Could not connect to server"** → Make sure `npm run dev` is running in `carbon-footprint-backend/`

**"Forecast service unavailable"** → Start `uvicorn predict_service:app --port 8000` in `carbon-footprint-backend/`

**"Could not find one or both locations"** → OpenStreetMap geocoding needs recognizable place names. Use city + country, e.g. "Nairobi, Kenya" not just "home".

**CORS errors in browser** → Make sure `FRONTEND_URL` in `.env` exactly matches the URL shown in your browser (including port).

**Models not found error** → Run `python train_models.py` from inside `carbon-footprint-backend/` first.
