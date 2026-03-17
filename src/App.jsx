import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Car, Factory, FileText, BarChart2, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { logout } from './utils/api';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Vehicle = React.lazy(() => import('./pages/Vehicle'));
const Industrial = React.lazy(() => import('./pages/industrial'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Location = React.lazy(() => import('./pages/LocationTrackingPage'));
const Login = React.lazy(() => import('./pages/auth/login'));
const Register = React.lazy(() => import('./pages/auth/register'));

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const SidebarLayout = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/location', label: 'Location Tracking', icon: Map },
    { path: '/vehicle', label: 'Vehicle Emission', icon: Car },
    { path: '/industrial', label: 'Industrial', icon: Factory },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  if (isAuthPage) return <>{children}</>;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <aside className={`w-64 flex flex-col justify-between hidden md:flex border-r transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-black text-[#00a650] tracking-tight">CarbonWise.</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>AI Carbon Monitoring</p>
          </div>

          <nav className="flex flex-col gap-1 px-4 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                    isActive
                      ? 'bg-green-50 text-[#00a650]'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-1`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full font-medium transition-colors text-sm ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg w-full font-medium transition-colors text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <SidebarLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00a650]"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/vehicle" element={<ProtectedRoute><Vehicle /></ProtectedRoute>} />
          <Route path="/industrial" element={<ProtectedRoute><Industrial /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </SidebarLayout>
  </Router>
);

export default App;
