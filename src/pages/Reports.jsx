import React, { useState, useEffect } from 'react';
import { FileText, Trash2, AlertCircle, BarChart3, Download, Activity, FileDown } from 'lucide-react';
import { apiCall, getUser } from '../utils/api';

const scopeColors = {
  1: 'bg-green-50 text-green-700 border-green-100',
  2: 'bg-blue-50 text-blue-700 border-blue-100',
  3: 'bg-purple-50 text-purple-700 border-purple-100'
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const user = getUser();

  useEffect(() => {
    if (!user) { setError('No user found. Please log in.'); setLoading(false); return; }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiCall(`/api/reports/${user.id}`);
      const data = await res.json();
      if (res.ok) setReports(data);
      else setError(data.message || 'Failed to load reports');
    } catch {
      setError('Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this carbon record?')) return;
    try {
      const res = await apiCall(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) setReports(reports.filter(r => r.id !== reportId));
      else alert('Failed to delete the report.');
    } catch {
      alert('Could not connect to the server to delete.');
    }
  };

  const exportCSV = () => {
    const filtered = getFilteredReports();
    const headers = ['ID', 'Activity Type', 'Emissions (kg CO2)', 'Scope', 'Date Recorded'];
    const rows = filtered.map(r => [
      r.id,
      `"${r.activity_type.replace(/"/g, '""')}"`,
      r.emissions,
      r.scope || 1,
      new Date(r.date_recorded).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbonwise_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    try {
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        
        window.print();
        return;
      }
      const doc = new jsPDF();
      const filtered = getFilteredReports();
      doc.setFontSize(18);
      doc.setTextColor(0, 166, 80);
      doc.text('CarbonWise Emissions Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | User: ${user?.name}`, 14, 28);
      doc.text(`Total: ${totalEmissions} kg CO₂ across ${filtered.length} activities`, 14, 34);

      let y = 45;
      doc.setFontSize(9);
      doc.setTextColor(0);
      filtered.forEach((r, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${i + 1}. ${r.activity_type.substring(0, 50)}`, 14, y);
        doc.text(`${r.emissions} kg CO₂`, 150, y);
        doc.text(new Date(r.date_recorded).toLocaleDateString(), 175, y);
        y += 7;
      });

      doc.save(`carbonwise_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      exportCSV(); 
    }
  };

  const getFilteredReports = () =>
    scopeFilter === 'all' ? reports : reports.filter(r => String(r.scope || 1) === String(scopeFilter));

  const filtered = getFilteredReports();
  const totalEmissions = filtered.reduce((sum, r) => sum + Number(r.emissions), 0).toFixed(2);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FileText className="text-[#00a650]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage, review, and export your complete carbon history.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-[#00a650] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm font-medium text-sm">
            <FileDown size={16} /> Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700 font-medium text-sm">{error}</p>
        </div>
      )}

      
      {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-[#00a650]"><BarChart3 size={22} /></div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Emissions (filtered)</p>
              <h3 className="text-xl font-black text-gray-900">{totalEmissions} <span className="text-sm font-medium text-gray-400">kg CO₂</span></h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500"><Activity size={22} /></div>
            <div>
              <p className="text-xs font-medium text-gray-400">Activities (filtered)</p>
              <h3 className="text-xl font-black text-gray-900">{filtered.length} <span className="text-sm font-medium text-gray-400">records</span></h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-500"><FileText size={22} /></div>
            <div>
              <p className="text-xs font-medium text-gray-400">Avg per Activity</p>
              <h3 className="text-xl font-black text-gray-900">{filtered.length ? (totalEmissions / filtered.length).toFixed(2) : '0.00'} <span className="text-sm font-medium text-gray-400">kg CO₂</span></h3>
            </div>
          </div>
        </div>
      )}

      {reports.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 font-medium">Filter by scope:</span>
          {['all', '1', '2', '3'].map(s => (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                scopeFilter === s ? 'bg-[#00a650] text-white border-[#00a650]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s === 'all' ? 'All' : `Scope ${s}`}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Detailed Emissions Log</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400 animate-pulse">Loading analytics data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="p-4">Activity Type</th>
                  <th className="p-4">Emissions</th>
                  <th className="p-4">Scope</th>
                  <th className="p-4">Date Logged</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-400">
                      <FileText className="text-gray-200 mx-auto mb-3" size={36} />
                      <p className="font-medium text-gray-600">No data for this filter.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 font-medium text-gray-800 text-sm">{report.activity_type}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-green-50 text-[#00a650] border border-green-100">
                          {report.emissions} kg CO₂
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${scopeColors[report.scope || 1]}`}>
                          Scope {report.scope || 1}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(report.date_recorded).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
