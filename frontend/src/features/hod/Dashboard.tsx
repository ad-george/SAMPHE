import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
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
import { Line, Bar, Doughnut, Chart } from "react-chartjs-2";

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

const StatCard = ({ title, value, sub, icon, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && (
        <p className="text-xs text-emerald-600 mt-1 font-medium">{sub}</p>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    api
      .get("/auth/license/status")
      .then((res) => {
        console.log("📊 License status:", res.data.data);
        setLicenseStatus(res.data.data);
      })
      .catch((err) => console.log("❌ License status error:", err));
    api
      .get("/hod/dashboard-full")
      .then((r) => setData(r.data.data))
      .catch(() => {
        api.get("/hod/dashboard").then((r) => setData({ stats: r.data.data }));
      });

    // Fetch license status
    api
      .get("/university-admin/license/status")
      .then((r) => setLicenseStatus(r.data.data))
      .catch(() => {});

    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem("hodLicenseBannerDismissed");
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
      message =
        "The license has expired. Kindly notify the Administration responsible.";
      type = "expired";
    } else if (isExpiring && daysLeft !== null && daysLeft !== undefined) {
      message = `${daysLeft} day(s) to license expiry. Kindly notify the Administration responsible.`;
      type = "expiring";
    } else {
      return null;
    }

    return { message, type, daysLeft };
  };

  const dismissBanner = () => {
    sessionStorage.setItem("hodLicenseBannerDismissed", "true");
    setBannerDismissed(true);
  };

  const stats = data?.stats || {};
  const monthly = data?.monthlyTrend || [];
  const programs = data?.programStats || [];
  const weekly = data?.weeklyTrend || [];
  const recent = data?.recentClasses || [];
  const low = data?.lowAttendees || [];
  const summary = data?.summary || {};

  const lineData = {
    labels: monthly.map((m: any) => m.month),
    datasets: [
      {
        label: "Attendance %",
        data: monthly.map((m: any) => m.rate),
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#059669",
      },
    ],
  };

  const doughnutData = {
    labels: programs.map((p: any) => p.name),
    datasets: [
      {
        data: programs.map((p: any) => p.rate),
        backgroundColor: [
          "#059669",
          "#3b82f6",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#10b981",
        ],
        borderWidth: 0,
      },
    ],
  };

  // const barData = {
  //   labels: weekly.map((w: any) => w.week),
  //   datasets: [
  //     {
  //       label: "Rate %",
  //       data: weekly.map((w: any) => w.rate),
  //       backgroundColor: "#3b82f6",
  //       borderRadius: 4,
  //     },
  //   ],
  // };

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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Programs"
          value={stats.programs || 0}
          icon="🎯"
          color="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          title="Lecturers"
          value={stats.lecturers || 0}
          icon="👤"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Students"
          value={stats.students || 0}
          icon="🎓"
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Units"
          value={stats.units || 0}
          icon="📘"
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          title="This Month's Classes"
          value={stats.monthClasses || 0}
          icon="📅"
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Row 2: Line | Doughnut | Low Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              Attendance Overview
            </h3>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
              <option>This Semester</option>
            </select>
          </div>
          <div className="h-56">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                  y: {
                    grid: { color: "#f1f5f9" },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">
            Attendance by Program
          </h3>

          {/* Doughnut with better spacing */}
          <div className="h-52 flex items-center justify-center mb-4">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: { legend: { display: false } },
              }}
            />
          </div>

          {/* Overall Rate */}
          <div className="text-center mb-5">
            <span className="text-3xl font-bold text-slate-800">
              {data?.summary?.avgAttendance || 0}%
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Overall Program Delivery
            </p>
          </div>

          {/* Program List with proper spacing */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {programs.slice(0, 4).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        doughnutData.datasets[0].backgroundColor[i],
                    }}
                  />
                  <span className="text-sm text-slate-600">{p.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {p.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-rose-600 mb-4 flex items-center gap-2">
            ⚠ Low Attendance Alert
          </h3>
          <div className="space-y-3">
            {low.map((s: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-xs font-bold text-rose-700">
                    {s.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500">{s.regNo}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-rose-600">
                  {s.rate}%
                </span>
              </div>
            ))}
            {low.length === 0 && (
              <p className="text-emerald-600 text-sm text-center py-4 font-medium">
                No at-risk students
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Classes | Attendance Trend (Extended) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Classes */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Classes</h3>
          <div className="space-y-3">
            {recent.map((c: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.unit}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(c.date).toLocaleDateString()} • {c.lecturer}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${
                      c.rate >= 80
                        ? "text-emerald-600"
                        : c.rate >= 60
                          ? "text-amber-600"
                          : "text-rose-600"
                    }`}
                  >
                    {c.rate}%
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {c.present}/{c.total}
                  </p>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">
                No recent classes
              </p>
            )}
          </div>
        </div>

        {/* Attendance Trend Card — Extended (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">
              Attendance Trend (This Semester)
            </h3>
          </div>

          <div className="h-80">
            <Chart
              type="bar"
              data={{
                labels: weekly.map((w: any) => w.week),
                datasets: [
                  {
                    label: "Rate %",
                    data: weekly.map((w: any) => w.rate),
                    backgroundColor: "#3b82f6",
                    borderRadius: 4,
                    order: 2,
                  },
                  {
                    label: "Trend",
                    type: "line",
                    data: weekly.map((w: any) => w.rate),
                    borderColor: "#059669",
                    backgroundColor: "rgba(5, 150, 105, 0.1)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: "#059669",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    order: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "top" as const,
                    labels: {
                      usePointStyle: true,
                      pointStyle: "circle",
                      padding: 20,
                      font: { size: 11 },
                      color: "#64748b",
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context: any) {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                  y: {
                    grid: { color: "#f1f5f9" },
                    ticks: {
                      color: "#94a3b8",
                      font: { size: 10 },
                      callback: function (value: any) {
                        return value + "%";
                      },
                    },
                    min: 0,
                    max: 100,
                  },
                },
              }}
            />
          </div>

          {/* Summary Stats */}
          {weekly.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Semester</p>
                <p className="text-sm font-semibold text-slate-800">
                  {data?.currentSemester?.name || "Current"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Overall</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {weekly.filter((w: any) => w.rate > 0).length > 0
                    ? Math.round(
                        weekly
                          .filter((w: any) => w.rate > 0)
                          .reduce((sum: number, w: any) => sum + w.rate, 0) /
                          weekly.filter((w: any) => w.rate > 0).length,
                      )
                    : 0}
                  %
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Best Week</p>
                <p className="text-sm font-semibold text-blue-600">
                  {weekly.length > 0
                    ? (() => {
                        const maxRate = Math.max(
                          ...weekly.map((w: any) => w.rate),
                        );
                        const maxIndex = weekly.findIndex(
                          (w: any) => w.rate === maxRate,
                        );
                        return `Wk${maxIndex + 1} (${maxRate}%)`;
                      })()
                    : "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Semester Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Semester summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Classes</p>
              <p className="text-xl font-bold text-slate-800">
                {data?.summary?.totalClasses || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Attended</p>
              <p className="text-xl font-bold text-emerald-600">
                {data?.summary?.totalAttended || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Unattended</p>
              <p className="text-xl font-bold text-rose-600">
                {data?.summary?.totalMissed || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Avg Attendance</p>
              <p className="text-xl font-bold text-blue-600">
                {data?.summary?.avgAttendance || 0}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Avg Stud. Attendance</p>
              <p className="text-xl font-bold text-violet-600">
                {data?.summary?.avgStudentAttendance || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
