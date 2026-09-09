import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const TechnicalCenter = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [depts, setDepts] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    departmentId: "",
  });
  const [filters, setFilters] = useState({
    status: "ALL",
    severity: "ALL",
    search: "",
  });
  const [viewing, setViewing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.append("status", filters.status);
    if (filters.severity !== "ALL") params.append("severity", filters.severity);
    if (filters.search) params.append("search", filters.search);

    api
      .get(`/university-admin/issues?${params}`)
      .then((r) => setIssues(r.data.data || []));
    api
      .get("/university-admin/issues/stats")
      .then((r) => setStats(r.data.data));
    api
      .get("/university-admin/departments")
      .then((r) => setDepts(r.data.data || []));
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/university-admin/issues", form);
      toast.success("Issue reported successfully");
      setForm({
        title: "",
        description: "",
        severity: "MEDIUM",
        departmentId: "",
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to report issue");
    }
  };

  const resolve = async (id: string) => {
    if (!confirm("Mark this issue as resolved?")) return;
    try {
      await api.patch(`/university-admin/issues/${id}/resolve`);
      toast.success("Issue resolved");
      fetchData();
    } catch {
      toast.error("Failed to resolve");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500 animate-pulse";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  };

  const getSeverityEmoji = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      default:
        return "🔵";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            ⚙️ Technical Center
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage technical issues across departments
          </p>
        </div>
        <span className="text-sm text-slate-400">
          {issues.length} issues reported
        </span>
      </div>

      {/* Stats Cards - Only 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Issues</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats?.total || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Open Issues</p>
          <p className="text-3xl font-bold text-amber-400">
            {stats?.open || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Critical Issues</p>
          <p className="text-3xl font-bold text-rose-400">
            {stats?.critical || 0}
          </p>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {stats?.critical > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-rose-400 font-medium">
              Critical Issues Require Immediate Attention
            </p>
            <p className="text-sm text-slate-400">
              {stats.critical} critical issue(s) need to be resolved
            </p>
          </div>
        </div>
      )}

      {/* Report Issue Form */}
      <form
        onSubmit={create}
        className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h3 className="font-semibold text-white">Report New Issue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Issue Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            required
          />
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
          >
            <option value="">All Departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Describe the technical issue..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 h-24 resize-none"
          required
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-sm font-medium hover:from-amber-500 hover:to-orange-500 transition shadow-lg shadow-amber-500/20 text-white"
        >
          Report Issue
        </button>
      </form>

      {/* Filters */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
        >
          <option value="ALL">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <input
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-4">✅</span>
            <p className="text-slate-400">No issues reported</p>
            <p className="text-slate-600 text-sm mt-1">
              All systems are running smoothly
            </p>
          </div>
        ) : (
          issues.map((issue: any) => {
            const isResolved = issue.status === "RESOLVED";

            return (
              <div
                key={issue.id}
                className={`bg-[#131c31] border rounded-2xl p-5 flex items-start gap-4 hover:border-slate-700 transition ${
                  isResolved
                    ? "border-emerald-500/20 opacity-60"
                    : issue.severity === "CRITICAL"
                      ? "border-rose-500/30"
                      : "border-slate-800"
                }`}
              >
                {/* Severity Dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${getSeverityDot(issue.severity)}`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-white">{issue.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity}
                    </span>
                    {!isResolved && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        OPEN
                      </span>
                    )}
                    {isResolved && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        RESOLVED
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {issue.department?.name || "All Departments"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {issue.description}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {new Date(issue.createdAt).toLocaleString()}
                    {isResolved && issue.resolvedAt && (
                      <span className="ml-4 text-emerald-500/60">
                        • Resolved {new Date(issue.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>

                {!isResolved && (
                  <button
                    onClick={() => resolve(issue.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs hover:bg-emerald-500/20 transition whitespace-nowrap"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TechnicalCenter;
