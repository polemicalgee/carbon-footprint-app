import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BrainCircuit, AlertCircle, Loader2 } from 'lucide-react';
import { apiCall, getUser } from '../utils/api';

const COLORS = ['#00a650', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const Analytics = () => {
  const [reports, setReports] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState('');
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiCall(`/api/reports/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.sort((a, b) => new Date(a.date_recorded) - new Date(b.date_recorded)));
      }
    } catch { }
    setLoading(false);
  };

  const runForecast = async () => {
    const values = reports.map(r => Number(r.emissions));
    if (values.length < 3) { setForecastError('Log at least 3 activities to run the forecast.'); return; }
    setLoadingForecast(true);
    setForecastError('');
    try {
      const res = await apiCall('/api/forecast', {
        method: 'POST',
        body: JSON.stringify({ values })
      });
      if (!res) return;
      const data = await res.json();
      if (res.ok) setForecast(data);
      else setForecastError(data.message || 'Forecast failed');
    } catch {
      setForecastError('Could not reach the ML service. Ensure predict_service.py is running.');
    }
    setLoadingForecast(false);
  };

  
  const totalEmissions = reports.reduce((s, r) => s + Number(r.emissions), 0);
  const categoryMap = {};
  reports.forEach(r => {
    const cat = getCategoryLabel(r.activity_type);
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(r.emissions);
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const scopeMap = { 1: 0, 2: 0, 3: 0 };
  reports.forEach(r => { scopeMap[r.scope || 1] += Number(r.emissions); });
  const scopeData = [
    { name: 'Scope 1\nDirect', value: parseFloat(scopeMap[1].toFixed(2)), fill: '#00a650' },
    { name: 'Scope 2\nEnergy', value: parseFloat(scopeMap[2].toFixed(2)), fill: '#3b82f6' },
    { name: 'Scope 3\nSupply Chain', value: parseFloat(scopeMap[3].toFixed(2)), fill: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const monthlyMap = {};
  reports.forEach(r => {
    const key = new Date(r.date_recorded).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(r.emissions);
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, emissions]) => ({ month, emissions: parseFloat(emissions.toFixed(2)) }));

  const forecastChartData = forecast ? [
    ...reports.slice(-7).map(r => ({
      date: new Date(r.date_recorded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      historical: Number(r.emissions)
    })),
    ...forecast.forecast.slice(0, 14).map(f => ({
      date: new Date(f.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      predicted: f.predicted,
      lower: f.lower,
      upper: f.upper
    }))
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <Loader2 className="animate-spin text-[#00a650]" size={36} />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 mt-1">AI-powered insights into your carbon footprint patterns</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
          <AlertCircle className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="font-bold text-gray-700 text-lg">No data yet</h3>
          <p className="text-gray-500 text-sm mt-1">Log activities in the Vehicle or Industrial tabs to see analytics here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Emissions', value: `${totalEmissions.toFixed(1)} kg`, color: 'text-[#00a650]' },
              { label: 'Activities', value: reports.length, color: 'text-blue-600' },
              { label: 'Avg per Activity', value: `${(totalEmissions / reports.length).toFixed(1)} kg`, color: 'text-purple-600' },
              { label: 'Top Source', value: categoryData[0]?.name || '–', color: 'text-amber-600' }
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Emissions by Category</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} kg CO₂`, 'Emissions']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Trend</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} kg CO₂`, 'Emissions']} />
                    <Line type="monotone" dataKey="emissions" stroke="#00a650" strokeWidth={2} dot={{ r: 4, fill: '#00a650' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {scopeData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">GHG Scope Distribution</h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={scopeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {scopeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} kg CO₂`]} />
                      <Legend iconSize={10} iconType="circle" formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-[#00a650]" size={22} />
                <h2 className="text-lg font-bold text-gray-900">AI Emission Forecast (Next 14 Days)</h2>
              </div>
              <button
                onClick={runForecast}
                disabled={loadingForecast}
                className="flex items-center gap-2 bg-[#00a650] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loadingForecast ? <><Loader2 size={15} className="animate-spin" /> Running...</> : 'Run Forecast'}
              </button>
            </div>

            {forecastError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{forecastError}</div>
            )}

            {forecast && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">30-Day Estimate</p>
                    <p className="text-lg font-black text-gray-900">{forecast.monthly_estimate} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Trend</p>
                    <p className={`text-lg font-black flex items-center gap-1 ${
                      forecast.trend === 'increasing' ? 'text-red-500' :
                      forecast.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {forecast.trend === 'increasing' ? <TrendingUp size={18} /> :
                       forecast.trend === 'decreasing' ? <TrendingDown size={18} /> : <Minus size={18} />}
                      {forecast.trend}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Change vs Now</p>
                    <p className={`text-lg font-black ${forecast.trend_percent > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {forecast.trend_percent > 0 ? '+' : ''}{forecast.trend_percent}%
                    </p>
                  </div>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip />
                      <ReferenceLine x={forecastChartData[reports.slice(-7).length - 1]?.date} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: 'Today', position: 'top', fontSize: 11, fill: '#9ca3af' }} />
                      <Line type="monotone" dataKey="historical" stroke="#00a650" strokeWidth={2} dot={{ r: 3 }} name="Historical" />
                      <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Forecast" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Model: {forecast.model === 'neural_network' ? 'Neural Network (MLP)' : 'Linear Trend'}. Forecast includes ±15% confidence band.
                </p>
              </>
            )}

            {!forecast && !loadingForecast && !forecastError && (
              <div className="text-center py-8 text-gray-400">
                <BrainCircuit size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Run Forecast" to generate AI predictions based on your emission history.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function getCategoryLabel(activityType) {
  const t = activityType.toLowerCase();
  if (t.includes('vehicle') || t.includes('petrol') || t.includes('diesel') || t.includes('hybrid') || t.includes('electric')) return 'Vehicle';
  if (t.includes('route') || t.includes('travel') || t.includes('commute')) return 'Travel';
  if (t.includes('industrial') || t.includes('coal') || t.includes('gas') || t.includes('renewable')) return 'Industrial';
  if (t.includes('electricity') || t.includes('grid') || t.includes('energy')) return 'Energy';
  return 'Other';
}

export default Analytics;
