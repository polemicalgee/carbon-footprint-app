import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Emissions from "./pages/Emissions";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Car, Factory, FileText, LogOut, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

const Reports = React.lazy(() => import('./pages/Reports'));
const Login = React.lazy(() => import('./pages/auth/login'));
const Register = React.lazy(() => import('./pages/auth/register'));
const Vehicle = React.lazy(() => import('./pages/Vehicle'));
const LocationTrackingPage = React.lazy(() => import('./pages/LocationTrackingPage'));

const PageLoader = () => {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-center h-full min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className={`w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin`}></div>
        <p className={isDark ? "text-gray-400" : "text-gray-500"}>Loading...</p>
      </div>
    </div>
  );
};

const Placeholder = ({ title, developer }) => {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-center h-full min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{title} Page</h2>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Under Construction by: <span className="font-semibold text-green-600">{developer}</span>
        </p>
      </div>
    </div>
  );
};

const NotFound = () => {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-center h-full min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <h2 className={`text-4xl font-bold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>404</h2>
        <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Page not found</p>
        <Link to="/" className="text-green-600 hover:text-green-700 underline">Return to Dashboard</Link>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  
  const isActive = (path) => location.pathname === path 
    ? `flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-green-900 text-green-400' : 'bg-green-50 text-green-600'} font-medium transition` 
    : `flex items-center gap-3 p-3 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-green-400' : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'} transition`;

  return (
    <aside className={`w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col h-screen sticky top-0`}>
      <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
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

      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} space-y-2`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 p-3 w-full rounded-lg transition ${
            isDark 
              ? 'text-yellow-400 hover:bg-gray-700' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <Link to="/login" className={`flex items-center gap-3 p-3 w-full rounded-lg transition ${isDark ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-20' : 'text-red-600 hover:bg-red-50'}`}>
          <LogOut size={20} /> Logout
        </Link>
      </div>
    </aside>
  );
};

function App() {
  const { isDark } = useTheme();
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/emissions" element={<Emissions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
      <React.Suspense fallback={<PageLoader />}>
        <div className={`flex min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} font-sans`}>
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Placeholder title="Dashboard" developer="Faith" />} />
              <Route path="/location" element={<LocationTrackingPage />} />
              <Route path="/vehicle" element={<Vehicle />} />
              <Route path="/industrial" element={<Placeholder title="Industrial Emission Monitoring" developer="Berlin" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reports" element={<Reports />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </React.Suspense>
    </Router>
  );
}

export default App;
