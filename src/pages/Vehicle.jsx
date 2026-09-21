import React, { useState } from 'react';
import { Zap, Circle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiCall, getUser } from '../utils/api';

const Vehicle = () => {
  const [vehicleType, setVehicleType] = useState('Petrol');
  const [distance, setDistance] = useState(100);
  const [engineSize, setEngineSize] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [fuelConsumption, setFuelConsumption] = useState('');
  const [aiPrediction, setAiPrediction] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ text: '', type: '' });
  const [anomaly, setAnomaly] = useState(null);
  const [modelDetails, setModelDetails] = useState(null);
  const user = getUser();

  const emissionFactors = { Petrol: 192, Diesel: 232, Hybrid: 109, Electric: 47 };
  const baseEmissions = aiPrediction !== null ? aiPrediction : emissionFactors[vehicleType];
  const totalEmissions = ((distance * baseEmissions) / 1000).toFixed(2);

  const getEmissionLevel = () => {
    if (totalEmissions <= 50) return { label: 'Low Emission', color: 'text-green-500', border: 'border-green-400', bg: 'bg-green-50' };
    if (totalEmissions <= 100) return { label: 'Moderate Emission', color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50' };
    return { label: 'High Emission', color: 'text-red-500', border: 'border-red-400', bg: 'bg-red-50' };
  };

  const level = getEmissionLevel();
  const treesToOffset = Math.max(1, Math.round(totalEmissions / 20));
  const kwhEquivalent = (totalEmissions * 2.5).toFixed(1);

  const handleAIPrediction = async (e) => {
    e.preventDefault();
    if (!engineSize || !cylinders || !fuelConsumption) {
      setStatus({ text: 'Please fill in Engine Size, Cylinders and Fuel Consumption first.', type: 'error' });
      return;
    }
    setIsAiLoading(true);
    setStatus({ text: 'Running Random Forest model...', type: 'info' });

    try {
      const res = await apiCall('/api/predict-emissions', {
        method: 'POST',
        body: JSON.stringify({
          engineSize: parseFloat(engineSize),
          cylinders: parseFloat(cylinders),
          fuelConsumption: parseFloat(fuelConsumption)
        })
      });

      if (!res) return;
      const data = await res.json();

      if (data.success) {
        setAiPrediction(data.predicted_emission);
        setModelDetails(data);
        const sourceLabel = {
          'rf_cnn_ensemble': 'RF + CNN Ensemble',
          'random_forest_only': 'Random Forest',
          'cnn_only': '1D CNN',
          'physics_fallback': 'Physics formula'
        }[data.source] || data.source;
        setStatus({ text: `✅ ${data.predicted_emission.toFixed(1)} g CO₂/km — ${sourceLabel}`, type: 'success' });
      } else {
        setStatus({ text: '❌ AI prediction failed. Using static values.', type: 'error' });
      }
    } catch {
      setStatus({ text: '❌ Cannot reach backend server.', type: 'error' });
    }
    setIsAiLoading(false);
  };

  const handleSave = async () => {
    if (!user) { setStatus({ text: 'You must be logged in.', type: 'error' }); return; }
    setIsSaving(true);

    try {
      const res = await apiCall('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          activity_type: aiPrediction ? `AI-Predicted ${vehicleType} Travel` : `${vehicleType} Vehicle Travel`,
          emissions: Number(totalEmissions),
          scope: 1
        })
      });

      if (res?.ok) {
        setStatus({ text: '✅ Trip saved to dashboard!', type: 'success' });
        // Check anomaly against last 10 reports
        checkAnomaly(Number(totalEmissions));
      } else {
        setStatus({ text: '❌ Failed to save.', type: 'error' });
      }
    } catch {
      setStatus({ text: '❌ Server connection error.', type: 'error' });
    }

    setIsSaving(false);
    setTimeout(() => setStatus({ text: '', type: '' }), 4000);
  };

  const checkAnomaly = async (current) => {
    try {
      const reportsRes = await apiCall(`/api/reports/${user.id}`);
      if (!reportsRes) return;
      const reports = await reportsRes.json();
      const history = reports.slice(0, 10).map(r => Number(r.emissions));
      if (history.length < 3) return;

      const anomalyRes = await apiCall('/api/detect-anomaly', {
        method: 'POST',
        body: JSON.stringify({ history, current })
      });
      if (!anomalyRes) return;
      const anomalyData = await anomalyRes.json();
      if (anomalyData.is_anomaly) setAnomaly(anomalyData);
    } catch { }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm mb-3 border border-gray-100">
          <Zap className="text-[#00a650]" size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Vehicle AI Emission Calculator</h1>
        <p className="text-gray-500 mt-1 text-sm">Calculate your vehicle's carbon footprint using our Random Forest AI model.</p>
      </div>

      {/* Anomaly Alert */}
      {anomaly && (
        <div className="max-w-5xl mx-auto mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-amber-800 text-sm">Anomaly Detected!</p>
            <p className="text-amber-700 text-sm">{anomaly.message}</p>
          </div>
          <button onClick={() => setAnomaly(null)} className="ml-auto text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* AI Parameters */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
              <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wide">Step 1 — AI Analysis Parameters</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Engine Size (L)</label>
                  <input type="number" step="0.1" min="0.5" max="10" placeholder="e.g. 2.4"
                    value={engineSize} onChange={(e) => setEngineSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cylinders</label>
                  <input type="number" min="2" max="16" placeholder="e.g. 4"
                    value={cylinders} onChange={(e) => setCylinders(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fuel Consumption (L/100km)</label>
                <input type="number" step="0.1" min="1" max="40" placeholder="e.g. 9.2"
                  value={fuelConsumption} onChange={(e) => setFuelConsumption(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm" />
              </div>

              <button onClick={handleAIPrediction} disabled={isAiLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {isAiLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Running Random Forest...</>
                  : <><Zap size={15} /> Generate AI Baseline</>}
              </button>
            </div>

            {/* Vehicle Type & Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(emissionFactors).map(type => (
                  <button key={type} type="button" onClick={() => { setVehicleType(type); setAiPrediction(null); }}
                    className={`p-2 rounded-lg border text-xs font-semibold transition ${vehicleType === type ? 'bg-[#00a650] text-white border-[#00a650]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance Traveled (km)</label>
              <input type="number" value={distance} min="0" onChange={(e) => setDistance(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm" />
            </div>

            <div className="flex justify-between text-sm text-gray-500 py-1 border-t border-gray-100 pt-3">
              <span>Current emission factor</span>
              <span className="font-semibold text-gray-700">
                {aiPrediction !== null
                  ? <><span className="text-[#00a650]">⚡ AI:</span> {aiPrediction.toFixed(1)}</>
                  : `Static: ${emissionFactors[vehicleType]}`} g CO₂/km
              </span>
            </div>

            <button onClick={handleSave} disabled={isSaving}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-lg transition shadow-sm flex justify-center items-center gap-2 text-sm disabled:opacity-60">
              {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Log Trip to Dashboard'}
            </button>

            {status.text && (
              <p className={`text-center text-sm font-medium ${status.type === 'error' ? 'text-red-500' : status.type === 'success' ? 'text-[#00a650]' : 'text-blue-500'}`}>
                {status.text}
              </p>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-5">
            <div className={`p-8 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors ${level.border} ${level.bg}`}>
              <p className="text-gray-500 font-medium mb-2 text-sm">Total CO₂ Emissions</p>
              <h2 className="text-5xl font-black text-gray-900 mb-2">
                {totalEmissions} <span className="text-2xl font-semibold text-gray-400">kg</span>
              </h2>
              <p className={`font-bold text-sm ${level.color}`}>{level.label}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Emission Scale</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Circle className="text-green-500 fill-current" size={10} /> 0–50 kg: Low</li>
                <li className="flex items-center gap-2"><Circle className="text-orange-500 fill-current" size={10} /> 51–100 kg: Moderate</li>
                <li className="flex items-center gap-2"><Circle className="text-red-500 fill-current" size={10} /> 101+ kg: High</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                <p className="text-xs text-gray-400 mb-1">Trees to Offset</p>
                <h3 className="text-2xl font-black text-gray-900">{treesToOffset}</h3>
                <p className="text-xs text-gray-400">trees/year</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                <p className="text-xs text-gray-400 mb-1">Equivalent to</p>
                <h3 className="text-2xl font-black text-gray-900">{kwhEquivalent}</h3>
                <p className="text-xs text-gray-400">kWh electricity</p>
              </div>
            </div>

            {aiPrediction !== null && modelDetails && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={16} />
                  <p className="text-sm font-bold text-emerald-800">
                    {modelDetails.source === 'rf_cnn_ensemble' ? 'RF + CNN Ensemble Active' : 'AI Prediction Active'}
                  </p>
                </div>

                {/* Model predictions breakdown */}
                {modelDetails.model_predictions && Object.keys(modelDetails.model_predictions).length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Individual model outputs:</p>
                    {Object.entries(modelDetails.model_predictions).map(([model, val]) => {
                      const label = model === 'random_forest' ? 'Random Forest' : '1D CNN';
                      const weight = modelDetails.ensemble_weights?.[model === 'random_forest' ? 'random_forest' : 'cnn_1d'];
                      return (
                        <div key={model} className="flex items-center gap-2">
                          <span className="text-xs text-emerald-700 w-28">{label}</span>
                          <div className="flex-1 bg-emerald-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${(val / 400) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-800 w-16 text-right">{val} g/km</span>
                          {weight !== undefined && (
                            <span className="text-xs text-emerald-500 w-10">({(weight * 100).toFixed(0)}%)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Model agreement */}
                {modelDetails.agreement && modelDetails.agreement.diff_pct !== null && (
                  <p className="text-xs text-emerald-700">
                    Model agreement: <span className="font-bold capitalize">{modelDetails.agreement.status}</span>
                    {' '}({modelDetails.agreement.diff_pct}% difference between models)
                  </p>
                )}

                {/* Feature importance */}
                {modelDetails.feature_importance && Object.keys(modelDetails.feature_importance).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Feature importance (RF):</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(modelDetails.feature_importance).map(([feat, pct]) => (
                        <span key={feat} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                          {feat}: {pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicle;
