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
  <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2 md:p-5 shadow-sm flex items-center gap-2 md:gap-4">
    <div
      className={`w-7 h-7 md:w-12 md:h-12 rounded-md md:rounded-xl ${bg} flex items-center justify-center text-xs md:text-xl shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] md:text-[11px] text-slate-400 uppercase tracking-wide font-semibold truncate">
        {title}
      </p>
      <p
        className={`text-sm md:text-2xl font-bold ${color} leading-tight truncate`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[8px] md:text-[11px] text-slate-500 mt-0.5 truncate">
          {sub}
        </p>
      )}
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
    <div className="space-y-3 md:space-y-6 max-w-7xl mx-auto">
      {/* License Warning Banner */}
      {(() => {
        const licenseInfo = getLicenseDisplay();
        if (!licenseInfo || bannerDismissed) return null;

        const isExpired = licenseInfo.type === "expired";
        return (
          <div
            className={`border rounded-lg md:rounded-2xl px-2.5 py-1.5 md:p-4 flex items-center justify-between relative ${
              isExpired
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <span className="text-sm md:text-2xl shrink-0">
                {isExpired ? "🚫" : "⏰"}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[11px] md:text-base font-medium truncate ${
                    isExpired ? "text-rose-400" : "text-amber-400"
                  }`}
                >
                  {isExpired ? "License Expired" : "License Expiring Soon"}
                </p>
                <p className="text-[10px] md:text-sm text-slate-400 truncate">
                  {licenseInfo.message}
                </p>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white transition p-1 shrink-0 ml-2"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 md:gap-4">
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
      <div className="grid grid-cols-3 gap-1.5 md:flex md:flex-wrap md:gap-3">
        <button
          onClick={() => navigate("/lecturer/start")}
          className="px-2 py-1.5 md:px-5 md:py-2.5 bg-emerald-600 text-white rounded-md md:rounded-xl text-[10px] md:text-sm font-medium hover:bg-emerald-500 transition shadow-sm flex items-center justify-center md:justify-start gap-1 md:gap-2 whitespace-nowrap"
        >
          ▶ Start
        </button>
        <button
          onClick={() => navigate("/lecturer/reports")}
          className="px-2 py-1.5 md:px-5 md:py-2.5 bg-slate-700 border border-slate-600 text-white rounded-md md:rounded-xl text-[10px] md:text-sm font-medium hover:bg-slate-600 transition flex items-center justify-center md:justify-start gap-1 md:gap-2 whitespace-nowrap"
        >
          📄 Reports
        </button>
        <button
          onClick={() => navigate("/lecturer/students")}
          className="px-2 py-1.5 md:px-5 md:py-2.5 bg-slate-700 border border-slate-600 text-white rounded-md md:rounded-xl text-[10px] md:text-sm font-medium hover:bg-slate-600 transition flex items-center justify-center md:justify-start gap-1 md:gap-2 whitespace-nowrap"
        >
          ⌕ Students
        </button>
      </div>

      {/* Recent Sessions + Weekly Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-6">
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-base font-bold text-white">
              Recent Sessions
            </h3>
            <button
              onClick={() => navigate("/lecturer/history")}
              className="text-xs text-emerald-400 font-medium hover:underline"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm">
              <thead>
                <tr className="text-slate-400 text-[9px] md:text-[11px] uppercase border-b border-slate-600">
                  <th className="text-left pb-3 font-medium">Date</th>
                  <th className="text-left pb-3 font-medium">Unit</th>
                  <th className="text-left pb-3 font-medium">Program/Year</th>
                  <th className="text-left pb-3 font-medium">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((s: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                    >
                      <td className="py-1.5 md:py-3 text-slate-300 text-[10px] md:text-xs">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 md:py-3 text-white font-medium text-[10px] md:text-xs">
                        {s.unit}
                      </td>
                      <td className="py-1.5 md:py-3 text-slate-400 text-[10px] md:text-xs">
                        {s.program} {s.studyYear}
                      </td>
                      <td className="py-1.5 md:py-3">
                        <span
                          className={`text-[9px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full ${
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

        <div className="bg-slate-700 border border-slate-600 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-base font-bold text-white">
              Weekly Attendance Trend
            </h3>
            <h3 className="text-xs md:text-base font-bold text-white">
              Weekly Attendance Trend
            </h3>
          </div>
          <div className="h-40 md:h-64">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* My Units (Real) */}
        <div className="bg-slate-700 border border-slate-600 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-base font-bold text-white">
              My Units
            </h3>
          </div>
          <div className="space-y-2 md:space-y-4">
            {myUnits.map((u: any, i: number) => (
              <div
                key={i}
                className="flex gap-2 md:gap-3 pl-2 md:pl-3 border-l-2 border-emerald-400"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] md:text-sm font-semibold text-white truncate">
                    {u.code} — {u.name}
                  </p>
                  <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 truncate">
                    {u.program} {u.studyYear}
                  </p>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5 flex-wrap">
                    <span className="text-[9px] md:text-xs text-slate-500">
                      {u.totalStudents} students
                    </span>
                    <span
                      className={`text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-medium ${
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
              <div className="h-28 md:h-48 flex items-center justify-center relative">
                <p className="text-sm text-slate-400">No units assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance by Unit (Real) */}
        <div className="bg-slate-700 border border-slate-600 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-base font-bold text-white">
              Attendance by Unit
            </h3>
            <button
              onClick={() => navigate("/lecturer/analytics")}
              className="text-xs text-emerald-400 font-medium hover:underline"
            >
              View analytics
            </button>
          </div>
          <div className="h-36 md:h-48 flex items-center justify-center relative">
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
                  <p className="text-base md:text-2xl font-bold text-white">
                    {avgRate}%
                  </p>
                  <p className="text-[9px] md:text-xs text-slate-400">
                    Overall
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">No unit data</p>
            )}
          </div>
          {analytics?.byUnit?.length > 0 && (
            <div className="mt-2 md:mt-4 space-y-1 md:space-y-2">
              {analytics.byUnit.slice(0, 5).map((u: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[9px] md:text-xs"
                >
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <span
                      className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: unitColors[i % unitColors.length],
                      }}
                    />
                    <span className="text-slate-300 truncate">{u.name}</span>
                  </div>
                  <span className="text-white font-medium ml-2 shrink-0">
                    {u.rate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-700 border border-slate-600 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <h3 className="text-xs md:text-base font-bold text-white mb-2 md:mb-4">
            Quick Actions
          </h3>
          <div className="space-y-1 md:space-y-3">
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
                className="w-full flex items-center gap-2 md:gap-3 p-1.5 md:p-3 rounded-md md:rounded-xl hover:bg-slate-600 transition border border-transparent hover:border-slate-500 text-left group"
              >
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-md md:rounded-lg ${a.bg} ${a.color} flex items-center justify-center text-sm md:text-lg shrink-0`}
                >
                  {a.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] md:text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                    {a.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-400">
                    {a.desc}
                  </p>
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
