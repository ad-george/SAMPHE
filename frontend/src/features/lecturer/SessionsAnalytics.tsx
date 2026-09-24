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
import { Bar, Doughnut } from "react-chartjs-2";

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

const SessionsAnalytics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/lecturer/analytics/sessions").then((r) => setData(r.data.data));
  }, []);

  const weeklyData = {
    labels: data?.weekly?.map((w: any) => w.week) || [],
    datasets: [
      {
        label: "Delivery %",
        data: data?.weekly?.map((w: any) => w.rate) || [],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
    ],
  };

  // 🔧 FIX: parse rate to number for the donut chart
  // Previously used raw u.rate (strings from the API), which Chart.js
  // doesn't handle for pie/doughnut slices → nothing rendered.
  const unitData = {
    labels: data?.byUnit?.map((u: any) => u.name) || [],
    datasets: [
      {
        data: data?.byUnit?.map((u: any) => parseFloat(u.rate) || 0) || [],
        backgroundColor: [
          "#3b82f6",
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
    <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
      <h1 className="text-base md:text-2xl font-bold text-black tracking-tight">
        My Sessions Analytics
      </h1>

      {/* Top Insight Cards — 4 in one row on mobile */}
      <div className="grid grid-cols-4 gap-1 md:gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-6 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium leading-tight">
            Avg Delivery
          </p>
          <p className="text-[11px] md:text-4xl font-bold text-blue-400 leading-tight">
            {data?.avgRate || 0}%
          </p>
          <p className="hidden md:block text-xs text-slate-500 mt-1">
            Sessions held / expected
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-6 text-center md:text-left">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium leading-tight md:mb-2">
            Best
          </p>
          <p className="text-[10px] md:text-lg font-bold text-emerald-400 truncate leading-tight">
            {data?.best?.name || "N/A"}
          </p>
          <p className="text-[9px] md:text-sm text-slate-400 leading-tight">
            {data?.best?.rate || 0}%
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-6 text-center md:text-left">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium leading-tight md:mb-2">
            Low
          </p>
          <p className="text-[10px] md:text-lg font-bold text-rose-400 truncate leading-tight">
            {data?.worst?.name || "N/A"}
          </p>
          <p className="text-[9px] md:text-sm text-slate-400 leading-tight">
            {data?.worst?.rate || 0}%
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-6 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium leading-tight">
            Units
          </p>
          <p className="text-[11px] md:text-4xl font-bold text-violet-400 leading-tight">
            {data?.totalUnits || 0}
          </p>
          <p className="hidden md:block text-xs text-slate-500 mt-1">
            Being tracked
          </p>
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6">
          <h3 className="text-[11px] md:text-base font-semibold text-white mb-1.5 md:mb-4">
            Weekly Delivery
          </h3>
          <div className="h-40 md:h-64">
            <Bar
              data={weeklyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8" },
                  },
                  y: {
                    grid: { color: "#334155" },
                    ticks: { color: "#94a3b8" },
                    min: 0,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Sessions by Program */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6">
          <h3 className="text-[11px] md:text-base font-semibold text-white mb-1.5 md:mb-4">
            Sessions by Program
          </h3>
          <div className="space-y-2 md:space-y-4 max-h-64 overflow-y-auto">
            {data?.byProgram?.map((p: any) => (
              <div key={p.name} className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between text-[11px] md:text-sm gap-2">
                  <span className="text-slate-300 font-medium truncate">
                    {p.name}
                  </span>
                  <span
                    className={`font-bold shrink-0 ${
                      parseFloat(p.rate) >= 75
                        ? "text-emerald-400"
                        : parseFloat(p.rate) >= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {p.rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2.5">
                  <div
                    className="bg-blue-500 h-1.5 md:h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, parseFloat(p.rate))}%` }}
                  />
                </div>
              </div>
            ))}
            {!data?.byProgram?.length && (
              <p className="text-slate-500 text-[11px] md:text-sm text-center py-4">
                No program data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-6">
        <div className="lg:col-span-2 bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6">
          <h3 className="text-[11px] md:text-base font-semibold text-white mb-1.5 md:mb-4">
            Unit Delivery Comparison
          </h3>
          <div className="space-y-2 md:space-y-4">
            {data?.byUnit?.map((u: any) => (
              <div key={u.name} className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between text-[11px] md:text-sm gap-2">
                  <span className="text-slate-300 font-medium truncate">
                    {u.name}
                  </span>
                  <span
                    className={`font-bold shrink-0 ${
                      parseFloat(u.rate) >= 75
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {u.rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2.5">
                  <div
                    className="bg-blue-500 h-1.5 md:h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, parseFloat(u.rate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6">
          <h3 className="text-[11px] md:text-base font-semibold text-white mb-1.5 md:mb-4">
            Distribution
          </h3>
          <div className="h-40 md:h-64 flex items-center justify-center">
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
                      padding: 8,
                      font: { size: 10 },
                      boxWidth: 10,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Intervention List */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6">
        <h3 className="text-[11px] md:text-base font-semibold text-white mb-1.5 md:mb-4">
          Intervention Needed
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-4">
          {data?.byUnit
            ?.filter((u: any) => parseFloat(u.rate) < 60)
            .map((u: any) => (
              <div
                key={u.name}
                className="bg-rose-900/10 border border-rose-800/50 rounded-md md:rounded-xl p-2 md:p-4 flex items-center gap-2 md:gap-4"
              >
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 font-bold text-[11px] md:text-sm shrink-0">
                  !
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] md:text-sm font-medium text-white truncate">
                    {u.name}
                  </p>
                  <p className="text-[9px] md:text-xs text-rose-400 truncate">
                    At {u.rate}% — consider follow-up
                  </p>
                </div>
              </div>
            ))}
          {data?.byUnit?.filter((u: any) => parseFloat(u.rate) < 60).length ===
            0 && (
            <p className="text-slate-500 text-[11px] md:text-sm col-span-full">
              All units are above intervention threshold. Great work!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsAnalytics;
