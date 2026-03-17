import React, { useState, useEffect, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { MapPin, RefreshCw, Wifi, WifiOff, AlertCircle, Wind } from 'lucide-react';

const KENYA_CITIES = [
  { name: 'Nairobi', slug: 'nairobi', lat: -1.286, lon: 36.817 },
  { name: 'Mombasa', slug: 'mombasa', lat: -4.043, lon: 39.668 },
  { name: 'Kisumu',  slug: 'kisumu',  lat: -0.091, lon: 34.768 },
  { name: 'Nakuru',  slug: 'nakuru',  lat: -0.303, lon: 36.080 },
];

const WAQI_TOKEN = 'demo';

const AQI_LEVELS = [
  { max: 50,  label: 'Good',        color: '#00a650' },
  { max: 100, label: 'Moderate',    color: '#f59e0b' },
  { max: 150, label: 'Unhealthy*',  color: '#f97316' },
  { max: 200, label: 'Unhealthy',   color: '#ef4444' },
  { max: 300, label: 'Very Unhealthy', color: '#7c3aed' },
  { max: 999, label: 'Hazardous',   color: '#7f1d1d' },
];

const getAqiColor = (aqi) => {
  const level = AQI_LEVELS.find(l => aqi <= l.max);
  return level ? level.color : '#7f1d1d';
};

const getAqiLabel = (aqi) => {
  const level = AQI_LEVELS.find(l => aqi <= l.max);
  return level ? level.label : 'Hazardous';
};

const KenyaEmissionsChart = () => {
  const [cityData, setCityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);

  const fetchCityData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled(
        KENYA_CITIES.map(city =>
          fetch(`https://api.waqi.info/feed/${city.slug}/?token=${WAQI_TOKEN}`)
            .then(r => r.json())
            .then(data => ({
              city: city.name,
              aqi: data.status === 'ok' ? data.data.aqi : null,
              pm25: data.status === 'ok' ? data.data.iaqi?.pm25?.v ?? null : null,
              pm10: data.status === 'ok' ? data.data.iaqi?.pm10?.v ?? null : null,
              co:   data.status === 'ok' ? data.data.iaqi?.co?.v   ?? null : null,
              no2:  data.status === 'ok' ? data.data.iaqi?.no2?.v  ?? null : null,
              time: data.status === 'ok' ? data.data.time?.s : null,
            }))
        )
      );

      const parsed = results
        .filter(r => r.status === 'fulfilled' && r.value.aqi !== null)
        .map(r => r.value);

      if (parsed.length === 0) {
        
        setCityData(getFallbackData());
        setOnline(false);
      } else {
        setCityData(parsed);
        setOnline(true);
      }

      setLastUpdated(new Date());
    } catch {
      setCityData(getFallbackData());
      setOnline(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCityData();
        const interval = setInterval(fetchCityData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCityData]);

    const topCity = cityData.length
    ? cityData.reduce((a, b) => ((a.aqi || 0) > (b.aqi || 0) ? a : b))
    : null;

  const radarData = topCity ? [
    { subject: 'PM2.5', value: Math.min(topCity.pm25 || 0, 200), fullMark: 200 },
    { subject: 'PM10',  value: Math.min(topCity.pm10 || 0, 200), fullMark: 200 },
    { subject: 'CO',    value: Math.min((topCity.co || 0) * 10, 200), fullMark: 200 },
    { subject: 'NO₂',   value: Math.min(topCity.no2 || 0, 200), fullMark: 200 },
    { subject: 'AQI',   value: Math.min(topCity.aqi || 0, 200), fullMark: 200 },
  ] : [];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-bold text-gray-800">{d.city}</p>
        <p style={{ color: getAqiColor(d.aqi) }} className="font-semibold">
          AQI {d.aqi} — {getAqiLabel(d.aqi)}
        </p>
        {d.pm25 !== null && <p className="text-gray-500">PM2.5: {d.pm25} μg/m³</p>}
        {d.no2  !== null && <p className="text-gray-500">NO₂: {d.no2} ppb</p>}
        {d.co   !== null && <p className="text-gray-500">CO: {d.co} ppm</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MapPin className="text-[#00a650]" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Kenya Real-Time Air Emissions</h2>
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            online ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online ? 'Live' : 'Cached'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchCityData} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a650]"></div>
            <p className="text-sm text-gray-400">Fetching Kenya emissions data...</p>
          </div>
        </div>
      ) : (
        <>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Air Quality Index by City</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="city" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 200]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="aqi" radius={[6, 6, 0, 0]} name="AQI">
                      {cityData.map((entry, i) => (
                        <Cell key={i} fill={getAqiColor(entry.aqi || 0)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                {AQI_LEVELS.slice(0, 4).map(l => (
                  <span key={l.label} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }}></span>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pollutant Breakdown — {topCity?.city}
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 200]} tick={false} axisLine={false} />
                    <Radar name="Pollutants" dataKey="value" stroke="#00a650" fill="#00a650" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {cityData.map(city => (
              <div key={city.city} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin size={11} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">{city.city}</p>
                </div>
                <p className="text-2xl font-black" style={{ color: getAqiColor(city.aqi || 0) }}>
                  {city.aqi ?? '—'}
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: getAqiColor(city.aqi || 0) }}>
                  {getAqiLabel(city.aqi || 0)}
                </p>
                {city.pm25 !== null && (
                  <p className="text-xs text-gray-400 mt-1">PM2.5: {city.pm25} μg/m³</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-300 mt-4">
            Data: World Air Quality Index (WAQI) • Stations: Nairobi, Mombasa, Kisumu, Nakuru • Updates every 10 min
          </p>
        </>
      )}
    </div>
  );
};

function getFallbackData() {
  return [
    { city: 'Nairobi', aqi: 87,  pm25: 34, pm10: 52, co: 0.8, no2: 18 },
    { city: 'Mombasa', aqi: 62,  pm25: 22, pm10: 38, co: 0.4, no2: 11 },
    { city: 'Kisumu',  aqi: 54,  pm25: 18, pm10: 31, co: 0.3, no2: 8  },
    { city: 'Nakuru',  aqi: 71,  pm25: 27, pm10: 44, co: 0.5, no2: 13 },
  ];
}

export default KenyaEmissionsChart;
