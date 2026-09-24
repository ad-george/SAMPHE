import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const LiveSession = () => {
  const [session, setSession] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = (location.state as any)?.sessionId;

  const fetchSession = async () => {
    try {
      const id =
        sessionId || (await api.get("/lecturer/sessions/active")).data.data?.id;
      if (!id) {
        fetchRecent();
        setSession(null);
        return;
      }
      const res = await api.get(`/lecturer/sessions/${id}`);
      setSession(res.data.data);

      const elapsed = Math.floor(
        (Date.now() - new Date(res.data.data.createdAt).getTime()) / 1000,
      );
      const remaining = Math.max(0, res.data.data.duration * 60 - elapsed);
      setTimer(remaining);

      if (remaining === 0 && res.data.data.status === "ACTIVE") {
        console.log("⏰ Session time expired, auto-ending...");
        await api.patch(`/lecturer/sessions/${res.data.data.id}/end`);
        setSession(null);
        fetchRecent();
      }
    } catch {
      fetchRecent();
      setSession(null);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get("/lecturer/history");
      setRecentHistory(res.data.data?.slice(0, 5) || []);
    } catch {}
  };

  useEffect(() => {
    fetchSession();

    const interval = setInterval(fetchSession, 5000);

    const countdown = setInterval(() => {
      setTimer((t) => {
        const newTime = Math.max(0, t - 1);

        if (newTime === 0 && session?.id && session?.status === "ACTIVE") {
          console.log("⏰ Timer reached 0, auto-ending session...");
          api
            .patch(`/lecturer/sessions/${session.id}/end`)
            .then(() => {
              setSession(null);
              fetchRecent();
            })
            .catch((err) => {
              console.error("Auto-end failed:", err);
              fetchSession();
            });
        }

        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [sessionId, session?.id, session?.status]);

  const end = async () => {
    if (!session) return;
    try {
      await api.patch(`/lecturer/sessions/${session.id}/end`);
      toast.success("Session ended");
      navigate("/lecturer/history");
    } catch {
      toast.error("Failed to end session");
    }
  };

  const copyLink = () => {
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;
    const link = `${protocol}//${hostname}${port}/attendance/${session?.token}`;

    navigator.clipboard.writeText(link);
    toast.success("Link copied");
    console.log("📋 Copied link:", link);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ────────────────────────────────────────────────────────
  // NO ACTIVE SESSION
  // ────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-4 md:p-8 shadow-sm text-center">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-2 md:mb-4 border border-slate-500">
            <span className="text-base md:text-2xl">🔴</span>
          </div>
          <h2 className="text-sm md:text-xl font-bold text-white mb-1 md:mb-2">
            No Active Session
          </h2>
          <p className="text-[11px] md:text-sm text-slate-400 max-w-md mx-auto mb-3 md:mb-6">
            You don't have an attendance session running right now. Start one to
            begin tracking student check-ins in real-time.
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/lecturer/start")}
              className="px-3 md:px-6 py-1.5 md:py-2.5 bg-emerald-600 text-white rounded-md md:rounded-xl text-[11px] md:text-sm font-medium hover:bg-emerald-500 transition shadow-sm"
            >
              Start New Session
            </button>
            <button
              onClick={() => navigate("/lecturer/history")}
              className="px-3 md:px-6 py-1.5 md:py-2.5 bg-slate-600 border border-slate-500 text-white rounded-md md:rounded-xl text-[11px] md:text-sm font-medium hover:bg-slate-500 transition"
            >
              View History
            </button>
          </div>
        </div>

        {recentHistory.length > 0 && (
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
            <h3 className="text-xs md:text-base font-bold text-white mb-2 md:mb-4">
              Recent Sessions
            </h3>
            <div className="space-y-1.5 md:space-y-3">
              {recentHistory.map((h: any, i: number) => {
                const present =
                  h.records?.filter((r: any) => r.status === "PRESENT")
                    .length || 0;
                const total = h.totalStudents || h.records?.length || 0;
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 md:p-4 bg-slate-600 rounded-md md:rounded-xl border border-slate-500 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] md:text-sm font-semibold text-white truncate">
                        {h.unit?.name}
                      </p>
                      <p className="text-[9px] md:text-xs text-slate-400 truncate">
                        {new Date(h.createdAt).toLocaleDateString()} • {total}{" "}
                        students
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                      <span
                        className={`text-[11px] md:text-sm font-bold ${
                          rate >= 80
                            ? "text-emerald-400"
                            : rate >= 60
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {rate}%
                      </span>
                      <span className="text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-emerald-900/30 text-emerald-400 font-medium">
                        {present}/{total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase font-semibold mb-0.5 md:mb-1">
              How It Works
            </p>
            <p className="text-[11px] md:text-sm text-slate-300">
              Select a unit, set duration and radius, then generate a unique
              link for students to check in.
            </p>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase font-semibold mb-0.5 md:mb-1">
              GPS Verification
            </p>
            <p className="text-[11px] md:text-sm text-slate-300">
              Students must be within the set radius to mark attendance.
              Location data is captured automatically.
            </p>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase font-semibold mb-0.5 md:mb-1">
              Real-time Tracking
            </p>
            <p className="text-[11px] md:text-sm text-slate-300">
              Watch check-ins populate live. Export or share results instantly
              with your HOD.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // ACTIVE SESSION
  // ────────────────────────────────────────────────────────
  const records = session.records || [];
  const present = records.filter((r: any) => r.status === "PRESENT").length;
  const totalStudents = session.totalStudents || 0;
  const absent = totalStudents - present;
  const rate =
    totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
  const outside = records.filter(
    (r: any) => r.distance && r.distance > session.radius,
  ).length;
  const recentCheckins = [...records]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1.5 md:gap-4 bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2 md:p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 md:gap-3">
            <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h1 className="text-[11px] md:text-2xl font-bold text-white tracking-tight truncate">
              Live Session — {session.unit?.name}
            </h1>
          </div>
          <p className="text-[9px] md:text-sm text-slate-400 truncate mt-0.5">
            Code: {session.unit?.code} • Radius: {session.radius}m
          </p>
        </div>
        <div className="flex items-center gap-1 md:gap-3 flex-wrap">
          <div className="bg-slate-600 border border-slate-500 rounded-md md:rounded-xl px-1.5 md:px-5 py-0.5 md:py-3 text-center min-w-[50px] md:min-w-[100px]">
            <p className="text-[7px] md:text-xs text-slate-400 uppercase leading-tight">
              Left
            </p>
            <p
              className={`text-[11px] md:text-xl font-mono font-bold leading-tight ${
                timer < 60 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {formatTime(timer)}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="px-1.5 md:px-4 py-1 md:py-2.5 bg-slate-600 text-emerald-400 border border-slate-500 rounded md:rounded-lg text-[9px] md:text-sm font-medium hover:bg-slate-500 transition whitespace-nowrap"
          >
            Copy
          </button>
          <button
            onClick={end}
            className="px-1.5 md:px-4 py-1 md:py-2.5 bg-rose-900/20 text-rose-400 border border-rose-800 rounded md:rounded-lg text-[9px] md:text-sm font-medium hover:bg-rose-900/40 transition whitespace-nowrap"
          >
            End
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1 md:gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 shadow-sm text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Total
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-white leading-tight">
            {totalStudents}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 shadow-sm text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Present
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-emerald-400 leading-tight">
            {present}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 shadow-sm text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Absent
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-rose-400 leading-tight">
            {absent}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 shadow-sm text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Rate
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-blue-400 leading-tight">
            {rate}%
          </p>
        </div>
      </div>

      {outside > 0 && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-md md:rounded-xl p-2 md:p-4 text-[10px] md:text-sm text-amber-400 flex items-center gap-1.5 md:gap-2">
          <span>⚠</span> {outside} student(s) marked outside radius
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-6">
        {/* Left Panel */}
        <div className="space-y-2 md:space-y-4">
          {/* Recent Check-ins */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <h3 className="text-[11px] md:text-sm font-bold text-white mb-1.5 md:mb-3">
              Recent Check-ins
            </h3>
            <div className="space-y-1 md:space-y-2">
              {recentCheckins.map((r: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-1.5 md:p-2.5 bg-slate-600 rounded-md md:rounded-lg border border-slate-500 gap-2"
                >
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <span className="text-emerald-400 text-[10px] md:text-xs shrink-0">
                      ●
                    </span>
                    <span className="text-[11px] md:text-sm text-white truncate">
                      {r.student?.fullName}
                    </span>
                  </div>
                  <span className="text-[9px] md:text-xs text-slate-400 shrink-0">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {recentCheckins.length === 0 && (
                <p className="text-[10px] md:text-xs text-slate-400 text-center py-1.5 md:py-2">
                  Waiting for check-ins...
                </p>
              )}
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <h3 className="text-[11px] md:text-sm font-bold text-white mb-1.5 md:mb-2">
              Share Link
            </h3>
            <div className="bg-slate-600 rounded-md md:rounded-lg p-1.5 md:p-3 border border-slate-500 flex items-center justify-between gap-1.5 md:gap-2">
              <code className="text-[10px] md:text-xs text-emerald-400 truncate">
                {`${window.location.origin}/attendance/${session?.token}`}
              </code>
              <button
                onClick={copyLink}
                className="text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 bg-emerald-600 text-white rounded md:rounded-md hover:bg-emerald-500 transition shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm">
            <h3 className="text-[11px] md:text-sm font-bold text-white mb-1.5 md:mb-3">
              Session Info
            </h3>
            <div className="space-y-1 md:space-y-2 text-[10px] md:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Duration</span>
                <span className="text-white font-medium">
                  {session.duration} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Radius</span>
                <span className="text-white font-medium">
                  {session.radius}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Started</span>
                <span className="text-white font-medium">
                  {new Date(session.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS</span>
                <span className="text-white font-medium text-[9px] md:text-xs truncate max-w-[100px] md:max-w-[120px]">
                  {session.gpsLocation || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Students</span>
                <span className="text-white font-medium">
                  {session.totalStudents || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Real-time Feed */}
        <div className="lg:col-span-2 bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl overflow-hidden shadow-sm">
          <div className="p-2 md:p-4 border-b border-slate-600 flex items-center justify-between">
            <h3 className="text-[11px] md:text-base font-bold text-white">
              Real-time Feed
            </h3>
            <span className="text-[9px] md:text-xs text-slate-400 flex items-center gap-1 md:gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[600px]">
            <table className="w-full text-[10px] md:text-sm">
              <thead className="sticky top-0 bg-slate-600 z-10">
                <tr className="border-b border-slate-500 text-slate-400 text-[9px] md:text-xs uppercase">
                  <th className="text-left p-1.5 md:p-4 font-medium">Reg No</th>
                  <th className="text-left p-1.5 md:p-4 font-medium">Name</th>
                  <th className="text-left p-1.5 md:p-4 font-medium">Time</th>
                  <th className="text-left p-1.5 md:p-4 font-medium">Dist</th>
                  <th className="text-left p-1.5 md:p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any, i: number) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-600 hover:bg-slate-600/50 transition ${
                      r.distance && r.distance > session.radius
                        ? "bg-amber-900/20"
                        : ""
                    }`}
                  >
                    <td className="p-1.5 md:p-4 text-slate-300 font-mono text-[9px] md:text-xs">
                      {r.student?.regNo}
                    </td>
                    <td className="p-1.5 md:p-4 text-white font-medium truncate max-w-[100px] md:max-w-none">
                      {r.student?.fullName}
                    </td>
                    <td className="p-1.5 md:p-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-1.5 md:p-4 text-slate-400">
                      {r.distance !== null && r.distance !== undefined
                        ? `${Math.round(r.distance)}m`
                        : "—"}
                    </td>
                    <td className="p-1.5 md:p-4">
                      <span
                        className={`text-[9px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full border ${
                          r.status === "PRESENT"
                            ? "bg-emerald-900/30 text-emerald-400 border-emerald-700"
                            : "bg-rose-900/30 text-rose-400 border-rose-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 md:p-16 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-600 flex items-center justify-center border border-slate-500">
                          <span className="text-sm md:text-xl">👥</span>
                        </div>
                        <p className="text-[10px] md:text-base">
                          No check-ins yet.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
