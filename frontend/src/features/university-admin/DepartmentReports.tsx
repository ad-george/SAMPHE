import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const DepartmentReports = () => {
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "this-semester",
    semesterId: "",
    academicYear: "",
  });
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSummary();
  }, [filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.semesterId) params.append("semesterId", filters.semesterId);
      if (filters.academicYear)
        params.append("academicYear", filters.academicYear);

      const res = await api.get(`/university-admin/attendance-stats?${params}`);
      setStats(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch attendance stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get("/university-admin/attendance-stats/summary");
      setSummary(res.data.data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const exportReport = async (format: "pdf" | "excel") => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      if (filters.semesterId) params.append("semesterId", filters.semesterId);
      if (filters.academicYear)
        params.append("academicYear", filters.academicYear);

      const res = await api.get(
        `/university-admin/attendance-stats/export?${params}`,
      );

      if (format === "excel") {
        // Convert to CSV and download
        const data = res.data.data;
        if (Array.isArray(data)) {
          const headers = Object.keys(data[0] || {});
          const csvRows = [
            headers.join(","),
            ...data.map((row: any) =>
              headers.map((h) => `"${row[h] || ""}"`).join(","),
            ),
          ];
          const csv = csvRows.join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Excel report downloaded");
        }
      } else {
        // PDF - open in new window or download
        toast("PDF generation ready. Click Download to save.", { icon: "📄" }); // In production, open a PDF viewer or download
        console.log("PDF data:", res.data.data);
      }
    } catch (err) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Chart data
  const chartData = {
    labels: stats?.departments?.map((d: any) => d.departmentName) || [],
    datasets: [
      {
        label: "Attendance Rate %",
        data:
          stats?.departments?.map((d: any) => parseFloat(d.averageRate)) || [],
        backgroundColor:
          stats?.departments?.map((d: any) => {
            const rate = parseFloat(d.averageRate);
            if (rate >= 80) return "rgba(16, 185, 129, 0.8)";
            if (rate >= 60) return "rgba(251, 191, 36, 0.8)";
            return "rgba(239, 68, 68, 0.8)";
          }) || [],
        borderColor:
          stats?.departments?.map((d: any) => {
            const rate = parseFloat(d.averageRate);
            if (rate >= 80) return "rgb(16, 185, 129)";
            if (rate >= 60) return "rgb(251, 191, 36)";
            return "rgb(239, 68, 68)";
          }) || [],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
          color: "#64748b",
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
      x: {
        ticks: {
          color: "#64748b",
          maxRotation: 45,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const getTrendColor = (trend: string) => {
    if (!trend) return "text-slate-400";
    return trend.includes("+") ? "text-emerald-400" : "text-rose-400";
  };

  const getPerformanceColor = (rate: string) => {
    const num = parseFloat(rate);
    if (num >= 80) return "text-emerald-400";
    if (num >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Department Attendance Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Statistics only — no individual student records at this level
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "table" ? "chart" : "table")
            }
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition text-slate-300"
          >
            {viewMode === "table" ? "📊 View Chart" : "📋 View Table"}
          </button>
          <div className="relative group">
            <button
              disabled={exporting}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 text-white disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export ▼"}
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-[#131c31] border border-slate-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10">
              <button
                onClick={() => exportReport("pdf")}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition"
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => exportReport("excel")}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition border-t border-slate-700"
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Departments</p>
          <p className="text-3xl font-bold text-blue-400">
            {summary?.totalDepartments || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-cyan-400">
            {summary?.totalSessions || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Overall Attendance</p>
          <p className="text-3xl font-bold text-emerald-400">
            {summary?.overallAvg || 0}%
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Best Department</p>
          <p className="text-xl font-bold text-amber-400 truncate">
            {stats?.summary?.bestDepartment || "N/A"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <select
          value={filters.period}
          onChange={(e) => setFilters({ ...filters, period: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
        >
          <option value="this-semester">This Semester</option>
          <option value="last-semester">Last Semester</option>
          <option value="this-academic-year">This Academic Year</option>
          <option value="all">All Time</option>
        </select>
        <button
          onClick={fetchStats}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition text-white"
        >
          Apply Filters
        </button>
        <span className="text-xs text-slate-500 ml-auto">
          {stats?.departments?.length || 0} departments reporting
        </span>
      </div>

      {/* Chart View */}
      {viewMode === "chart" && stats?.departments?.length > 0 && (
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Attendance Rate by Department
          </h3>
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-400">≥ 80% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-400">60-79% (Average)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-400">
                {"<"} 60% (Needs Improvement)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-left p-5 font-medium">Department</th>
                <th className="text-left p-5 font-medium">
                  Sessions Conducted
                </th>
                <th className="text-left p-5 font-medium">Total Sign-ins</th>
                <th className="text-left p-5 font-medium">Avg Rate</th>
                <th className="text-left p-5 font-medium">Trend</th>
                <th className="text-left p-5 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {stats?.departments?.map((s: any) => (
                <tr
                  key={s.departmentId}
                  className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
                >
                  <td className="p-5 text-white font-semibold">
                    {s.departmentName}
                  </td>
                  <td className="p-5 text-slate-400">{s.totalSessions}</td>
                  <td className="p-5 text-slate-400">{s.totalAttendance}</td>
                  <td
                    className={`p-5 font-bold ${getPerformanceColor(s.averageRate)}`}
                  >
                    {s.averageRate}%
                  </td>
                  <td className="p-5">
                    {s.trend ? (
                      <span className={`font-medium ${getTrendColor(s.trend)}`}>
                        {s.trend}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          parseFloat(s.averageRate) >= 80
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : parseFloat(s.averageRate) >= 60
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-rose-500 to-pink-500"
                        }`}
                        style={{
                          width: `${Math.min(parseFloat(s.averageRate), 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats?.departments || stats.departments.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-600">
                    No attendance data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Best/Worst Department Cards */}
      {stats?.departments && stats.departments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.summary?.bestDepartment && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">
                🏆 Best Performer
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.summary.bestDepartment}
              </p>
              <p className="text-sm text-emerald-400 mt-1">
                {stats.departments.find(
                  (d: any) => d.departmentName === stats.summary.bestDepartment,
                )?.averageRate || 0}
                % attendance rate
              </p>
            </div>
          )}
          {stats.summary?.worstDepartment && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
              <p className="text-xs text-rose-400 uppercase tracking-wider font-semibold">
                📉 Needs Improvement
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.summary.worstDepartment}
              </p>
              <p className="text-sm text-rose-400 mt-1">
                {stats.departments.find(
                  (d: any) =>
                    d.departmentName === stats.summary.worstDepartment,
                )?.averageRate || 0}
                % attendance rate
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentReports;
