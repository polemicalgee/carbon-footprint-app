import React, { useState } from 'react';
import { Zap } from 'lucide-react';

const Vehicle = () => {
  const vehicleData = {
    petrol: { factor: 192, color: '#ef4444', label: 'Petrol' },
    diesel: { factor: 171, color: '#ef4444', label: 'Diesel' },
    hybrid: { factor: 100, color: '#f97316', label: 'Hybrid' },
    electric: { factor: 0, color: '#22c55e', label: 'Electric' }
  };

  const [vehicleType, setVehicleType] = useState('petrol');
  const [distance, setDistance] = useState(100);

  const vehicle = vehicleData[vehicleType];
  const emission = (vehicle.factor * distance) / 1000;
  const progressPercent = Math.min((vehicle.factor / 200) * 100, 100);
  const trees = Math.ceil(emission / 20) || 0;
  const kwh = (emission * 2.5).toFixed(1);

  let emissionLevel, boxColor;
  if (emission === 0) {
    emissionLevel = 'Zero Emission';
    boxColor = 'bg-green-50 border-green-300';
  } else if (emission <= 50) {
    emissionLevel = 'Low Emission';
    boxColor = 'bg-green-50 border-green-300';
  } else if (emission <= 100) {
    emissionLevel = 'Moderate Emission';
    boxColor = 'bg-orange-50 border-orange-300';
  } else {
    emissionLevel = 'High Emission';
    boxColor = 'bg-red-50 border-red-300';
  }

  const getRecommendations = () => {
    const recommendations = [];
    
    if (vehicleType === 'electric') {
      recommendations.push('✓ Great choice! Your vehicle produces zero direct emissions.');
      recommendations.push('• Consider charging with renewable energy for even lower impact.');
    } else if (vehicleType === 'hybrid') {
      recommendations.push('• Your hybrid vehicle reduces emissions compared to conventional vehicles.');
      recommendations.push('• Try to maximize EV mode usage for short trips.');
      recommendations.push('• Consider upgrading to a full electric vehicle for greater savings.');
    } else {
      recommendations.push('• Consider switching to an electric or hybrid vehicle.');
      recommendations.push('• Combine trips to reduce total distance traveled.');
      recommendations.push('• Maintain proper tire pressure for better fuel efficiency.');
      recommendations.push('• Use public transportation or carpool when possible.');
    }
    
    if (emission > 100) {
      recommendations.push('• Your emissions are above average. Small changes can make a big difference!');
    }
    
    return recommendations;
  };

  const getLevelColor = () => {
    if (emission === 0 || emission <= 50) return 'text-green-600';
    if (emission <= 100) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center">
              <Zap size={40} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Vehicle Carbon Emission Calculator</h1>
          <p className="text-gray-600 text-lg">
            Calculate your vehicle's carbon footprint and discover ways to reduce your environmental impact.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div>
                <div className="mb-6">
                  <label className="block font-semibold text-gray-700 mb-3 text-sm">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 bg-white"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block font-semibold text-gray-700 mb-3 text-sm">Distance (km)</label>
                  <input
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    placeholder="Enter distance in kilometers"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Emission Factor</span>
                    <span className="font-semibold text-gray-800">{vehicle.factor} g CO₂/km</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: vehicle.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div>
                <div className={`border-2 rounded-2xl p-6 text-center mb-6 ${boxColor}`}>
                  <p className="text-sm text-gray-600 mb-2">Total CO₂ Emissions</p>
                  <div>
                    <span className="text-5xl font-bold text-gray-800">{emission.toFixed(2)}</span>
                    <span className="text-xl text-gray-600 ml-2">kg</span>
                  </div>
                  <p className={`text-lg font-semibold mt-3 ${getLevelColor()}`}>{emissionLevel}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-300 mb-6">
                  <p className="font-semibold text-gray-800 mb-4 text-sm">Emission Level Scale</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">0-50 kg: Low</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">51-100 kg: Moderate</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">101+ kg: High</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-300 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Trees to Offset</p>
                    <p className="text-3xl font-bold text-gray-800">{trees}</p>
                    <p className="text-xs text-gray-500">trees/year</p>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Equivalent to</p>
                    <p className="text-3xl font-bold text-gray-800">{kwh}</p>
                    <p className="text-xs text-gray-500">kWh electricity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 border-t border-gray-300 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} className="text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Reduction Recommendations</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {getRecommendations().map((rec, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-300 text-sm text-gray-700">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Emission factors are approximate averages. Actual emissions may vary based on driving conditions and vehicle efficiency.</p>
        </div>
      </div>
    </div>
  );
};

export default Vehicle;
