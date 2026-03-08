import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Car, Factory, FileText, ShieldCheck, LogOut } from 'lucide-react';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Vehicle = React.lazy(() => import('./pages/Vehicle'));
const Industrial = React.lazy(() => import('./pages/industrial'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/register')); // Adjust casing if needed
const Location = React.lazy(() => import('./pages/LocationTrackingPage'));
// Sidebar Component matching your screenshot
const SidebarLayout = ({ children }) => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/location', label: 'Location Tracking', icon: Map },
    { path: '/vehicle', label: 'Vehicle Emission', icon: Car },
    { path: '/industrial', label: 'Industrial', icon: Factory },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/login', label: 'Authentication', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-black text-[#00a650] tracking-tight">CarbonWise.</h1>
          </div>
          
          <nav className="flex flex-col gap-1 px-4 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-green-50 text-[#00a650]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg w-full font-medium transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <SidebarLayout>
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicle" element={<Vehicle />} />
            <Route path="/industrial" element={<Industrial />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/" element={<Login />} />
            <Route path="/location" element={<Location />} />
          </Routes>
        </Suspense>
      </SidebarLayout>
    </Router>
  );
};

export default App;