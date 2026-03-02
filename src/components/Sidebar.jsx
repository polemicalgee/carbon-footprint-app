import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const menuItem = (path, label) => {
    const isActive = location.pathname === path;

    return (
      <li
        className={`rounded-lg px-4 py-2 cursor-pointer ${
          isActive ? "bg-green-400" : "hover:bg-green-600"
        }`}
      >
        <Link to={path} className="block w-full">
          {label}
        </Link>
      </li>
    );
  };

  return (
    <div className="w-64 bg-gradient-to-b from-green-500 to-green-700 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">CarbonWise</h1>
        <p className="text-sm opacity-80">Carbon Monitor</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-2 px-4">
          {menuItem("/", "Dashboard")}
          {menuItem("/emissions", "Emissions")}
          {menuItem("/analytics", "Analytics")}
          {menuItem("/reports", "Reports")}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;