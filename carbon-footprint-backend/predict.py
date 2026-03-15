import sys
import joblib
import pandas as pd
import warnings


warnings.filterwarnings("ignore")


model = joblib.load('carbon_model.pkl')


engine = float(sys.argv[1])
cylinders = float(sys.argv[2])
fuel = float(sys.argv[3])


input_data = pd.DataFrame([[engine, cylinders, fuel]], columns=['Engine_Size', 'Cylinders', 'Fuel_Consumption'])


prediction = model.predict(input_data)[0]

print(prediction)