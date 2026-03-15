import React, { useState } from 'react';
import { Zap, Circle, CheckCircle2 } from 'lucide-react';

const Vehicle = () => {
  const [vehicleType, setVehicleType] = useState('Petrol');
  const [distance, setDistance] = useState(100);
  const [status, setStatus] = useState('');
  
  // NEW AI STATE VARIABLES
  const [engineSize, setEngineSize] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [fuelConsumption, setFuelConsumption] = useState('');
  const [aiPrediction, setAiPrediction] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // The static fallback math (in case they don't use the AI)
  const emissionFactors = { Petrol: 192, Diesel: 232, Hybrid: 109, Electric: 0 };
  const currentFactor = emissionFactors[vehicleType];
  
  // Uses AI if available, otherwise uses the old static math!
  const baseEmissions = aiPrediction !== null ? aiPrediction : currentFactor;
  const totalEmissions = ((distance * baseEmissions) / 1000).toFixed(2);

  const getEmissionLevel = () => {
    if (totalEmissions <= 50) return { label: 'Low Emission', color: 'text-green-500', border: 'border-green-400', bg: 'bg-green-50' };
    if (totalEmissions <= 100) return { label: 'Moderate Emission', color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50' };
    return { label: 'High Emission', color: 'text-red-500', border: 'border-red-400', bg: 'bg-red-50' };
  };

  const level = getEmissionLevel();
  const treesToOffset = Math.max(1, Math.round(totalEmissions / 20));
  const kwhEquivalent = (totalEmissions * 2.5).toFixed(1);

  // NEW AI PREDICTION FUNCTION
  const handleAIPrediction = async (e) => {
      e.preventDefault(); 
      if (!engineSize || !cylinders || !fuelConsumption) {
          setStatus("Please fill out Engine, Cylinders, and Fuel first!");
          return;
      }

      setIsAiLoading(true);
      setStatus("Analyzing Kaggle dataset...");

      try {
          const response = await fetch('http://localhost:5000/api/predict-emissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  engineSize: parseFloat(engineSize), 
                  cylinders: parseFloat(cylinders), 
                  fuelConsumption: parseFloat(fuelConsumption) 
              })
          });

          const data = await response.json();
          
          if (data.success) {
              setAiPrediction(data.predicted_emission); 
              setStatus("✅ AI Prediction Successful!");
          } else {
              setStatus("❌ AI Engine Failed.");
          }
      } catch (error) {
          setStatus("❌ Cannot reach AI Server.");
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('Saving...');

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) {
        setStatus('Error: You must be logged in.');
        return;
      }

      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: storedUser.id,
          // Labels it so you know the AI was used!
          activity_type: aiPrediction ? `AI-Predicted ${vehicleType} Travel` : `${vehicleType} Vehicle Travel`,
          emissions: Number(totalEmissions)
        }),
      });

      if (response.ok) {
        setStatus('✅ Trip saved to dashboard!');
      } else {
        setStatus('❌ Failed to save.');
      }
    } catch (err) {
      setStatus('❌ Server connection error.');
    }

    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100">
          <Zap className="text-[#00a650]" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Vehicle AI Emission Calculator</h1>
        <p className="text-gray-500 mt-2">Calculate your vehicle's carbon footprint using our advanced Random Forest AI model.</p>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT SIDE: INPUTS */}
          <div>
            <form className="space-y-6">
              
              {/* --- NEW AI INPUTS --- */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-4">
                  <h3 className="font-bold text-emerald-800 text-sm uppercase tracking-wide">Step 1: AI Analysis Parameters</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Engine Size (L)</label>
                          <input type="number" step="0.1" placeholder="e.g. 2.4" value={engineSize} onChange={(e) => setEngineSize(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a650]" />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Cylinders</label>
                          <input type="number" placeholder="e.g. 4" value={cylinders} onChange={(e) => setCylinders(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a650]" />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Fuel Consumption (L/100km)</label>
                      <input type="number" step="0.1" placeholder="e.g. 9.2" value={fuelConsumption} onChange={(e) => setFuelConsumption(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a650]" />
                  </div>

                  <button onClick={handleAIPrediction} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded transition-colors text-sm">
                      {isAiLoading ? "Processing Random Forest Model..." : "Generate AI Baseline"}
                  </button>
              </div>
              {/* --- END AI INPUTS --- */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance Traveled (km)</label>
                <input 
                  type="number" value={distance} onChange={(e) => setDistance(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none" min="0"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Current Emission Factor</span>
                  <span className="font-semibold text-gray-700">
                      {aiPrediction ? <span className="text-[#00a650] mr-1">⚡ AI Generated:</span> : "Static Average:"} 
                      {aiPrediction ? aiPrediction.toFixed(1) : currentFactor} g CO₂/km
                  </span>
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-4 flex justify-center items-center gap-2">
                Log AI Trip to Dashboard
              </button>
              
              {status && <p className="text-center font-medium mt-2 text-[#00a650]">{status}</p>}
            </form>
          </div>

          {/* RIGHT SIDE: RESULTS (Unchanged) */}
          <div className="space-y-6">
            <div className={`p-8 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors ${level.border} ${level.bg}`}>
              <p className="text-gray-600 font-medium mb-2">Total CO₂ Emissions</p>
              <h2 className="text-5xl font-black text-gray-900 mb-2">
                {totalEmissions} <span className="text-2xl font-semibold text-gray-500">kg</span>
              </h2>
              <p className={`font-bold ${level.color}`}>{level.label}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Emission Level Scale</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Circle className="text-green-500 fill-current" size={12}/> 0-50 kg: Low</li>
                <li className="flex items-center gap-2"><Circle className="text-orange-500 fill-current" size={12}/> 51-100 kg: Moderate</li>
                <li className="flex items-center gap-2"><Circle className="text-red-500 fill-current" size={12}/> 101+ kg: High</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Trees to Offset</p>
                <h3 className="text-2xl font-black text-gray-900">{treesToOffset}</h3>
                <p className="text-xs text-gray-400">trees/year</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Equivalent to</p>
                <h3 className="text-2xl font-black text-gray-900">{kwhEquivalent}</h3>
                <p className="text-xs text-gray-400">kWh electricity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicle;