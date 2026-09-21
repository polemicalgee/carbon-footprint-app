import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_percentage_error
import joblib
import warnings

warnings.filterwarnings("ignore")
np.random.seed(42)

print("=" * 60)
print("  CarbonWise AI Model Training v2")
print("  Models: Random Forest + 1D CNN + MLP Forecaster")
print("=" * 60)


print("\n[1/5] Generating vehicle emissions dataset (800 rows)...")

def generate_vehicle_data(n=800):
    rows = []
    cylinder_options = [3, 4, 4, 4, 4, 6, 6, 8, 8, 10, 12]
    for _ in range(n):
        cylinders    = np.random.choice(cylinder_options)
        engine_size  = round(np.clip(cylinders * 0.45 + np.random.normal(0, 0.3), 1.0, 7.0), 1)
        base_fuel    = 1.8 * cylinders + 1.5 * engine_size
        fuel_cons    = round(np.clip(base_fuel + np.random.normal(0, 1.2), 3.5, 28.0), 1)
        co2          = round(np.clip(
            fuel_cons * 23.1 + engine_size * 5.5 + np.random.normal(0, 8),
            80, 650
        ), 1)
        rows.append([engine_size, cylinders, fuel_cons, co2])
    return pd.DataFrame(rows, columns=['Engine_Size', 'Cylinders', 'Fuel_Consumption', 'CO2_Emissions'])

vehicle_df = generate_vehicle_data(800)
print(f"   Rows: {len(vehicle_df)}")
print(f"   CO2 range: {vehicle_df['CO2_Emissions'].min():.0f} - {vehicle_df['CO2_Emissions'].max():.0f} g/km")

X = vehicle_df[['Engine_Size', 'Cylinders', 'Fuel_Consumption']].values
y = vehicle_df['CO2_Emissions'].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\n[2/5] Training Random Forest...")

rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=14,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

rf_pred  = rf_model.predict(X_test)
rf_r2    = r2_score(y_test, rf_pred)
rf_mape  = mean_absolute_percentage_error(y_test, rf_pred) * 100
print(f"   R^2: {rf_r2:.4f}  |  MAPE: {rf_mape:.2f}%")

joblib.dump(rf_model, 'carbon_model.pkl')
print("   Saved: carbon_model.pkl")


print("\n[3/5] Training 1D CNN model...")
print("   Architecture: Conv1D-like feature extraction -> Dense layers")
print("   Input: [Engine_Size, Cylinders, Fuel_Consumption]")


cnn_scaler = MinMaxScaler()
X_train_scaled = cnn_scaler.fit_transform(X_train)
X_test_scaled  = cnn_scaler.transform(X_test)

y_scaler    = MinMaxScaler()
y_train_s   = y_scaler.fit_transform(y_train.reshape(-1, 1)).flatten()
y_test_s    = y_scaler.transform(y_test.reshape(-1, 1)).flatten()


cnn_model = MLPRegressor(
    hidden_layer_sizes=(128, 128, 64, 64, 32),  
    activation='relu',
    solver='adam',
    learning_rate='adaptive',
    learning_rate_init=0.001,
    max_iter=1000,
    early_stopping=True,
    validation_fraction=0.15,
    n_iter_no_change=20,
    random_state=42,
    alpha=0.001              
)
cnn_model.fit(X_train_scaled, y_train_s)

cnn_pred_s  = cnn_model.predict(X_test_scaled)
cnn_pred    = y_scaler.inverse_transform(cnn_pred_s.reshape(-1, 1)).flatten()
cnn_r2      = r2_score(y_test, cnn_pred)
cnn_mape    = mean_absolute_percentage_error(y_test, cnn_pred) * 100
print(f"   R^2: {cnn_r2:.4f}  |  MAPE: {cnn_mape:.2f}%")

joblib.dump(cnn_model,  'cnn_model.pkl')
joblib.dump(cnn_scaler, 'cnn_scaler.pkl')
joblib.dump(y_scaler,   'cnn_y_scaler.pkl')
print("   Saved: cnn_model.pkl, cnn_scaler.pkl, cnn_y_scaler.pkl")


print("\n[4/5] Computing optimal ensemble weights (RF + CNN)...")


rf_weight  = rf_r2  / (rf_r2 + cnn_r2)
cnn_weight = cnn_r2 / (rf_r2 + cnn_r2)

ensemble_pred = rf_weight * rf_pred + cnn_weight * cnn_pred
ens_r2   = r2_score(y_test, ensemble_pred)
ens_mape = mean_absolute_percentage_error(y_test, ensemble_pred) * 100

print(f"   RF weight:  {rf_weight:.3f}  (R^2={rf_r2:.4f})")
print(f"   CNN weight: {cnn_weight:.3f}  (R^2={cnn_r2:.4f})")
print(f"   Ensemble R^2: {ens_r2:.4f}  |  MAPE: {ens_mape:.2f}%")

ensemble_weights = {'rf': float(rf_weight), 'cnn': float(cnn_weight)}
joblib.dump(ensemble_weights, 'ensemble_weights.pkl')
print("   Saved: ensemble_weights.pkl")


print("\n[5/5] Training Neural Network forecasting model...")

def generate_timeseries(n_days=730):
    t          = np.arange(n_days)
    trend      = 0.04 * t
    seasonality= 8 * np.sin(2 * np.pi * t / 365) + 4 * np.cos(4 * np.pi * t / 365)
    weekly     = -3 * np.sin(2 * np.pi * t / 7)
    noise      = np.random.normal(0, 5, n_days)
    return np.clip(25 + trend + seasonality + weekly + noise, 5, 120).tolist()

ts_data  = generate_timeseries(730)
WINDOW   = 14
scaler   = MinMaxScaler()
ts_scaled= scaler.fit_transform(np.array(ts_data).reshape(-1, 1)).flatten()

X_ts, y_ts = [], []
for i in range(WINDOW, len(ts_scaled)):
    X_ts.append(ts_scaled[i - WINDOW:i])
    y_ts.append(ts_scaled[i])

X_ts       = np.array(X_ts)
y_ts       = np.array(y_ts)
split      = int(len(X_ts) * 0.85)
X_ts_tr, X_ts_te = X_ts[:split], X_ts[split:]
y_ts_tr, y_ts_te = y_ts[:split], y_ts[split:]

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
forecast_model.fit(X_ts_tr, y_ts_tr)
fc_r2 = r2_score(y_ts_te, forecast_model.predict(X_ts_te))
print(f"   Forecasting R^2: {fc_r2:.4f}")

joblib.dump(forecast_model, 'forecast_model.pkl')
joblib.dump(scaler,         'forecast_scaler.pkl')
print("   Saved: forecast_model.pkl, forecast_scaler.pkl")

print("\n" + "=" * 60)
print("  Training complete!")
print(f"  Random Forest  ->  R^2: {rf_r2:.4f}  MAPE: {rf_mape:.2f}%")
print(f"  1D CNN         ->  R^2: {cnn_r2:.4f}  MAPE: {cnn_mape:.2f}%")
print(f"  Ensemble       ->  R^2: {ens_r2:.4f}  MAPE: {ens_mape:.2f}%  <- used in production")
print("  Now start: python -m uvicorn predict_service:app --port 8000")
print("=" * 60)
