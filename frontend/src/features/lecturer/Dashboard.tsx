import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

const StatCard = ({ title, value, sub, icon, color, bg }: any) => (
  <div className="bg-slate-700 border border-slate-600 rounded-2xl p-5 shadow-sm flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-xl shrink-0`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
        {title}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard data
    Promise.all([
      api.get("/lecturer/dashboard"),
      api.get("/lecturer/analytics"),
      api.get("/lecturer/units"),
    ])
      .then(([dashRes, analRes, unitsRes]) => {
        setData(dashRes.data.data);
        setAnalytics(analRes.data.data);
        setMyUnits(unitsRes.data.data?.slice(0, 4) || []);
      })
      .catch((err) => console.error("Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));

    // ✅ Fetch license status from auth route (bypasses license middleware)
    api
      .get("/auth/license/status")
      .then((res) => {
        console.log("📊 License status:", res.data.data);
        setLicenseStatus(res.data.data);
      })
      .catch((err) => console.log("❌ License status error:", err));

    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem("lecturerLicenseBannerDismissed");
    if (dismissed === "true") {
      setBannerDismissed(true);
    }
  }, []);

  // --- LICENSE STATUS DISPLAY ---
  const getLicenseDisplay = () => {
    if (!licenseStatus) return null;

    const daysLeft = licenseStatus.daysLeft;
    const isExpired =
      licenseStatus.status === "EXPIRED" ||
      licenseStatus.status === "ACCESS_BLOCKED";
    const isExpiring =
      licenseStatus.status === "EXPIRING_SOON" ||
      licenseStatus.status === "GRACE_PERIOD";

    if (!isExpired && !isExpiring) return null;

    let message = "";
    let type = "";

    if (isExpired) {
      message = "The license has expired. Kindly notify your HOD/COD.";
      type = "expired";
    } else if (isExpiring && daysLeft !== null && daysLeft !== undefined) {
      message = `${daysLeft} day(s) to license expiry. Kindly notify your HOD/COD.`;
      type = "expiring";
    } else {
      return null;
    }

    return { message, type, daysLeft };
  };

  const dismissBanner = () => {
    sessionStorage.setItem("lecturerLicenseBannerDismissed", "true");
    setBannerDismissed(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recent = data?.recentSessions || [];

  // Real weekly trend from analytics API
  const weeklyData = {
    labels: analytics?.weekly?.map((w: any) => w.week) || [],
    datasets: [
      {
        label: "Attendance %",
        data: analytics?.weekly?.map((w: any) => w.rate) || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  // Real donut data from analytics.byUnit
  const unitColors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#06b6d4",
    "#ec4899",
    "#f97316",
    "#64748b",
  ];
  const donutData = {
    labels: analytics?.byUnit?.map((u: any) => u.name) || [],
    datasets: [
      {
        data: analytics?.byUnit?.map((u: any) => parseFloat(u.rate) || 0) || [],
        backgroundColor:
          analytics?.byUnit?.map(
            (_: any, i: number) => unitColors[i % unitColors.length],
          ) || [],
        borderWidth: 0,
      },
    ],
  };

  const avgRate = data?.avgAttendance || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* License Warning Banner */}
      {(() => {
        const licenseInfo = getLicenseDisplay();
        if (!licenseInfo || bannerDismissed) return null;

        const isExpired = licenseInfo.type === "expired";
        return (
          <div
            className={`border rounded-2xl p-4 flex items-center justify-between relative ${
              isExpired
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-3 pr-8">
              <span className="text-2xl">{isExpired ? "🚫" : "⏰"}</span>
              <div>
                <p
                  className={`font-medium ${
                    isExpired ? "text-rose-400" : "text-amber-400"
                  }`}
                >
                  {isExpired ? "License Expired" : "License Expiring Soon"}
                </p>
                <p className="text-sm text-slate-400">{licenseInfo.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={dismissBanner}
                className="text-slate-400 hover:text-white transition p-1"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })()}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Classes"
          value={data?.todayClasses ?? 0}
          sub="All units"
          icon="📅"
          color="text-white"
          bg="bg-blue-900/30"
        />
        <StatCard
          title="Active Session"
          value={data?.activeSession ? data.activeSession.unitCode : "None"}
          sub={
            data?.activeSession
              ? `${data.activeSession.remainingMin} min left`
              : "No active session"
          }
          icon="▶"
          color="text-white"
          bg="bg-emerald-900/30"
        />
        <StatCard
          title="Total Units"
          value={data?.totalUnits ?? 0}
          sub="This semester"
          icon="📖"
          color="text-white"
          bg="bg-violet-900/30"
        />
        <StatCard
          title="Avg Attendance"
          value={`${data?.avgAttendance ?? 0}%`}
          sub="Across all units"
          icon="📈"
          color="text-white"
          bg="bg-orange-900/30"
        />
        <StatCard
          title="Sessions Conducted"
          value={data?.sessionsConducted ?? 0}
          sub="This semester"
          icon="👥"
          color="text-white"
          bg="bg-teal-900/30"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/lecturer/start")}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition shadow-sm flex items-center gap-2"
        >
          ▶ Start Attendance
        </button>
        <button
          onClick={() => navigate("/lecturer/reports")}
          className="px-5 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition flex items-center gap-2"
        >
          📄 View Reports
        </button>
        <button
          onClick={() => navigate("/lecturer/students")}
          className="px-5 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition flex items-center gap-2"
        >
          ⌕ Search Student
        </button>
      </div>

      {/* Recent Sessions + Weekly Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Recent Sessions</h3>
            <button
              onClick={() => navigate("/lecturer/history")}
              className="text-xs text-emerald-400 font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase border-b border-slate-600">
                  <th className="text-left pb-3 font-medium">Date</th>
                  <th className="text-left pb-3 font-medium">Unit</th>
                  <th className="text-left pb-3 font-medium">Program/Year</th>
                  <th className="text-left pb-3 font-medium">Present/Total</th>
                  <th className="text-left pb-3 font-medium">Attendance</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((s: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                    >
                      <td className="py-3 text-slate-300 text-xs">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-white font-medium text-xs">
                        {s.unit}
                      </td>
                      <td className="py-3 text-slate-400 text-xs">
                        {s.program} {s.studyYear}
                      </td>
                      <td className="py-3 text-slate-300 text-xs">
                        {s.present}/{s.total}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.rate >= 80
                              ? "bg-emerald-900/30 text-emerald-400"
                              : s.rate >= 60
                                ? "bg-amber-900/30 text-amber-400"
                                : "bg-rose-900/30 text-rose-400"
                          }`}
                        >
                          {s.rate}%
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center text-xs">
                          ✓
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-400 text-sm"
                    >
                      No recent sessions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Weekly Attendance Trend</h3>
            <select className="text-xs bg-slate-600 border border-slate-500 rounded-lg px-2 py-1 text-white focus:outline-none">
              <option>This Semester</option>
            </select>
          </div>
          <div className="h-64">
            {analytics?.weekly?.length > 0 ? (
              <Line
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
                      ticks: {
                        color: "#94a3b8",
                        callback: (v: any) => v + "%",
                      },
                      min: 0,
                      max: 100,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: My Units + Donut + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Units (Real) */}
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">My Units</h3>
            <button
              onClick={() => navigate("/lecturer/units")}
              className="text-xs text-emerald-400 font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="space-y-4">
            {myUnits.map((u: any, i: number) => (
              <div
                key={i}
                className="flex gap-3 pl-3 border-l-2 border-emerald-400"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {u.code} — {u.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u.program} {u.studyYear}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-500">
                      {u.totalStudents} students
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        parseFloat(u.avgAttendance) >= 75
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-amber-900/30 text-amber-400"
                      }`}
                    >
                      {u.avgAttendance}% avg
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {myUnits.length === 0 && (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-slate-400">No units assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance by Unit (Real) */}
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">Attendance by Unit</h3>
            <button
              onClick={() => navigate("/lecturer/analytics")}
              className="text-xs text-emerald-400 font-medium hover:underline"
            >
              View analytics →
            </button>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            {analytics?.byUnit?.length > 0 ? (
              <>
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "75%",
                    plugins: { legend: { display: false } },
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-white">{avgRate}%</p>
                  <p className="text-xs text-slate-400">Overall</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">No unit data</p>
            )}
          </div>
          {analytics?.byUnit?.length > 0 && (
            <div className="mt-4 space-y-2">
              {analytics.byUnit.slice(0, 5).map((u: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: unitColors[i % unitColors.length],
                      }}
                    />
                    <span className="text-slate-300">{u.name}</span>
                  </div>
                  <span className="text-white font-medium">{u.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              {
                icon: "▶",
                bg: "bg-emerald-900/30",
                color: "text-emerald-400",
                title: "Start Attendance",
                desc: "Create a new attendance session",
                action: () => navigate("/lecturer/start"),
              },
              {
                icon: "📄",
                bg: "bg-blue-900/30",
                color: "text-blue-400",
                title: "Generate Report",
                desc: "View and download reports",
                action: () => navigate("/lecturer/reports"),
              },
              {
                icon: "⌕",
                bg: "bg-violet-900/30",
                color: "text-violet-400",
                title: "Search Student",
                desc: "Find student attendance records",
                action: () => navigate("/lecturer/students"),
              },
              {
                icon: "📊",
                bg: "bg-orange-900/30",
                color: "text-orange-400",
                title: "View Analytics",
                desc: "Explore charts and insights",
                action: () => navigate("/lecturer/analytics"),
              },
            ].map((a, i) => (
              <button
                key={i}
                onClick={a.action}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-600 transition border border-transparent hover:border-slate-500 text-left group"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${a.bg} ${a.color} flex items-center justify-center text-lg shrink-0`}
                >
                  {a.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                    {a.title}
                  </p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>
                <span className="text-slate-500 group-hover:text-emerald-400 transition">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
