import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# 1. Create a perfectly matched dataset for your React frontend
data = {
    'Engine_Size': [2.0, 2.4, 1.5, 3.5, 1.2, 5.0, 2.0],
    'Cylinders': [4, 4, 3, 6, 3, 8, 4],
    'Fuel_Consumption': [8.5, 9.6, 5.9, 11.5, 5.2, 15.0, 8.2],
    'CO2_Emissions': [196, 221, 136, 264, 119, 345, 189]
}
df = pd.DataFrame(data)

# 2. Tell the AI to ONLY look at these 3 columns
X = df[['Engine_Size', 'Cylinders', 'Fuel_Consumption']]
y = df['CO2_Emissions']

# 3. Train and overwrite the model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'carbon_model.pkl')
print("Rescue model successfully generated! It now matches your React app perfectly.")