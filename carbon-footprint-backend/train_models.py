import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_percentage_error
import joblib
import warnings

warnings.filterwarnings("ignore")
np.random.seed(42)

print("=" * 55)
print("  CarbonWise AI Model Training")
print("=" * 55)
print("\n[1/4] Generating vehicle emissions dataset (500 rows)...")

def generate_vehicle_data(n=500):
    rows = []
    cylinder_options = [3, 4, 4, 4, 4, 6, 6, 8, 8, 10, 12]  
    for _ in range(n):
        cylinders = np.random.choice(cylinder_options)
        engine_size = round(np.clip(
            cylinders * 0.45 + np.random.normal(0, 0.3),
            1.0, 7.0
        ), 1)
        base_fuel = 1.8 * cylinders + 1.5 * engine_size
        fuel_consumption = round(np.clip(base_fuel + np.random.normal(0, 1.2), 3.5, 28.0), 1)
        co2 = round(np.clip(
            fuel_consumption * 23.1 + engine_size * 5.5 + np.random.normal(0, 8),
            80, 650
        ), 1)
        rows.append([engine_size, cylinders, fuel_consumption, co2])

    df = pd.DataFrame(rows, columns=['Engine_Size', 'Cylinders', 'Fuel_Consumption', 'CO2_Emissions'])
    return df

vehicle_df = generate_vehicle_data(500)
print(f"   Dataset created: {len(vehicle_df)} rows")
print(f"   CO2 range: {vehicle_df['CO2_Emissions'].min():.0f} – {vehicle_df['CO2_Emissions'].max():.0f} g/km")
print(f"   Fuel range: {vehicle_df['Fuel_Consumption'].min():.1f} – {vehicle_df['Fuel_Consumption'].max():.1f} L/100km")

print("\n[2/4] Training Random Forest vehicle model...")

X = vehicle_df[['Engine_Size', 'Cylinders', 'Fuel_Consumption']]
y = vehicle_df['CO2_Emissions']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
r2 = r2_score(y_test, y_pred)
mape = mean_absolute_percentage_error(y_test, y_pred) * 100

print(f"   R² Score:  {r2:.4f}  (target: ≥ 0.90)")
print(f"   MAPE:      {mape:.2f}%  (target: ≤ 10%)")

joblib.dump(rf_model, 'carbon_model.pkl')
print("   Saved: carbon_model.pkl")

print("\n[3/4] Generating time-series data for forecasting model...")

def generate_timeseries(n_days=730):
    """Generate 2 years of realistic daily emission data with trend + seasonality + noise."""
    t = np.arange(n_days)
    
    trend = 0.04 * t
    
    seasonality = 8 * np.sin(2 * np.pi * t / 365) + 4 * np.cos(4 * np.pi * t / 365)
    
    weekly = -3 * np.sin(2 * np.pi * t / 7)
    
    noise = np.random.normal(0, 5, n_days)
    base = 25
    emissions = np.clip(base + trend + seasonality + weekly + noise, 5, 120)
    return emissions.tolist()

ts_data = generate_timeseries(730)
print(f"   Time-series: {len(ts_data)} daily values, mean={np.mean(ts_data):.1f}, std={np.std(ts_data):.1f}")

print("\n[4/4] Training Neural Network forecasting model (sliding window)...")

WINDOW = 14  

scaler = MinMaxScaler()
ts_scaled = scaler.fit_transform(np.array(ts_data).reshape(-1, 1)).flatten()

X_ts, y_ts = [], []
for i in range(WINDOW, len(ts_scaled)):
    X_ts.append(ts_scaled[i - WINDOW:i])
    y_ts.append(ts_scaled[i])

X_ts = np.array(X_ts)
y_ts = np.array(y_ts)

X_ts_train, X_ts_test, y_ts_train, y_ts_test = train_test_split(X_ts, y_ts, test_size=0.15, shuffle=False)

forecast_model = MLPRegressor(
    hidden_layer_sizes=(128, 64, 32),
    activation='relu',
    solver='adam',
    max_iter=500,
    learning_rate_init=0.001,
    early_stopping=True,
    validation_fraction=0.1,
    random_state=42
)
forecast_model.fit(X_ts_train, y_ts_train)

y_fc_pred = forecast_model.predict(X_ts_test)
fc_r2 = r2_score(y_ts_test, y_fc_pred)
print(f"   Forecasting R²: {fc_r2:.4f}")

joblib.dump(forecast_model, 'forecast_model.pkl')
joblib.dump(scaler, 'forecast_scaler.pkl')
print("   Saved: forecast_model.pkl")
print("   Saved: forecast_scaler.pkl")

print("\n" + "=" * 55)
print("  Training complete! All models saved.")
print("  Now start: uvicorn predict_service:app --port 8000")
print("=" * 55)
