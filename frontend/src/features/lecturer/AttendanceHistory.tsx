import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const AttendanceHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [archived, setArchived] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    unitId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [view, setView] = useState<"active" | "archived">("active");
  const [moreModal, setMoreModal] = useState<string | null>(null);
  const [archivedModal, setArchivedModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [viewLimit] = useState(10);

  useEffect(() => {
    api.get("/lecturer/units").then((r) => setUnits(r.data.data));
    fetchHistory();
    fetchArchived();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreModal &&
        !(event.target as Element).closest(".more-modal-container")
      ) {
        setMoreModal(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreModal]);

  const fetchHistory = async () => {
    const params = new URLSearchParams();
    if (filters.unitId) params.append("unitId", filters.unitId);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    const res = await api.get(`/lecturer/history?${params}`);
    setHistory(res.data.data || []);
  };

  const fetchArchived = async () => {
    const res = await api.get("/lecturer/sessions/archived");
    setArchived(res.data.data || []);
  };

  const download = (_id: string, format: "pdf" | "excel") => {
    toast(`${format.toUpperCase()} download starting...`);
  };

  const share = (_id: string) => {
    toast.success("Shared to HOD");
  };

  const archive = async (id: string) => {
    try {
      await api.patch(`/lecturer/sessions/${id}/archive`);
      toast.success("Archived");
      fetchHistory();
      fetchArchived();
      setMoreModal(null);
    } catch {
      toast.error("Failed");
    }
  };

  const unarchive = async (id: string) => {
    try {
      await api.patch(`/lecturer/sessions/${id}/unarchive`);
      toast.success("Restored");
      fetchHistory();
      fetchArchived();
    } catch {
      toast.error("Failed");
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Permanently delete this record?")) return;
    try {
      await api.delete(`/lecturer/sessions/${id}`);
      toast.success("Deleted");
      fetchHistory();
      fetchArchived();
      setMoreModal(null);
    } catch {
      toast.error("Failed");
    }
  };

  const toggleView = () => {
    setShowAll(!showAll);
  };

  const data = view === "active" ? history : archived;
  const displayedData = showAll ? data : data.slice(0, viewLimit);

  return (
    <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base md:text-2xl font-bold text-black tracking-tight truncate">
          Attendance History
        </h1>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="flex bg-slate-700 border border-slate-600 rounded-md md:rounded-lg p-0.5 md:p-1 shadow-sm">
            <button
              onClick={() => setView("active")}
              className={`px-2 md:px-4 py-1 md:py-1.5 rounded text-[10px] md:text-xs font-medium transition ${
                view === "active"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setView("archived")}
              className={`px-2 md:px-4 py-1 md:py-1.5 rounded text-[10px] md:text-xs font-medium transition ${
                view === "archived"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-3 bg-slate-700 border border-slate-600 rounded-md md:rounded-xl p-2 md:p-3 shadow-sm">
        <select
          value={filters.unitId}
          onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
          className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Units</option>
          {units.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
        />
        <button
          onClick={fetchHistory}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-600 text-white rounded-md md:rounded-lg text-[11px] md:text-sm font-medium hover:bg-emerald-500 transition"
        >
          Apply
        </button>
      </div>

      {/* Table card */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl shadow-sm relative">
        {/* Card header */}
        <div className="flex items-center justify-between px-2 py-1.5 md:p-4 border-b border-slate-600">
          <span className="text-[10px] md:text-xs text-slate-400">
            {displayedData.length} of {data.length}
          </span>
          {data.length > viewLimit && (
            <button
              onClick={toggleView}
              className="text-[11px] md:text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
            >
              {showAll ? "Less" : "More"}
            </button>
          )}
        </div>

        {/* Table (scroll horizontally on mobile) */}
        {/* Table (no horizontal scroll on mobile) */}
        {/* Table (horizontally scrollable on mobile) */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] md:text-sm">
            <thead>
              <tr className="border-b border-slate-600 text-slate-400 text-[10px] md:text-xs uppercase bg-slate-800/50">
                <th className="text-left px-2 py-1 md:p-4 font-medium">#</th>
                <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                  Date
                </th>
                <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                  Code
                </th>
                <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                  Unit
                </th>
                <th className="hidden md:table-cell text-left p-4 font-medium">
                  Present
                </th>
                <th className="hidden md:table-cell text-left p-4 font-medium">
                  Absent
                </th>
                <th className="text-left px-2 py-1 md:p-4 font-medium">Rate</th>
                <th className="text-left px-2 py-1 md:p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((h: any, i: number) => {
                const present =
                  h.records?.filter((r: any) => r.status === "PRESENT")
                    .length || 0;
                const total = h.totalStudents || h.records?.length || 0;
                const absent = Math.max(0, total - present);
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr
                    key={h.id}
                    className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                  >
                    <td className="px-2 py-1 md:p-4 text-slate-400 text-[10px] md:text-xs">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-slate-300 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-emerald-400 font-mono text-[11px] md:text-xs font-medium whitespace-nowrap">
                      {h.unit?.code}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-white font-medium whitespace-nowrap">
                      {h.unit?.name}
                    </td>
                    <td className="hidden md:table-cell p-4 text-emerald-400 font-medium">
                      {present}
                    </td>
                    <td className="hidden md:table-cell p-4 text-rose-400 font-medium">
                      {absent}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-[11px] md:text-sm font-bold text-blue-400 whitespace-nowrap">
                      {rate}%
                    </td>
                    <td className="px-2 py-1 md:p-4 relative more-modal-container">
                      <button
                        onClick={() =>
                          setMoreModal(moreModal === h.id ? null : h.id)
                        }
                        className="text-[11px] md:text-xs px-2 md:px-3 py-0.5 md:py-1.5 rounded md:rounded-lg bg-slate-600 text-slate-300 border border-slate-500 hover:bg-slate-500 transition"
                      >
                        ⋯
                      </button>
                      {moreModal === h.id && (
                        <div className="absolute right-0 bottom-full mb-1 md:mb-2 w-32 md:w-40 bg-white border border-slate-200 rounded-md md:rounded-xl shadow-xl overflow-hidden z-50">
                          <button
                            onClick={() => download(h.id, "pdf")}
                            className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-slate-700 hover:bg-slate-100 transition"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => download(h.id, "excel")}
                            className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-slate-700 hover:bg-slate-100 transition"
                          >
                            Excel
                          </button>
                          {view === "active" ? (
                            <button
                              onClick={() => archive(h.id)}
                              className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-slate-700 hover:bg-slate-100 transition"
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => unarchive(h.id)}
                              className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-slate-700 hover:bg-slate-100 transition"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => deleteSession(h.id)}
                            className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm text-red-600 hover:bg-slate-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedData.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 md:p-12 text-center text-slate-400 text-[11px] md:text-sm"
                  >
                    No {view} records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archived Modal */}
      {archivedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 md:p-4">
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="p-3 md:p-5 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-sm md:text-lg font-bold text-white">
                Archived Records
              </h3>
              <button
                onClick={() => setArchivedModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-[10px] md:text-sm">
                <thead className="sticky top-0 bg-slate-600">
                  <tr className="border-b border-slate-500 text-slate-400 text-[9px] md:text-xs uppercase">
                    <th className="text-left p-2 md:p-4 font-medium">Date</th>
                    <th className="text-left p-2 md:p-4 font-medium">Unit</th>
                    <th className="text-left p-2 md:p-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((h: any) => (
                    <tr
                      key={h.id}
                      className="border-b border-slate-600 hover:bg-slate-600/30"
                    >
                      <td className="p-2 md:p-4 text-slate-300 whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 md:p-4 text-white truncate max-w-[120px] md:max-w-none">
                        {h.unit?.name}
                      </td>
                      <td className="p-2 md:p-4 flex gap-1 md:gap-2">
                        <button
                          onClick={() => {
                            unarchive(h.id);
                            setArchivedModal(false);
                          }}
                          className="text-[9px] md:text-xs px-1.5 md:px-3 py-1 md:py-1.5 rounded bg-emerald-900/20 text-emerald-400 border border-emerald-700 hover:bg-emerald-900/40 transition"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            deleteSession(h.id);
                            setArchivedModal(false);
                          }}
                          className="text-[9px] md:text-xs px-1.5 md:px-3 py-1 md:py-1.5 rounded bg-rose-900/20 text-rose-400 border border-rose-700 hover:bg-rose-900/40 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {archived.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-6 md:p-8 text-center text-slate-400 text-[11px] md:text-sm"
                      >
                        No archived records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
