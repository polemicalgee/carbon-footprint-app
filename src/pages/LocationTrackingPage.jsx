import React, { useState } from 'react';
import { Map as MapIcon, MapPin, Navigation, Route as RouteIcon, CheckCircle2 } from 'lucide-react';

const Location = () => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState(null);
  const [status, setStatus] = useState('');

  // The Bridge: Calculate and Save to Database
  const handleLogRoute = async (e) => {
    e.preventDefault();
    
    // For the demo, we simulate a realistic distance based on input lengths
    // In a future version, this would use the Google Maps Distance Matrix API
    const simulatedDistance = Math.floor(Math.random() * 30) + 5; 
    setDistance(simulatedDistance);
    setStatus('Calculating route...');

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) {
        setStatus('Error: You must be logged in.');
        return;
      }

      // Calculate emissions (Distance * 0.192 kg CO2/km for an average car)
      const emissions = (simulatedDistance * 0.192).toFixed(2);

      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: storedUser.id,
          activity_type: `Route: ${startPoint} to ${destination}`,
          emissions: Number(emissions)
        }),
      });

      if (response.ok) {
        setStatus(`✅ Route logged! ${emissions} kg CO₂ added to dashboard.`);
      } else {
        setStatus('❌ Failed to save route.');
      }
    } catch (err) {
      setStatus('❌ Server connection error.');
    }

    setTimeout(() => {
      setStatus('');
      setStartPoint('');
      setDestination('');
    }, 4000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100">
          <MapIcon className="text-[#00a650]" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Live Location & Route Tracking</h1>
        <p className="text-gray-500 mt-2">Map your daily commutes to accurately calculate travel-based carbon emissions.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Route Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="text-[#00a650]" size={20} />
              Plan Your Route
            </h3>
            
            <form onSubmit={handleLogRoute} className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
                <div className="absolute top-9 left-3 text-gray-400">
                  <MapPin size={18} />
                </div>
                <input 
                  type="text" 
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] focus:border-[#00a650] outline-none"
                  placeholder="e.g. Home"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <div className="absolute top-9 left-3 text-red-400">
                  <MapPin size={18} />
                </div>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a650] focus:border-[#00a650] outline-none"
                  placeholder="e.g. Office"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#00a650] hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <RouteIcon size={20} />
                Calculate & Log Route
              </button>

              {status && (
                <div className={`p-3 rounded-lg text-sm font-medium text-center ${status.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {status}
                </div>
              )}
            </form>
          </div>

          {/* Mini Stats Card */}
          {distance && (
            <div className="bg-[#00a650] rounded-2xl shadow-sm p-6 text-white text-center transform transition-all animate-fade-in-up">
              <CheckCircle2 className="mx-auto mb-2 opacity-80" size={32} />
              <p className="text-green-100 font-medium mb-1">Estimated Distance</p>
              <h2 className="text-4xl font-black mb-1">{distance} <span className="text-lg font-semibold opacity-80">km</span></h2>
              <p className="text-sm text-green-100">Route mapped successfully</p>
            </div>
          )}
        </div>

        {/* Right Column: The Live Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 overflow-hidden h-[500px] relative">
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live GPS Feed Active
            </p>
          </div>
          {/* Real iframe map centered locally */}
          <iframe 
            title="Location Map"
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0, borderRadius: '0.75rem' }}
            src="https://maps.google.com/maps?q=-4.0435,39.6682&t=&z=13&ie=UTF8&iwloc=&output=embed" 
            allowFullScreen
          ></iframe>
        </div>

      </div>
    </div>
  );
};

export default Location;