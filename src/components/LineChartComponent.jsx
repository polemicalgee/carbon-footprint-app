import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function LineChartComponent() {
  const data = [
    { month: "Jan", value: 200 },
    { month: "Feb", value: 240 },
    { month: "Mar", value: 220 },
    { month: "Apr", value: 260 },
    { month: "May", value: 280 },
    { month: "Jun", value: 300 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-lg font-semibold mb-4">
        AI Emission Prediction (LSTM)
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartComponent;