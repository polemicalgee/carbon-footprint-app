import React, { useState } from 'react';
import { Factory, Activity, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiCall, getUser } from '../utils/api';

const emissionFactors = {
  'Coal Power': 1.00,
  'Grid Average': 0.45,
  'Natural Gas': 0.40,
  'Renewable (Solar/Wind)': 0.00
};

const SCOPE_FOR_SOURCE = {
  'Coal Power': 2,
  'Grid Average': 2,
  'Natural Gas': 2,
  'Renewable (Solar/Wind)': 2
};

const Industrial = () => {
  const [powerSource, setPowerSource] = useState('Grid Average');
  const [consumption, setConsumption] = useState(5000);
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [anomaly, setAnomaly] = useState(null);
  const user = getUser();

  const currentFactor = emissionFactors[powerSource];
  const totalEmissions = (consumption * currentFactor).toFixed(2);

  const getEmissionLevel = () => {
    if (totalEmissions <= 1000) return { label: 'Optimal / Low Emission', color: 'text-green-500', border: 'border-green-400', bg: 'bg-green-50' };
    if (totalEmissions <= 5000) return { label: 'Moderate Emission', color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50' };
    return { label: 'High Emission', color: 'text-red-500', border: 'border-red-400', bg: 'bg-red-50' };
  };

  const level = getEmissionLevel();
  const homesPowered = Math.round(consumption / 30);
  const treesToOffset = Math.max(1, Math.round(totalEmissions / 20));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) { setStatus({ text: 'You must be logged in.', type: 'error' }); return; }
    setIsSaving(true);
    setStatus({ text: 'Saving...', type: 'info' });

    try {
      const scope = SCOPE_FOR_SOURCE[powerSource] || 2;
      const res = await apiCall('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          activity_type: `Industrial (${powerSource})`,
          emissions: Number(totalEmissions),
          scope
        })
      });

      if (res?.ok) {
        setStatus({ text: '✅ Logged to dashboard successfully!', type: 'success' });
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
      const data = await anomalyRes.json();
      if (data.is_anomaly) setAnomaly(data);
    } catch { }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm mb-3 border border-gray-100">
          <Factory className="text-[#00a650]" size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Industrial Carbon Calculator</h1>
        <p className="text-gray-500 mt-1 text-sm">Track facility energy usage and optimize your corporate environmental impact.</p>
      </div>

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

          <div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Energy Source</label>
                <select value={powerSource} onChange={(e) => setPowerSource(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none bg-white text-sm">
                  {Object.keys(emissionFactors).map(s => (
                    <option key={s} value={s}>{s} — {emissionFactors[s]} kg CO₂/kWh</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Consumption (kWh)</label>
                <input type="number" value={consumption} min="0"
                  onChange={(e) => setConsumption(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm" />
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Emission Factor</span>
                  <span className="font-semibold text-gray-700">{currentFactor.toFixed(2)} kg CO₂/kWh</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(currentFactor / 1.0) * 100}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Scope 2</span>
                <p className="text-xs text-blue-700">Indirect emissions from purchased electricity and energy</p>
              </div>

              <button type="submit" disabled={isSaving}
                className="w-full bg-[#00a650] hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-sm flex justify-center items-center gap-2 text-sm disabled:opacity-60">
                {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Log Facility Data to Dashboard'}
              </button>

              {status.text && (
                <p className={`text-center text-sm font-medium ${status.type === 'error' ? 'text-red-500' : status.type === 'success' ? 'text-[#00a650]' : 'text-blue-500'}`}>
                  {status.text}
                </p>
              )}
            </form>
          </div>

          <div className="space-y-5">
            <div className={`p-8 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors ${level.border} ${level.bg}`}>
              <p className="text-gray-500 font-medium mb-2 text-sm">Facility CO₂ Emissions</p>
              <h2 className="text-5xl font-black text-gray-900 mb-2">
                {totalEmissions} <span className="text-2xl font-semibold text-gray-400">kg</span>
              </h2>
              <p className={`font-bold text-sm ${level.color}`}>{level.label}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <Activity className="text-blue-500 mx-auto mb-1" size={20} />
                <p className="text-xs text-gray-400 mb-1">Homes Powered/Day</p>
                <h3 className="text-xl font-black text-gray-900">{homesPowered}</h3>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <Factory className="text-purple-500 mx-auto mb-1" size={20} />
                <p className="text-xs text-gray-400 mb-1">Trees to Offset/yr</p>
                <h3 className="text-xl font-black text-gray-900">{treesToOffset}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-[#00a650]" size={20} />
            <h3 className="text-base font-bold text-gray-900">AI Reduction Strategies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { tip: 'Upgrade to high-efficiency industrial LED lighting systems.', saving: '~10% reduction' },
              { tip: 'Implement smart-grid technology for peak load management.', saving: '~15% reduction' },
              { tip: 'Transition a portion of facility power to on-site solar.', saving: '~25% reduction' },
              { tip: 'Perform routine maintenance on heavy machinery to optimise energy draw.', saving: '~8% reduction' }
            ].map(({ tip, saving }, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-lg flex items-start gap-3 bg-gray-50 hover:bg-white transition-colors">
                <span className="text-[#00a650] font-bold text-lg mt-0.5">•</span>
                <div>
                  <p className="text-sm text-gray-600">{tip}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">{saving}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Industrial;
