import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const StatCard = ({ title, value, color, icon, subtitle }: any) => (
  <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-slate-300 font-medium">{title}</p>{" "}
      {/* ✅ Bigger + lighter */}
      <span className="text-2xl">{icon}</span> {/* ✅ Bigger icon */}
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>{" "}
    {/* ✅ Bigger value */}
    {subtitle && <p className="text-sm text-slate-300 mt-1">{subtitle}</p>}{" "}
    {/* ✅ Bigger + lighter */}
  </div>
);

const DeviationBadge = ({
  value,
  filterType,
}: {
  value: string;
  filterType: string;
}) => {
  const num = parseFloat(value);
  const isPositive = num > 0;
  const isNeutral = num === 0;

  const label =
    filterType === "semester"
      ? "Against prev sem"
      : filterType === "academicYear"
        ? "Against prev AY"
        : filterType === "studyYear"
          ? "Against prev AY"
          : "Against prev period";

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
        Deviation
      </span>
      <span
        className={`flex items-center gap-1 text-sm font-bold ${isPositive ? "text-emerald-400" : isNeutral ? "text-slate-400" : "text-rose-400"}`}
      >
        {isPositive ? (
          <span className="text-lg">↑</span>
        ) : isNeutral ? (
          <span className="text-lg">→</span>
        ) : (
          <span className="text-lg">↓</span>
        )}
        {isPositive ? "+" : ""}
        {value}%
      </span>
      <span className="text-[9px] text-slate-600 mt-0.5">{label}</span>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [filters, setFilters] = useState({
    academicYear: "",
    studyYear: "",
    semester: "",
  });
  const [years, setYears] = useState<any[]>([]);
  const [studyYears, setStudyYears] = useState<any[]>([]);
  const [semesters] = useState(["Semester 1", "Semester 2", "Semester 3"]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("licenseBannerDismissed");
    if (dismissed === "true") {
      setBannerDismissed(true);
    }

    api.get("/university-admin/stats").then((r) => setStats(r.data.data));
    api
      .get("/university-admin/compliance")
      .then((r) => setCompliance(r.data.data));
    api
      .get("/university-admin/license/status")
      .then((r) => setLicenseStatus(r.data.data));
    api
      .get("/university-admin/academic-years")
      .then((r) =>
        setYears(
          Array.isArray(r.data.data)
            ? r.data.data.filter((y: any) => !y.archived)
            : [],
        ),
      );
    api.get("/study-years").then((r) => setStudyYears(r.data.data || []));
    fetchSessionStats();
  }, []);

  useEffect(() => {
    fetchSessionStats();
  }, [filters]);

  const fetchSessionStats = () => {
    const params = new URLSearchParams();
    if (filters.academicYear)
      params.append("academicYear", filters.academicYear);
    if (filters.studyYear) params.append("studyYearId", filters.studyYear);
    if (filters.semester) params.append("semesterId", filters.semester);
    api
      .get(`/university-admin/session-stats?${params}`)
      .then((r) => setSessionData(r.data.data));
  };

  // ============================================================
  // LICENSE STATUS DISPLAY
  // ============================================================

  const getLicenseDisplay = () => {
    if (!licenseStatus)
      return {
        label: "Checking...",
        color: "text-slate-400",
        icon: "⏳",
        daysLeft: null,
        type: "—",
      };

    // Get license type
    const licenseType =
      licenseStatus?.isTrial === true
        ? "Trial"
        : licenseStatus?.type === "PERPETUAL"
          ? "Perpetual"
          : licenseStatus?.type === "TRIAL"
            ? "Trial"
            : "Subscription";

    switch (licenseStatus.status) {
      case "ACTIVE":
        return {
          label: "Active ✅",
          color: "text-emerald-400",
          icon: "✅",
          daysLeft: licenseStatus.daysLeft,
          type: licenseType,
          message: "Your license is active and all features are available.",
        };
      case "EXPIRING_SOON":
        return {
          label: `Expires in ${licenseStatus.daysLeft} day(s)`,
          color: "text-amber-400",
          icon: "⏰",
          daysLeft: licenseStatus.daysLeft,
          type: licenseType,
          message: `Your license expires in ${licenseStatus.daysLeft} days. Renew now to avoid service interruption.`,
        };
      case "EXPIRED":
        return {
          label: "Expired !",
          color: "text-rose-400",
          icon: "🚫",
          daysLeft: 0,
          type: licenseType,
          message: "Your license has expired. Renew now to regain access.",
        };
      case "GRACE_PERIOD":
        return {
          label: `Grace Period (${licenseStatus.daysLeft}d)`,
          color: "text-amber-400",
          icon: "⚠️",
          daysLeft: licenseStatus.daysLeft,
          type: licenseType,
          message: `License revoked. ${licenseStatus.daysLeft} days of grace period remaining.`,
        };
      case "ACCESS_BLOCKED":
        return {
          label: "Blocked",
          color: "text-rose-400",
          icon: "🔒",
          daysLeft: 0,
          type: licenseType,
          message: "Access blocked. Please contact support.",
        };
      default:
        return {
          label: "Unknown",
          color: "text-slate-400",
          icon: "❓",
          daysLeft: null,
          type: licenseType,
          message: "",
        };
    }
  };

  const licenseDisplay = getLicenseDisplay();
  const isExpiring =
    licenseStatus?.status === "EXPIRING_SOON" ||
    licenseStatus?.status === "GRACE_PERIOD";
  const isExpired =
    licenseStatus?.status === "EXPIRED" ||
    licenseStatus?.status === "ACCESS_BLOCKED";

  // ============================================================
  // CHART DATA
  // ============================================================

  const chartData = sessionData
    ? {
        labels:
          sessionData.departments?.map((d: any) => d.departmentName) || [],
        datasets: [
          {
            label: "Sessions Conducted",
            data:
              sessionData.departments?.map((d: any) => d.totalSessions) || [],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#06b6d4",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "#06b6d4",
          },
        ],
      }
    : { labels: [], datasets: [] };

  const highest = sessionData?.highest;
  const lowest = sessionData?.lowest;

  // Total sessions
  const totalSessions =
    sessionData?.departments?.reduce(
      (sum: number, d: any) => sum + (d.totalSessions || 0),
      0,
    ) || 0;

  // Dismiss banner for this session
  const dismissBanner = () => {
    sessionStorage.setItem("licenseBannerDismissed", "true");
    setBannerDismissed(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            University Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time insights across all departments
          </p>
        </div>
        {compliance?.activeAcademicYear && (
          <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <p className="text-xs text-cyan-400 uppercase tracking-wider">
              Active Academic Year
            </p>
            <p className="text-lg font-bold text-cyan-300">
              {compliance.activeAcademicYear}
            </p>
          </div>
        )}
      </div>

      {/* LICENSE EXPIRY WARNING BANNER - with X close button */}
      {licenseStatus && (isExpiring || isExpired) && !bannerDismissed && (
        <div
          className={`border rounded-2xl p-4 flex items-center justify-between relative ${
            isExpired
              ? "bg-rose-500/10 border-rose-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          }`}
        >
          <div className="flex items-center gap-3 pr-8">
            <span className="text-2xl">{isExpired ? "🚫" : "⚠️"}</span>
            <div>
              <p
                className={`font-medium ${isExpired ? "text-rose-400" : "text-amber-400"}`}
              >
                {licenseDisplay.label}
              </p>
              <p className="text-base text-slate-300">
                {licenseDisplay.message}
              </p>{" "}
            </div>
          </div>
          <div className="flex items-center gap-3 mr-8">
            {!isExpired && (
              <button
                onClick={() => navigate("/university-admin/subscription")}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition ${
                  isExpired
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {isExpired ? "Contact Support" : "Renew Now"}
              </button>
            )}
            {isExpired && (
              <button
                onClick={() => navigate("/university-admin/subscription")}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-medium text-white transition"
              >
                Renew Now
              </button>
            )}
            {/* X close button */}
            <button
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white transition p-1"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* STATS CARDS - Updated license card to "Account Type" */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Faculties"
          value={stats?.faculties || 0}
          color="text-blue-400"
          icon="🏛️"
        />
        <StatCard
          title="Departments"
          value={stats?.departments || 0}
          color="text-cyan-400"
          icon="📋"
        />
        <StatCard
          title="HODs"
          value={stats?.hods || 0}
          color="text-emerald-400"
          icon="👤"
        />
        <StatCard
          title="Account Type"
          value={<span className="text-sm">{licenseDisplay.type}</span>} // Same as title size
          color="text-emerald-400"
          icon={licenseDisplay.icon}
          subtitle={
            <span className="text-sm text-amber-400 font-medium">
              {licenseDisplay.label}
            </span>
          }
        />
      </div>

      {/* COMPLIANCE ALERTS */}
      {compliance?.issues?.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
            ⚠ Compliance Alerts
          </h3>
          <div className="space-y-2">
            {compliance.issues.map((issue: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-amber-200/80"
              >
                <span
                  className={`w-2 h-2 rounded-full ${issue.severity === "HIGH" ? "bg-rose-400" : "bg-amber-400"}`}
                />
                {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SESSIONS PER DEPARTMENT CHART */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Sessions Per Department
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Attendance session distribution across departments
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filters.academicYear}
              onChange={(e) =>
                setFilters({ ...filters, academicYear: e.target.value })
              }
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Academic Years</option>
              {years.map((y: any) => (
                <option key={y.id} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
            <select
              value={filters.studyYear}
              onChange={(e) =>
                setFilters({ ...filters, studyYear: e.target.value })
              }
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Study Years</option>
              {studyYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            <select
              value={filters.semester}
              onChange={(e) =>
                setFilters({ ...filters, semester: e.target.value })
              }
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All Semesters</option>
              {semesters.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-72">
          {sessionData?.departments?.length > 0 ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  x: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "#64748b" },
                  },
                  y: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "#64748b", stepSize: 1 },
                  },
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm">
              No session data available for selected filters
            </div>
          )}
        </div>

        {/* Highest / Lowest Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {highest && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-3">
                🏆 Highest Sessions
              </p>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">
                  {highest.departmentName}
                </h4>
                <DeviationBadge
                  value={highest.deviation || "+0"}
                  filterType={
                    filters.semester
                      ? "semester"
                      : filters.academicYear
                        ? "academicYear"
                        : filters.studyYear
                          ? "studyYear"
                          : "default"
                  }
                />
              </div>
              <p className="text-xs text-slate-400 mb-3">
                HOD: {highest.hodName}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">
                  {highest.totalSessions}
                </span>
                <span className="text-xs text-slate-500 mb-1">sessions</span>
              </div>
              <div className="mt-2 text-xs text-emerald-400">
                {highest.averageRate}% attendance rate
              </div>
            </div>
          )}
          {lowest && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
              <p className="text-[10px] text-rose-400 uppercase tracking-wider font-bold mb-3">
                📉 Lowest Sessions
              </p>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">
                  {lowest.departmentName}
                </h4>
                <DeviationBadge
                  value={lowest.deviation || "0"}
                  filterType={
                    filters.semester
                      ? "semester"
                      : filters.academicYear
                        ? "academicYear"
                        : filters.studyYear
                          ? "studyYear"
                          : "default"
                  }
                />
              </div>
              <p className="text-xs text-slate-400 mb-3">
                HOD: {lowest.hodName}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">
                  {lowest.totalSessions}
                </span>
                <span className="text-xs text-slate-500 mb-1">sessions</span>
              </div>
              <div className="mt-2 text-xs text-rose-400">
                {lowest.averageRate}% attendance rate
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
