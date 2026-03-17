import React, { useState } from 'react';
import { Map as MapIcon, MapPin, Navigation, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { apiCall, getUser } from '../utils/api';

const VEHICLE_FACTORS = {
  'Petrol Car': 0.192,
  'Diesel Car': 0.232,
  'Hybrid Car': 0.109,
  'Electric Car': 0.047,
  'Motorbike': 0.114,
  'Bus': 0.089,
};

const Location = () => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState('Petrol Car');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = getUser();

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!startPoint.trim() || !destination.trim()) {
      setStatus('Please enter both a starting point and destination.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatus('Geocoding locations...');
    setStatusType('info');
    setResult(null);
    setSaved(false);

    try {
      const res = await apiCall('/api/calculate-distance', {
        method: 'POST',
        body: JSON.stringify({ start: startPoint, destination })
      });

      if (!res) return;
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || 'Could not calculate distance.');
        setStatusType('error');
        setLoading(false);
        return;
      }

      const factor = VEHICLE_FACTORS[vehicleType] || 0.192;
      const emissions = parseFloat((data.distance * factor).toFixed(2));

      setResult({
        distance: data.distance,
        emissions,
        start: data.start,
        destination: data.destination,
        factor,
        vehicleType
      });

      setStatus('Route calculated successfully!');
      setStatusType('success');
    } catch {
      setStatus('Server error. Is the backend running?');
      setStatusType('error');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaved(false);
    setStatus('Saving to dashboard...');

    try {
      const res = await apiCall('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          activity_type: `Route: ${startPoint} → ${destination} (${result.vehicleType})`,
          emissions: result.emissions,
          scope: 1
        })
      });

      if (res?.ok) {
        setSaved(true);
        setStatus(`✅ ${result.emissions} kg CO₂ saved to your dashboard!`);
        setStatusType('success');
      } else {
        setStatus('Failed to save route.');
        setStatusType('error');
      }
    } catch {
      setStatus('Server connection error.');
      setStatusType('error');
    }
  };

  const getMapUrl = () => {
    if (result) {
      const lat = (result.start.lat + result.destination.lat) / 2;
      const lon = (result.start.lon + result.destination.lon) / 2;
      return `https://maps.google.com/maps?q=${lat},${lon}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
    }
  
    return `https://maps.google.com/maps?q=0,0&t=&z=2&ie=UTF8&iwloc=&output=embed`;
  };

  const treesToOffset = result ? Math.max(1, Math.round(result.emissions / 20)) : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm mb-3 border border-gray-100">
          <MapIcon className="text-[#00a650]" size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Live Location & Route Tracking</h1>
        <p className="text-gray-500 mt-1 text-sm">Enter any two real locations — we geocode them and calculate your exact travel emissions.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="text-[#00a650]" size={18} />
              Plan Your Route
            </h3>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
                <div className="absolute top-8 left-3 text-gray-400"><MapPin size={16} /></div>
                <input
                  type="text"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm"
                  placeholder="e.g. Nairobi, Kenya"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <div className="absolute top-8 left-3 text-red-400"><MapPin size={16} /></div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm"
                  placeholder="e.g. Mombasa, Kenya"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] outline-none text-sm bg-white"
                >
                  {Object.keys(VEHICLE_FACTORS).map(v => (
                    <option key={v} value={v}>{v} — {VEHICLE_FACTORS[v]} kg CO₂/km</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a650] hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Calculating...</> : 'Calculate Route'}
              </button>
            </form>
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
              statusType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              statusType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {statusType === 'error' ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> :
               statusType === 'success' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : null}
              {status}
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Total CO₂ Emissions</p>
                <p className="text-4xl font-black text-[#00a650]">
                  {result.emissions} <span className="text-lg font-normal text-gray-400">kg</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{result.distance} km • {result.vehicleType}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400">Trees to Offset</p>
                  <p className="text-xl font-black text-gray-800">{treesToOffset}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="text-xl font-black text-gray-800">{result.distance} km</p>
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-0.5">
                <p className="truncate"><span className="font-medium text-gray-500">From:</span> {result.start.display_name?.split(',').slice(0, 3).join(', ')}</p>
                <p className="truncate"><span className="font-medium text-gray-500">To:</span> {result.destination.display_name?.split(',').slice(0, 3).join(', ')}</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saved}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg transition text-sm disabled:opacity-50"
              >
                {saved ? '✅ Saved to Dashboard' : 'Save to Dashboard'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '560px' }}>
          <div className="p-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            <span className="text-sm font-semibold text-gray-700">
              {result
                ? `${result.start.display_name?.split(',')[0]} → ${result.destination.display_name?.split(',')[0]}`
                : 'Enter locations above to visualise route'}
            </span>
          </div>
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={getMapUrl()}
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default Location;
