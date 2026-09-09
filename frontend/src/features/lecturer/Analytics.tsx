import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Analytics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/lecturer/analytics").then((r) => setData(r.data.data));
  }, []);

  const weeklyData = {
    labels: data?.weekly?.map((w: any) => w.week) || [],
    datasets: [
      {
        label: "Rate %",
        data: data?.weekly?.map((w: any) => w.rate) || [],
        backgroundColor: "#34d399",
        borderRadius: 4,
      },
    ],
  };

  const monthlyData = {
    labels: data?.monthly?.map((m: any) => m.month) || [],
    datasets: [
      {
        label: "Rate %",
        data: data?.monthly?.map((m: any) => m.rate) || [],
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const unitData = {
    labels: data?.byUnit?.map((u: any) => u.name) || [],
    datasets: [
      {
        data: data?.byUnit?.map((u: any) => u.rate) || [],
        backgroundColor: [
          "#34d399",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#06b6d4",
          "#f97316",
          "#64748b",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        My Analytics
      </h1>

      {/* Top Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Average Rate
          </p>
          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {data?.avgRate || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all units</p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
            Best Performing
          </p>
          <p className="text-lg font-bold text-emerald-400 truncate">
            {data?.best?.name || "N/A"}
          </p>
          <p className="text-sm text-slate-400">
            {data?.best?.rate || 0}% attendance
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
            Needs Attention
          </p>
          <p className="text-lg font-bold text-rose-400 truncate">
            {data?.worst?.name || "N/A"}
          </p>
          <p className="text-sm text-slate-400">
            {data?.worst?.rate || 0}% attendance
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Total Units
          </p>
          <p className="text-4xl font-bold text-blue-400 mt-2">
            {data?.byUnit?.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Being tracked</p>
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">
            Weekly Trend (Last 12 Weeks)
          </h3>
          <div className="h-64">
            <Bar
              data={weeklyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false, color: "#475569" },
                    ticks: { color: "#94a3b8" },
                  },
                  y: {
                    grid: { color: "#334155" },
                    ticks: { color: "#94a3b8" },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">
            Monthly Trend (Last 6 Months)
          </h3>
          <div className="h-64">
            <Line
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false, color: "#475569" },
                    ticks: { color: "#94a3b8" },
                  },
                  y: {
                    grid: { color: "#334155" },
                    ticks: { color: "#94a3b8" },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Unit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">
            Unit Performance Comparison
          </h3>
          <div className="space-y-4">
            {data?.byUnit?.map((u: any) => (
              <div key={u.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{u.name}</span>
                  <span
                    className={`font-bold ${parseFloat(u.rate) >= 75 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {u.rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, parseFloat(u.rate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={unitData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#94a3b8",
                      padding: 16,
                      font: { size: 11 },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Intervention List */}
      <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Intervention Needed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.byUnit
            ?.filter((u: any) => parseFloat(u.rate) < 60)
            .map((u: any) => (
              <div
                key={u.name}
                className="bg-rose-900/10 border border-rose-800/50 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                  !
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-rose-400">
                    Attendance at {u.rate}% — consider follow-up
                  </p>
                </div>
              </div>
            ))}
          {data?.byUnit?.filter((u: any) => parseFloat(u.rate) < 60).length ===
            0 && (
            <p className="text-slate-500 text-sm col-span-full">
              All units are above intervention threshold. Great work!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
