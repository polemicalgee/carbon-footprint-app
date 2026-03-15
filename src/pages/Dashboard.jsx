import React, { useState, useEffect } from 'react';
import { Activity, Leaf, Car, Factory, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (!storedUser) {
          setError("No user found. Please log in.");
          setLoading(false);
          return;
        }

        setUserName(storedUser.name);

        const response = await fetch(`http://localhost:5000/api/reports/${storedUser.id}`);
        const data = await response.json();

        if (response.ok) {
          // Sort data chronologically for the chart
          const sortedData = data.sort((a, b) => new Date(a.date_recorded) - new Date(b.date_recorded));
          setReports(sortedData);
        } else {
          setError(data.message || "Failed to load reports");
        }
      } catch (err) {
        console.error("Backend connection error:", err);
        setError("Could not connect to the server. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const totalEmissions = reports.reduce((sum, report) => sum + Number(report.emissions), 0).toFixed(2);

  // Prepare data specifically for the chart
  const chartData = reports.map(report => ({
    date: new Date(report.date_recorded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    emissions: Number(report.emissions),
    activity: report.activity_type
  }));

  // Custom Tooltip for the chart hover effect
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-[#00a650] font-semibold">
            {payload[0].value} <span className="text-sm font-normal text-gray-500">kg CO₂</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{payload[0].payload.activity}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, <span className="capitalize font-semibold text-[#00a650]">{userName || 'User'}</span>! Here is your carbon footprint overview.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Emissions</p>
            <h3 className="text-3xl font-black text-gray-900">{totalEmissions} <span className="text-base font-medium text-gray-500">kg CO₂</span></h3>
          </div>
          <div className="bg-green-100 p-4 rounded-full text-[#00a650]">
            <Leaf size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Logged Activities</p>
            <h3 className="text-3xl font-black text-gray-900">{reports.length}</h3>
          </div>
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            <Activity size={28} />
          </div>
        </div>
      </div>

      {/* NEW: Carbon Emission Rate Chart */}
      {!loading && !error && reports.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Emission Rate Over Time</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="#00a650" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00a650', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#00a650', strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Your Recent Logs</h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : reports.length === 0 && !error ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No activities logged yet</h3>
              <p className="text-gray-500 mt-1">Head over to the Vehicle or Industrial tabs to log your first footprint.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Displaying in reverse so newest is first in the list */}
              {[...reports].reverse().slice(0, 6).map((report) => (
                <div key={report.id} className="p-5 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    {report.activity_type.toLowerCase().includes('vehicle') || report.activity_type.toLowerCase().includes('route') ? (
                      <Car className="text-blue-500" size={20} />
                    ) : (
                      <Factory className="text-purple-500" size={20} />
                    )}
                    <h3 className="font-bold text-gray-800 text-sm truncate">{report.activity_type}</h3>
                  </div>
                  <p className="text-2xl font-black text-[#00a650]">
                    {report.emissions} <span className="text-sm font-normal text-gray-500">kg CO₂</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-4 font-medium uppercase tracking-wider">
                    {new Date(report.date_recorded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
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