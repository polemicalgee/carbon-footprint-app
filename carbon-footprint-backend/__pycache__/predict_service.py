"""
CarbonWise ML Prediction Service v2
Ensemble: Random Forest + 1D CNN for vehicle CO2 prediction
Run: python -m uvicorn predict_service:app --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

app = FastAPI(title="CarbonWise ML Service v2", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

rf_model         = None
cnn_model        = None
cnn_scaler       = None
cnn_y_scaler     = None
ensemble_weights = None
forecast_model   = None
forecast_scaler  = None

label_encoders   = None
feature_names    = None

@app.on_event("startup")
def load_models():
    global rf_model, cnn_model, cnn_scaler, cnn_y_scaler
    global ensemble_weights, forecast_model, forecast_scaler
    global label_encoders, feature_names

    
    try:
        rf_model = joblib.load("carbon_model.pkl")
        print("✅ Loaded: Random Forest (carbon_model.pkl)")
    except FileNotFoundError:
        print("⚠️  carbon_model.pkl not found — run train_models.py first")

    
    try:
        cnn_model    = joblib.load("cnn_model.pkl")
        cnn_scaler   = joblib.load("cnn_scaler.pkl")
        cnn_y_scaler = joblib.load("cnn_y_scaler.pkl")
        print("✅ Loaded: 1D CNN (cnn_model.pkl)")
    except FileNotFoundError:
        print("⚠️  CNN model not found — run train_models.py first")

    
    try:
        ensemble_weights = joblib.load("ensemble_weights.pkl")
        print(f"✅ Ensemble weights — RF: {ensemble_weights['rf']:.3f}, CNN: {ensemble_weights['cnn']:.3f}")
    except FileNotFoundError:
        ensemble_weights = {'rf': 0.5, 'cnn': 0.5}
        print("⚠️  Using equal ensemble weights (50/50)")

    
    try:
        label_encoders = joblib.load("label_encoders.pkl")
        feature_names  = joblib.load("feature_names.pkl")
        print("✅ Loaded: Label encoders + feature names")
    except FileNotFoundError:
        print("⚠️  Label encoders not found — run train_models.py first")

    
    try:
        forecast_model  = joblib.load("forecast_model.pkl")
        forecast_scaler = joblib.load("forecast_scaler.pkl")
        print("✅ Loaded: Forecast model (forecast_model.pkl)")
    except FileNotFoundError:
        print("⚠️  Forecast model not found — run train_models.py first")


class VehicleInput(BaseModel):
    engine_size: float
    vehicle_type: str = 'Car'
    fuel_type: str = 'Petrol'
    road_type: str = 'City'
    traffic: str = 'Moderate'
    speed: float = 50.0
    acceleration: float = 2.0
    age: float = 5.0
    mileage: float = 50000.0
    temperature: float = 20.0
    humidity: float = 60.0
    wind_speed: float = 10.0
    air_pressure: float = 1013.0
    
    cylinders: float = 4.0
    fuel_consumption: float = 8.0

class ForecastInput(BaseModel):
    values: List[float]

class AnomalyInput(BaseModel):
    history: List[float]
    current: float


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "random_forest": rf_model is not None,
            "cnn_1d":        cnn_model is not None,
            "ensemble":      ensemble_weights is not None,
            "forecaster":    forecast_model is not None
        },
        "ensemble_weights": ensemble_weights
    }


VEHICLE_FACTORS  = {'Car':1.0,'Motorcycle':0.7,'Bus':1.8,'Truck':2.5}
FUEL_FACTORS     = {'Petrol':1.0,'Diesel':1.12,'Hybrid':0.6,'Electric':0.25}
ROAD_FACTORS     = {'Highway':0.9,'City':1.15,'Rural':0.95}
TRAFFIC_FACTORS  = {'Free flow':0.88,'Moderate':1.0,'Heavy':1.18}

def build_feature_vector(data: VehicleInput):
    """Build the 13-feature input vector matching train_models.py."""
    
    def safe_encode(le, val, default=0):
        try:
            return int(le.transform([val])[0])
        except:
            return default

    if label_encoders:
        vt_enc = safe_encode(label_encoders['Vehicle Type'],        data.vehicle_type, 0)
        ft_enc = safe_encode(label_encoders['Fuel Type'],           data.fuel_type,    2)
        rt_enc = safe_encode(label_encoders['Road Type'],           data.road_type,    0)
        tc_enc = safe_encode(label_encoders['Traffic Conditions'],  data.traffic,      1)
    else:
        vt_enc, ft_enc, rt_enc, tc_enc = 0, 2, 0, 1

    return np.array([[
        data.engine_size,
        data.age,
        data.mileage,
        data.speed,
        data.acceleration,
        data.temperature,
        data.humidity,
        data.wind_speed,
        data.air_pressure,
        vt_enc, ft_enc, rt_enc, tc_enc
    ]])

def physics_fallback(data: VehicleInput) -> float:
    """Physics-based CO2 when no models are loaded."""
    vf = VEHICLE_FACTORS.get(data.vehicle_type, 1.0)
    ff = FUEL_FACTORS.get(data.fuel_type, 1.0)
    rf = ROAD_FACTORS.get(data.road_type, 1.0)
    tf = TRAFFIC_FACTORS.get(data.traffic, 1.0)
    return float(np.clip(data.engine_size * 45 * vf * ff * rf * tf + data.speed * 0.8, 15, 650))


@app.post("/predict-vehicle")
def predict_vehicle(data: VehicleInput):
    if data.engine_size <= 0:
        raise HTTPException(400, "Engine size must be positive")

    X = build_feature_vector(data)
    predictions = {}
    weights     = {}

    
    rf_pred = None
    if rf_model:
        rf_pred = float(rf_model.predict(X)[0])
        predictions['random_forest'] = round(rf_pred, 1)
        weights['random_forest']     = ensemble_weights['rf'] if ensemble_weights else 0.5

    
    cnn_pred = None
    if cnn_model and cnn_scaler and cnn_y_scaler:
        X_scaled = cnn_scaler.transform(X)
        y_scaled = cnn_model.predict(X_scaled)
        cnn_pred = float(cnn_y_scaler.inverse_transform(y_scaled.reshape(-1, 1))[0][0])
        predictions['cnn_1d'] = round(cnn_pred, 1)
        weights['cnn_1d']     = ensemble_weights['cnn'] if ensemble_weights else 0.5

    
    if rf_pred is not None and cnn_pred is not None:
        w_rf  = ensemble_weights['rf']  if ensemble_weights else 0.5
        w_cnn = ensemble_weights['cnn'] if ensemble_weights else 0.5
        ensemble = w_rf * rf_pred + w_cnn * cnn_pred
        source   = 'rf_cnn_ensemble'

    
    elif rf_pred is not None:
        ensemble = rf_pred
        source   = 'random_forest_only'

    
    elif cnn_pred is not None:
        ensemble = cnn_pred
        source   = 'cnn_only'

    
    else:
        ensemble = physics_fallback(data)
        source   = 'physics_fallback'

    
    importances = {}
    if rf_model:
        importances = dict(zip(
            ['Engine Size', 'Cylinders', 'Fuel Consumption'],
            [round(float(i * 100), 1) for i in rf_model.feature_importances_]
        ))

    return {
        "predicted_emission":  round(float(ensemble), 1),
        "source":              source,
        "model_predictions":   predictions,
        "ensemble_weights":    weights,
        "feature_importance":  importances,
        "emission_rating":     classify_emission(float(ensemble)),
        "agreement":           get_agreement(rf_pred, cnn_pred)
    }


WINDOW = 14

@app.post("/forecast")
def forecast_emissions(data: ForecastInput):
    values = data.values
    if len(values) < 3:
        raise HTTPException(400, "At least 3 data points required")

    if forecast_model is None or forecast_scaler is None:
        return simple_linear_forecast(values)

    if len(values) < WINDOW:
        mean_val = float(np.mean(values))
        values   = [mean_val] * (WINDOW - len(values)) + values

    seed        = np.array(values[-WINDOW:]).reshape(-1, 1)
    seed_scaled = forecast_scaler.transform(seed).flatten()

    predictions   = []
    window_buffer = list(seed_scaled)

    for _ in range(30):
        x          = np.array(window_buffer[-WINDOW:]).reshape(1, -1)
        next_s     = float(np.clip(forecast_model.predict(x)[0], 0, 1))
        predictions.append(next_s)
        window_buffer.append(next_s)

    raw = forecast_scaler.inverse_transform(
        np.array(predictions).reshape(-1, 1)
    ).flatten()

    today = datetime.today()
    forecast_list = [{
        "date":      (today + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
        "predicted": round(float(max(0, v)), 2),
        "lower":     round(float(max(0, v * 0.85)), 2),
        "upper":     round(float(v * 1.15), 2)
    } for i, v in enumerate(raw)]

    cur_avg   = float(np.mean(values[-7:])) if len(values) >= 7 else float(np.mean(values))
    fut_avg   = float(np.mean(raw))
    trend_pct = ((fut_avg - cur_avg) / cur_avg * 100) if cur_avg > 0 else 0

    return {
        "forecast":         forecast_list,
        "trend":            "increasing" if trend_pct > 2 else "decreasing" if trend_pct < -2 else "stable",
        "trend_percent":    round(trend_pct, 1),
        "monthly_estimate": round(float(np.sum(raw)), 1),
        "model":            "mlp_neural_network"
    }


@app.post("/detect-anomaly")
def detect_anomaly(data: AnomalyInput):
    if len(data.history) < 3:
        return {"is_anomaly": False, "z_score": 0.0, "message": "Insufficient history"}

    arr     = np.array(data.history)
    mean    = float(np.mean(arr))
    std     = float(np.std(arr))

    if std == 0:
        return {"is_anomaly": False, "z_score": 0.0, "mean": round(mean, 2)}

    z_score    = abs((data.current - mean) / std)
    is_anomaly = z_score > 2.0
    severity   = "high" if z_score > 3.0 else "medium" if z_score > 2.0 else "low"
    direction  = "above" if data.current > mean else "below"

    message = (
        f"Emission is {z_score:.1f} standard deviations {direction} your average ({mean:.1f} kg CO₂)"
        if is_anomaly else
        f"Emission is within normal range (avg: {mean:.1f} kg CO₂)"
    )

    return {
        "is_anomaly": is_anomaly,
        "z_score":    round(z_score, 2),
        "severity":   severity,
        "mean":       round(mean, 2),
        "std":        round(std, 2),
        "message":    message
    }


def classify_emission(co2: float) -> str:
    if co2 < 100:  return "Very Low"
    if co2 < 150:  return "Low"
    if co2 < 200:  return "Moderate"
    if co2 < 250:  return "High"
    return "Very High"

def get_agreement(rf_pred, cnn_pred):
    """How closely do the two models agree?"""
    if rf_pred is None or cnn_pred is None:
        return {"status": "single_model", "diff_pct": None}
    diff_pct = abs(rf_pred - cnn_pred) / ((rf_pred + cnn_pred) / 2) * 100
    status   = "strong" if diff_pct < 5 else "moderate" if diff_pct < 15 else "weak"
    return {"status": status, "diff_pct": round(diff_pct, 1)}

def simple_linear_forecast(values):
    n         = len(values)
    slope, intercept = np.polyfit(np.arange(n), values, 1)
    today     = datetime.today()
    fc        = [{
        "date":      (today + timedelta(days=i)).strftime("%Y-%m-%d"),
        "predicted": round(float(max(0, intercept + slope * (n + i - 1))), 2),
        "lower":     round(float(max(0, (intercept + slope * (n + i - 1)) * 0.85)), 2),
        "upper":     round(float((intercept + slope * (n + i - 1)) * 1.15), 2)
    } for i in range(1, 31)]
    trend_pct = (slope / (float(np.mean(values)) + 1e-9)) * 100
    return {
        "forecast":         fc,
        "trend":            "increasing" if trend_pct > 2 else "decreasing" if trend_pct < -2 else "stable",
        "trend_percent":    round(float(trend_pct), 1),
        "monthly_estimate": round(sum(f["predicted"] for f in fc), 1),
        "model":            "linear_trend_fallback"
    }
