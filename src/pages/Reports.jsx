import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, AlertCircle, CheckCircle, Search, ArrowUpDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const reportData = [
    { id: 1, date: "2026-02-18", type: "Vehicle", emission: 12.5, status: "High", location: "Mombasa Rd" },
    { id: 2, date: "2026-02-17", type: "Industrial", emission: 45.2, status: "Critical", location: "Factory Zone A" },
    { id: 3, date: "2026-02-16", type: "Vehicle", emission: 4.2, status: "Low", location: "Kisii Campus" },
    { id: 4, date: "2026-02-15", type: "Industrial", emission: 8.1, status: "Medium", location: "Warehouse B" },
    { id: 5, date: "2026-02-14", type: "Vehicle", emission: 3.8, status: "Low", location: "Nyali Bridge" },
    { id: 6, date: "2026-02-13", type: "Vehicle", emission: 18.3, status: "Critical", location: "Nairobi Highway" },
    { id: 7, date: "2026-02-12", type: "Industrial", emission: 6.5, status: "Low", location: "Processing Plant C" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

const processedData = useMemo(() => {
let filtered = reportData.filter((item) => {
const matchesSearch = item.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
item.type.toLowerCase().includes(searchTerm.toLowerCase());
const matchesStatus = statusFilter === "All" || item.status === statusFilter;
return matchesSearch && matchesStatus;
});

filtered.sort((a, b) => {
if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
return 0;
});

  return filtered;
}, [reportData, searchTerm, statusFilter, sortConfig]);
const downloadPDF = () => {
const doc = new jsPDF();
doc.setFontSize(18);
doc.text("CarbonWise - Emission Report", 14, 22);
doc.setFontSize(11);
doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
doc.text(`Applied Filters - Status: ${statusFilter}`, 14, 36);

doc.autoTable({
startY: 45,
head: [['Date', 'Type', 'Location', 'Emission (kg)', 'Status']],
body: processedData.map(item => [item.date, item.type, item.location, item.emission, item.status]),
theme: 'grid',
headStyles: { fillColor: [22, 163, 74] },
alternateRowStyles: { fillColor: [240, 240, 240] },
});

doc.save("carbon-emission-report.pdf");
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Emission Reports</h1>
          <p className="text-gray-500 mt-1">Manage, filter, and export carbon data</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={20} />
          Export to PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search by location or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="All">All Threat Levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown size={14}/></div>
                </th>
                <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1">Source Type <ArrowUpDown size={14}/></div>
                </th>
                <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">Location <ArrowUpDown size={14}/></div>
                </th>
                <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('emission')}>
                  <div className="flex items-center gap-1">Emissions (Tons) <ArrowUpDown size={14}/></div>
                </th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-700">{item.date}</td>
                  <td className="p-4 font-medium text-gray-800">{item.type}</td>
                  <td className="p-4 text-gray-600">{item.location}</td>
                  <td className="p-4 text-gray-700">{item.emission} tCO2e</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-max
                      ${item.status === 'High' ? 'bg-red-100 text-red-700' : 
                        item.status === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'}`}
                    >
                      {item.status === 'High' ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {processedData.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No emission records found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;