import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import LineChartComponent from "../components/LineChartComponent";
import BarChartComponent from "../components/BarChartComponent";

function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 bg-gray-100 flex flex-col">
        <Navbar />

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Total Emissions" value="2.4 tCO₂" />
            <StatCard title="Predicted Risk" value="Low" color="text-green-600" />
            <StatCard title="Carbon Score" value="82%" />
            <StatCard title="Active Alerts" value="3" color="text-red-500" />
          </div>

          <LineChartComponent />
          <BarChartComponent />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;