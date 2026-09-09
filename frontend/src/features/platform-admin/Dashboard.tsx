import { useEffect, useState } from "react";
import api from "../../services/api";

const StatCard = ({ title, value, icon, gradient }: any) => (
  <div className="relative group">
    <div
      className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
    />
    <div className="relative bg-[#13131f] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-lg`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const PlatformAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentUniversities, setRecentUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState("30");

  const [universityFilter, setUniversityFilter] = useState<
    "date" | "consumption"
  >("date");
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentUniversities();
    fetchRecentActivity();

    const interval = setInterval(() => {
      fetchStats();
      fetchRecentUniversities();
    }, 30000); // 30 seconds fetch interval for real-time updates

    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const res = await api.get("/platform-admin/activity");
      setActivities(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/platform-admin/stats");
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUniversities = async () => {
    try {
      const res = await api.get("/platform-admin/universities");
      setRecentUniversities(res.data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Platform Overview
          </h1>
          <p className="text-gray-500">
            Real-time insights across all tenant universities
          </p>
        </div>
        {/* <button className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-medium text-sm hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-500/20">
          + Register New University
        </button> */}
      </div>

      {/* Stats Grid */}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Universities"
          value={stats?.activeUniversities || 0}
          icon="▣"
          gradient="from-violet-500 to-purple-600"
        />
        <StatCard
          title="Total Universities"
          value={stats?.totalUniversities || 0}
          icon="◉"
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Total Departments"
          value={stats?.totalDepartments || 0}
          icon="◈"
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Total Licenses"
          value={stats?.totalLicenses || 0}
          icon="◊"
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Revenue Analytics</h3>
              <p className="text-xs text-gray-500 mt-1">
                Subscription income across all institutions
              </p>
            </div>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="30" className="bg-[#13131f]">
                Last 30 Days
              </option>
              <option value="90" className="bg-[#13131f]">
                Last 90 Days
              </option>
              <option value="365" className="bg-[#13131f]">
                This Year
              </option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-full bg-gradient-to-t from-violet-600/40 to-violet-400/60 rounded-t-lg transition-all duration-300 group-hover:from-violet-500/60 group-hover:to-violet-300/80 relative overflow-hidden"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                </div>
                <span className="text-[10px] text-gray-600">
                  {
                    [
                      "J",
                      "F",
                      "M",
                      "A",
                      "M",
                      "J",
                      "J",
                      "A",
                      "S",
                      "O",
                      "N",
                      "D",
                    ][i]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">License Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Active</span>
                  <span className="text-emerald-400 font-medium">
                    {stats?.activeLicensePercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{
                      width: `${stats?.activeLicensePercentage || 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Unused</span>
                  <span className="text-blue-400 font-medium">
                    {stats?.unusedLicensePercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{
                      width: `${stats?.unusedLicensePercentage || 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Expired</span>
                  <span className="text-amber-400 font-medium">
                    {stats?.expiredLicensePercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{
                      width: `${stats?.expiredLicensePercentage || 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Revoked / Suspended</span>
                  <span className="text-rose-400 font-medium">
                    {stats?.revokedSuspendedLicensePercentage || 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                    style={{
                      width: `${stats?.revokedSuspendedLicensePercentage || 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-6">
            <h3 className="font-semibold mb-2 text-violet-300">System Alert</h3>
            <p className="text-sm text-gray-400 mb-3">
              Monitor license status and university access from the platform.
            </p>
            <button className="text-sm text-violet-400 hover:text-violet-300 font-medium">
              Manage Licenses
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
        {/* Recent Universities */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Recent Universities</h3>

            <select
              value={universityFilter}
              onChange={(e) =>
                setUniversityFilter(e.target.value as "date" | "consumption")
              }
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="date" className="bg-[#13131f]">
                Date Onboarded
              </option>
              <option value="consumption" className="bg-[#13131f]">
                Resource Consumption
              </option>
            </select>
          </div>
          <div className="space-y-3">
            {recentUniversities.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg shrink-0">
                  {u.name?.charAt(0) || "U"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">
                    {u.email || "No email"}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    u.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {u.status}
                </span>

                {universityFilter === "date" ? (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-violet-400 whitespace-nowrap">
                    Coming soon
                  </span>
                )}
              </div>
            ))}

            {recentUniversities.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">
                No universities registered yet
              </p>
            )}
          </div>
        </div>
        {/* Activity Feed */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Activity Feed</h3>
            <span className="text-xs text-gray-500">Live</span>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />

            {activities.map((a: any, i: number) => (
              <div key={a.id || i} className="flex gap-4 relative">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 z-10 ${
                    a.activity?.toLowerCase().includes("error") ||
                    a.activity?.toLowerCase().includes("failed")
                      ? "bg-rose-500/20 text-rose-400"
                      : a.activity?.toLowerCase().includes("warning")
                        ? "bg-amber-500/20 text-amber-400"
                        : a.activity?.toLowerCase().includes("license")
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  ●
                </div>

                <div className="flex-1 pb-2 min-w-0">
                  <p className="text-sm truncate">{a.activity}</p>

                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {a.university?.name || a.description || "System activity"}
                  </p>

                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(a.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
