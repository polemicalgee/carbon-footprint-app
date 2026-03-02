import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Sample monthly data
const data = [
  { month: "Jan", emission: 120 },
  { month: "Feb", emission: 98 },
  { month: "Mar", emission: 140 },
  { month: "Apr", emission: 110 },
  { month: "May", emission: 160 },
  { month: "Jun", emission: 130 },
  { month: "Jul", emission: 150 },
  { month: "Aug", emission: 170 },
];

// Modern eco color palette
const colors = [
  "#22c55e",
  "#16a34a",
  "#4ade80",
  "#15803d",
  "#86efac",
  "#166534",
  "#34d399",
  "#059669",
];

export default function BarChartComponent() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Monthly Carbon Emissions
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barSize={38}>
          {/* Light grid */}
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />

          {/* Axes */}
          <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />

          {/* Tooltip styling */}
          <Tooltip
            cursor={{ fill: "rgba(34,197,94,0.1)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
            }}
          />

          {/* Bars */}
          <Bar dataKey="emission" radius={[12, 12, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}