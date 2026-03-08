import React, { useState } from 'react';
import { Factory, Circle, Activity } from 'lucide-react';

const Industrial = () => {
  const [powerSource, setPowerSource] = useState('Grid Average');
  const [consumption, setConsumption] = useState(5000);
  const [status, setStatus] = useState('');

  // Emission factors (kg of CO2 per kWh)
  const emissionFactors = {
    'Coal Power': 1.00,
    'Grid Average': 0.45,
    'Natural Gas': 0.40,
    'Renewable (Solar/Wind)': 0.00
  };

  const currentFactor = emissionFactors[powerSource];
  
  // Calculate total in kg (Consumption * Factor)
  const totalEmissions = (consumption * currentFactor).toFixed(2);

  // Dynamic status based on industrial emissions scale
  const getEmissionLevel = () => {
    if (totalEmissions <= 1000) return { label: 'Optimal/Low Emission', color: 'text-green-500', border: 'border-green-400', bg: 'bg-green-50' };
    if (totalEmissions <= 5000) return { label: 'Moderate Emission', color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50' };
    return { label: 'High Emission', color: 'text-red-500', border: 'border-red-400', bg: 'bg-red-50' };
  };

  const level = getEmissionLevel();

  // Fun stats for context
  const homesPowered = Math.round(consumption / 30); // Avg home uses ~30 kWh/day
  const treesToOffset = Math.max(1, Math.round(totalEmissions / 20));

  // The Bridge: Save to your Neon Database
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
          activity_type: `Industrial (${powerSource})`,
          emissions: Number(totalEmissions)
        }),
      });

      if (response.ok) {
        setStatus('✅ Logged to dashboard successfully!');
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
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100">
          <Factory className="text-[#00a650]" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Industrial Carbon Emission Calculator</h1>
        <p className="text-gray-500 mt-2">Track facility energy usage and optimize your corporate environmental impact.</p>
      </div>

      {/* Main Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Inputs */}
          <div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Energy Source</label>
                <select 
                  value={powerSource}
                  onChange={(e) => setPowerSource(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] focus:border-[#00a650] outline-none bg-white"
                >
                  <option value="Grid Average">Grid Average</option>
                  <option value="Coal Power">Coal Power</option>
                  <option value="Natural Gas">Natural Gas</option>
                  <option value="Renewable (Solar/Wind)">Renewable (Solar/Wind)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Consumption (kWh)</label>
                <input 
                  type="number" 
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] focus:border-[#00a650] outline-none"
                  min="0"
                />
              </div>

              {/* Emission Factor visual slider */}
              <div className="pt-2">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Emission Factor</span>
                  <span className="font-semibold text-gray-700">{currentFactor.toFixed(2)} kg CO₂/kWh</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(currentFactor / 1.0) * 100}%` }}></div>
                </div>
              </div>

              {/* Save Button */}
              <button 
                type="submit" 
                className="w-full bg-[#00a650] hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-4 flex justify-center items-center gap-2"
              >
                Log Facility Data to Dashboard
              </button>
              
              {/* Success/Error Message */}
              {status && <p className="text-center font-medium mt-2 text-[#00a650]">{status}</p>}
            </form>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            
            {/* Total Display */}
            <div className={`p-8 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors ${level.border} ${level.bg}`}>
              <p className="text-gray-600 font-medium mb-2">Facility CO₂ Emissions</p>
              <h2 className="text-5xl font-black text-gray-900 mb-2">
                {totalEmissions} <span className="text-2xl font-semibold text-gray-500">kg</span>
              </h2>
              <p className={`font-bold ${level.color}`}>{level.label}</p>
            </div>

            {/* Equivalency Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <Activity className="text-blue-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-500 mb-1">Energy Equivalent</p>
                <h3 className="text-xl font-black text-gray-900">{homesPowered}</h3>
                <p className="text-xs text-gray-400">Homes powered/day</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <Factory className="text-purple-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-500 mb-1">Annual Offset</p>
                <h3 className="text-xl font-black text-gray-900">{treesToOffset}</h3>
                <p className="text-xs text-gray-400">Trees required</p>
              </div>
            </div>

          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Factory className="text-[#00a650]" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Industrial Reduction Strategies</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Upgrade to high-efficiency industrial LED lighting systems.",
              "Implement smart-grid technology for peak load management.",
              "Transition a percentage of facility power to on-site solar.",
              "Perform routine maintenance on heavy machinery to optimize energy draw."
            ].map((tip, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg flex items-start gap-3 bg-gray-50 hover:bg-white transition-colors">
                <span className="text-[#00a650] font-bold mt-0.5">•</span>
                <p className="text-sm text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Industrial;