import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Vehicle = () => {
  const { isDark } = useTheme();
  
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
    boxColor = isDark ? 'bg-green-900 bg-opacity-30 border-green-700' : 'bg-green-50 border-green-300';
  } else if (emission <= 50) {
    emissionLevel = 'Low Emission';
    boxColor = isDark ? 'bg-green-900 bg-opacity-30 border-green-700' : 'bg-green-50 border-green-300';
  } else if (emission <= 100) {
    emissionLevel = 'Moderate Emission';
    boxColor = isDark ? 'bg-orange-900 bg-opacity-30 border-orange-700' : 'bg-orange-50 border-orange-300';
  } else {
    emissionLevel = 'High Emission';
    boxColor = isDark ? 'bg-red-900 bg-opacity-30 border-red-700' : 'bg-red-50 border-red-300';
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
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 ${isDark ? 'bg-gray-800 shadow-lg shadow-green-900' : 'bg-white shadow-lg'} rounded-3xl flex items-center justify-center`}>
              <Zap size={40} className="text-green-600" />
            </div>
          </div>
          <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Vehicle Carbon Emission Calculator</h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Calculate your vehicle's carbon footprint and discover ways to reduce your environmental impact.
          </p>
        </div>

        {/* Main Card */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div>
                <div className="mb-6">
                  <label className={`block font-semibold mb-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className={`block font-semibold mb-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Distance (km)</label>
                  <input
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                    min="0"
                    className={`w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-300'}`}
                    placeholder="Enter distance in kilometers"
                  />
                </div>

                <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                  <div className={`flex justify-between items-center mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="text-sm">Emission Factor</span>
                    <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{vehicle.factor} g CO₂/km</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
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
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total CO₂ Emissions</p>
                  <div>
                    <span className={`text-5xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{emission.toFixed(2)}</span>
                    <span className={`text-xl ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>kg</span>
                  </div>
                  <p className={`text-lg font-semibold mt-3 ${getLevelColor()}`}>{emissionLevel}</p>
                </div>

                <div className={`rounded-xl p-4 border mb-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                  <p className={`font-semibold mb-4 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Emission Level Scale</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>0-50 kg: Low</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>51-100 kg: Moderate</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>101+ kg: High</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`border rounded-xl p-4 text-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Trees to Offset</p>
                    <p className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{trees}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>trees/year</p>
                  </div>
                  <div className={`border rounded-xl p-4 text-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Equivalent to</p>
                    <p className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{kwh}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>kWh electricity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className={`border-t p-8 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} className="text-green-600" />
              <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Reduction Recommendations</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {getRecommendations().map((rec, idx) => (
                <div key={idx} className={`rounded-xl p-4 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <p>Emission factors are approximate averages. Actual emissions may vary based on driving conditions and vehicle efficiency.</p>
        </div>
      </div>
    </div>
  );
};

export default Vehicle;
