import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Car, Factory, FileText, LogOut, ShieldCheck } from 'lucide-react';
import Reports from './pages/Reports';
const Placeholder = ({ title, developer }) => (
<div className="flex items-center justify-center h-full min-h-screen bg-gray-50">
<div className="text-center">
<h2 className="text-3xl font-bold text-gray-400 mb-2">{title} Page</h2>
<p className="text-gray-500 text-lg">
Under Construction by: <span className="font-semibold text-green-600">{developer}</span>
</p>
</div>
</div>
);

const Sidebar = () => {
const location = useLocation();
  
const isActive = (path) => location.pathname === path 
? "flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-600 font-medium transition" 
: "flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-green-600 transition";

return (
<aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
<div className="p-6 border-b border-gray-100">
<h1 className="text-2xl font-black text-green-600 tracking-tight">CarbonWise<span className="text-green-400">.</span></h1>
</div>
      
<nav className="flex-1 p-4 space-y-2 overflow-y-auto">
<Link to="/" className={isActive("/")}> 
<LayoutDashboard size={20} /> Dashboard
</Link>
<Link to="/location" className={isActive("/location")}>
<Map size={20} /> Location Tracking
</Link>
<Link to="/vehicle" className={isActive("/vehicle")}>
<Car size={20} /> Vehicle Emission
</Link>
<Link to="/industrial" className={isActive("/industrial")}>
<Factory size={20} /> Industrial
</Link>
<Link to="/reports" className={isActive("/reports")}>
<FileText size={20} /> Reports
</Link>
        
<Link to="/login" className={isActive("/login")}>
<ShieldCheck size={20} /> Authentication
</Link>
</nav>

<div className="p-4 border-t border-gray-100">
<Link to="/login" className="flex items-center gap-3 p-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition">
<LogOut size={20} /> Logout
</Link>
</div>
</aside>  );
};

function App() {
  return (
<Router>
<div className="flex min-h-screen bg-gray-50 font-sans">
<Sidebar />
<main className="flex-1 overflow-x-hidden">
<Routes>
          
<Route path="/" element={<Placeholder title="Dashboard" developer="Faith" />} />
<Route path="/location" element={<Placeholder title="Location Tracking" developer="Watiri" />} />
<Route path="/vehicle" element={<Placeholder title="Vehicle Emission" developer="Jackie" />} />
<Route path="/industrial" element={<Placeholder title="Industrial Emission Monitoring" developer="Berlin" />} />
<Route path="/login" element={<Placeholder title="Login & Authentication" developer="Mercy" />} />
<Route path="/reports" element={<Reports />} />
</Routes>
</main>
</div>
</Router>  );
}

export default App;