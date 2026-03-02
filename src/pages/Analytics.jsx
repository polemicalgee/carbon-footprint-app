import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Analytics() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 bg-gray-100 flex flex-col">
        <Navbar />

        <div className="p-8">
          <h2 className="text-2xl font-bold">Analytics Page</h2>
          <p className="text-gray-600 mt-2">
            AI insights and trends will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;