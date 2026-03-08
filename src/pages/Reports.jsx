import React, { useState, useEffect } from 'react';
import { FileText, Trash2, AlertCircle, BarChart3, Download, Activity } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch the data when the page loads
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));

      if (!storedUser) {
        setError("No user found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/reports/${storedUser.id}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data);
      } else {
        setError(data.message || "Failed to load reports");
      }
    } catch (err) {
      console.error("Backend connection error:", err);
      setError("Could not connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // 2. The Bridge: Delete a specific report
  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this carbon record?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Optimistic UI update: instantly remove from screen
        setReports(reports.filter((report) => report.id !== reportId));
      } else {
        alert("Failed to delete the report.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not connect to the server to delete.");
    }
  };

  // Calculate some quick stats for the header
  const totalEmissions = reports.reduce((sum, r) => sum + Number(r.emissions), 0).toFixed(2);
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FileText className="text-[#00a650]" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">Manage, review, and export your complete carbon history.</p>
          </div>
        </div>
        
        {/* Fake Export Button for presentation wow-factor */}
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Analytics Summary Cards */}
      {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-[#00a650]">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Lifetime Emissions</p>
              <h3 className="text-2xl font-black text-gray-900">{totalEmissions} <span className="text-sm font-medium text-gray-500">kg CO₂</span></h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Activities Logged</p>
              <h3 className="text-2xl font-black text-gray-900">{reports.length} <span className="text-sm font-medium text-gray-500">records</span></h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Detailed Emissions Log</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 font-medium animate-pulse">
            Loading your analytics data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="p-5">Activity Type</th>
                  <th className="p-5">Emissions</th>
                  <th className="p-5">Date Logged</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.length === 0 && !error ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="text-gray-300 mb-3" size={40} />
                        <p className="text-lg font-medium text-gray-900">No data available yet.</p>
                        <p className="text-sm">Head to the Vehicle or Industrial tabs to log your first activity.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-5 font-semibold text-gray-800">
                        {report.activity_type}
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-50 text-[#00a650] border border-green-100">
                          {report.emissions} kg CO₂
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 text-sm font-medium">
                        {new Date(report.date_recorded).toLocaleDateString(undefined, { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => handleDelete(report.id)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;