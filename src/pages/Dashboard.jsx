import React, { useState, useEffect } from 'react';
import { Activity, Leaf, Car, Factory, AlertCircle, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiCall, getUser } from '../utils/api';
import KenyaEmissionsChart from '../components/KenyaEmissionsChart';
import KenyaCarbonHeatmap from '../components/KenyaHeatmap';

const scopeColors = { 1: 'bg-blue-100 text-blue-700', 2: 'bg-purple-100 text-purple-700', 3: 'bg-orange-100 text-orange-700' };
const scopeLabels = { 1: 'Scope 1 – Direct', 2: 'Scope 2 – Energy', 3: 'Scope 3 – Supply Chain' };

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anomalies, setAnomalies] = useState([]);
  const user = getUser();

  useEffect(() => {
    if (!user) { setError('Please log in.'); setLoading(false); return; }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiCall(`/api/reports/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        const sorted = data.sort((a, b) => new Date(a.date_recorded) - new Date(b.date_recorded));
        setReports(sorted);
        detectAnomalies(sorted);
      } else {
        setError(data.message || 'Failed to load reports');
      }
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = (data) => {
    if (data.length < 4) return;
    const values = data.map(r => Number(r.emissions));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    const found = data.filter(r => std > 0 && Math.abs((Number(r.emissions) - mean) / std) > 2);
    setAnomalies(found);
  };

  const totalEmissions = reports.reduce((sum, r) => sum + Number(r.emissions), 0).toFixed(2);
  const avgEmission = reports.length ? (totalEmissions / reports.length).toFixed(2) : '0.00';

  const scopeBreakdown = reports.reduce((acc, r) => {
    const s = r.scope || 1;
    acc[s] = (acc[s] || 0) + Number(r.emissions);
    return acc;
  }, {});

  const chartData = reports.slice(-30).map(r => ({
    date: new Date(r.date_recorded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    emissions: Number(r.emissions),
    activity: r.activity_type
  }));

  const recentTrend = () => {
    if (reports.length < 4) return null;
    const recent = reports.slice(-5).map(r => Number(r.emissions));
    const older = reports.slice(-10, -5).map(r => Number(r.emissions));
    if (!older.length) return null;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const pct = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
    return { pct, direction: recentAvg > olderAvg ? 'up' : 'down' };
  };

  const trend = recentTrend();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-bold text-gray-800 text-sm">{label}</p>
        <p className="text-[#00a650] font-semibold">{payload[0].value} <span className="text-xs text-gray-500">kg CO₂</span></p>
        <p className="text-xs text-gray-400 mt-1">{payload[0].payload.activity}</p>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, <span className="capitalize font-semibold text-[#00a650]">{user?.name || 'User'}</span>! Here's your carbon footprint overview.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700 font-medium text-sm">{error}</p>
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="font-bold text-amber-800">Anomaly Detected</h3>
          </div>
          <p className="text-amber-700 text-sm">
            {anomalies.length} emission{anomalies.length > 1 ? 's' : ''} significantly above your average:{' '}
            {anomalies.slice(0, 2).map(a => `${a.activity_type} (${a.emissions} kg)`).join(', ')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Emissions</p>
            <h3 className="text-3xl font-black text-gray-900">{totalEmissions} <span className="text-base font-medium text-gray-400">kg CO₂</span></h3>
          </div>
          <div className="bg-green-100 p-4 rounded-full text-[#00a650]"><Leaf size={26} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Logged Activities</p>
            <h3 className="text-3xl font-black text-gray-900">{reports.length}</h3>
            {trend && (
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${trend.direction === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(trend.pct)}% vs previous 5 logs
              </p>
            )}
          </div>
          <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Activity size={26} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Avg per Activity</p>
            <h3 className="text-3xl font-black text-gray-900">{avgEmission} <span className="text-base font-medium text-gray-400">kg CO₂</span></h3>
          </div>
          <div className="bg-purple-100 p-4 rounded-full text-purple-600">
            <Minus size={26} />
          </div>
        </div>
      </div>

      {Object.keys(scopeBreakdown).length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">GHG Protocol Scope Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${scopeColors[s]}`}>{scopeLabels[s]}</span>
                <p className="text-2xl font-black text-gray-900">{(scopeBreakdown[s] || 0).toFixed(1)} <span className="text-sm font-normal text-gray-400">kg</span></p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalEmissions > 0 ? ((scopeBreakdown[s] || 0) / totalEmissions * 100).toFixed(1) : '0'}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Emission Rate Over Time</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dx={-8} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="emissions" stroke="#00a650" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#00a650', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <KenyaEmissionsChart />
      <KenyaCarbonHeatmap />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Logs</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-200 rounded"></div>)}
            </div>
          ) : reports.length === 0 && !error ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Leaf className="text-gray-400" size={28} />
              </div>
              <h3 className="font-semibold text-gray-900">No activities logged yet</h3>
              <p className="text-gray-500 text-sm mt-1">Head to the Vehicle or Industrial tabs to log your first footprint.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...reports].reverse().slice(0, 6).map((report) => (
                <div key={report.id} className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    {report.activity_type.toLowerCase().includes('vehicle') || report.activity_type.toLowerCase().includes('route')
                      ? <Car className="text-blue-400" size={16} />
                      : <Factory className="text-purple-400" size={16} />}
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{report.activity_type}</h3>
                  </div>
                  <p className="text-2xl font-black text-[#00a650]">
                    {report.emissions} <span className="text-xs font-normal text-gray-400">kg CO₂</span>
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">{new Date(report.date_recorded).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    {report.scope && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scopeColors[report.scope] || 'bg-gray-100 text-gray-500'}`}>S{report.scope}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
