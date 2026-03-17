from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

app = FastAPI(title="CarbonWise ML Service", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
rf_model = None
forecast_model = None
forecast_scaler = None

@app.on_event("startup")
def load_models():
    global rf_model, forecast_model, forecast_scaler
    try:
        rf_model = joblib.load("carbon_model.pkl")
        print("Loaded: carbon_model.pkl (Random Forest)")
    except FileNotFoundError:
        print("WARNING: carbon_model.pkl not found. Run train_models.py first.")

    try:
        forecast_model = joblib.load("forecast_model.pkl")
        forecast_scaler = joblib.load("forecast_scaler.pkl")
        print("Loaded: forecast_model.pkl + forecast_scaler.pkl")
    except FileNotFoundError:
        print("WARNING: forecast models not found. Run train_models.py first.")

class VehicleInput(BaseModel):
    engine_size: float
    cylinders: float
    fuel_consumption: float

class ForecastInput(BaseModel):
    values: List[float]

class AnomalyInput(BaseModel):
    history: List[float]
    current: float

@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": {
            "vehicle_rf": rf_model is not None,
            "forecaster": forecast_model is not None
        }
    }

@app.post("/predict-vehicle")
def predict_vehicle(data: VehicleInput):
    if data.engine_size <= 0 or data.cylinders <= 0 or data.fuel_consumption <= 0:
        raise HTTPException(400, "All values must be positive")

    if rf_model is None:
        predicted = data.fuel_consumption * 23.1 + data.engine_size * 8.5
        return {"predicted_emission": round(float(predicted), 1), "source": "physics_fallback"}

    X = pd.DataFrame([[data.engine_size, data.cylinders, data.fuel_consumption]],
                     columns=["Engine_Size", "Cylinders", "Fuel_Consumption"])
    predicted = rf_model.predict(X)[0]

    importances = dict(zip(
        ["Engine Size", "Cylinders", "Fuel Consumption"],
        [round(float(i * 100), 1) for i in rf_model.feature_importances_]
    ))

    return {
        "predicted_emission": round(float(predicted), 1),
        "source": "random_forest",
        "feature_importance": importances,
        "emission_rating": classify_emission(float(predicted))
    }

WINDOW = 14

@app.post("/forecast")
def forecast_emissions(data: ForecastInput):
    values = data.values
    if len(values) < 3:
        raise HTTPException(400, "At least 3 emission values required for forecasting")

    if forecast_model is None or forecast_scaler is None:
        return simple_linear_forecast(values)

    if len(values) < WINDOW:
        mean_val = float(np.mean(values))
        values = [mean_val] * (WINDOW - len(values)) + values

    seed = np.array(values[-WINDOW:]).reshape(-1, 1)
    seed_scaled = forecast_scaler.transform(seed).flatten()

    predictions = []
    window_buffer = list(seed_scaled)

    for _ in range(30):
        x = np.array(window_buffer[-WINDOW:]).reshape(1, -1)
        next_scaled = forecast_model.predict(x)[0]
        next_scaled = float(np.clip(next_scaled, 0, 1))
        predictions.append(next_scaled)
        window_buffer.append(next_scaled)

    predictions_array = np.array(predictions).reshape(-1, 1)
    predictions_raw = forecast_scaler.inverse_transform(predictions_array).flatten()

    today = datetime.today()
    forecast_list = []
    for i, val in enumerate(predictions_raw):
        date = (today + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        val_f = float(max(0, val))
        forecast_list.append({
            "date": date,
            "predicted": round(val_f, 2),
            "lower": round(val_f * 0.85, 2),
            "upper": round(val_f * 1.15, 2)
        })

    current_avg = float(np.mean(values[-7:])) if len(values) >= 7 else float(np.mean(values))
    future_avg = float(np.mean(predictions_raw))
    trend_pct = ((future_avg - current_avg) / current_avg * 100) if current_avg > 0 else 0

    return {
        "forecast": forecast_list,
        "trend": "increasing" if trend_pct > 2 else "decreasing" if trend_pct < -2 else "stable",
        "trend_percent": round(trend_pct, 1),
        "monthly_estimate": round(float(np.sum(predictions_raw)), 1),
        "model": "neural_network"
    }

def simple_linear_forecast(values):
    """Fallback linear trend forecast."""
    n = len(values)
    x = np.arange(n)
    slope, intercept = np.polyfit(x, values, 1)
    today = datetime.today()
    forecast_list = []
    for i in range(1, 31):
        val = float(max(0, intercept + slope * (n + i - 1)))
        forecast_list.append({
            "date": (today + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predicted": round(val, 2),
            "lower": round(val * 0.85, 2),
            "upper": round(val * 1.15, 2)
        })
    trend_pct = (slope / (float(np.mean(values)) + 1e-9)) * 100
    return {
        "forecast": forecast_list,
        "trend": "increasing" if trend_pct > 2 else "decreasing" if trend_pct < -2 else "stable",
        "trend_percent": round(float(trend_pct), 1),
        "monthly_estimate": round(sum(f["predicted"] for f in forecast_list), 1),
        "model": "linear_trend"
    }

@app.post("/detect-anomaly")
def detect_anomaly(data: AnomalyInput):
    history = data.history
    current = data.current

    if len(history) < 3:
        return {"is_anomaly": False, "z_score": 0.0, "message": "Insufficient history for anomaly detection"}

    arr = np.array(history)
    mean = float(np.mean(arr))
    std = float(np.std(arr))

    if std == 0:
        return {"is_anomaly": False, "z_score": 0.0, "mean": round(mean, 2), "message": "All historical values are identical"}

    z_score = abs((current - mean) / std)
    is_anomaly = z_score > 2.0

    severity = "low"
    if z_score > 3.0:
        severity = "high"
    elif z_score > 2.0:
        severity = "medium"

    message = ""
    if is_anomaly:
        direction = "above" if current > mean else "below"
        message = f"This emission is {z_score:.1f} standard deviations {direction} your average ({mean:.1f} kg CO₂)"
    else:
        message = f"Emission is within normal range (avg: {mean:.1f} kg CO₂)"

    return {
        "is_anomaly": is_anomaly,
        "z_score": round(z_score, 2),
        "severity": severity,
        "mean": round(mean, 2),
        "std": round(std, 2),
        "message": message
    }

def classify_emission(co2_gkm: float) -> str:
    if co2_gkm < 100:
        return "Very Low"
    elif co2_gkm < 150:
        return "Low"
    elif co2_gkm < 200:
        return "Moderate"
    elif co2_gkm < 250:
        return "High"
    else:
        return "Very High"
