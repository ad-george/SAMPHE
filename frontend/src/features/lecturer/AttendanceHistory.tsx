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

  // Click outside to close modal
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black tracking-tight">
          Attendance History
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700 border border-slate-600 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setView("active")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                view === "active"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setView("archived")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
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

      {/* Compact Filter Bar */}
      <div className="inline-flex flex-wrap items-center gap-3 bg-slate-700 border border-slate-600 rounded-xl p-3 shadow-sm">
        <select
          value={filters.unitId}
          onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
          className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
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
          className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
        />
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition"
        >
          Apply
        </button>
      </div>

      <div className="bg-slate-700 border border-slate-600 rounded-2xl shadow-sm relative">
        {/* Table Header with View More/Less */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <span className="text-xs text-slate-400">
            Showing {displayedData.length} of {data.length} records
          </span>
          {data.length > viewLimit && (
            <button
              onClick={toggleView}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600 text-slate-400 text-xs uppercase bg-slate-800/50">
              <th className="text-left p-4 font-medium">S/N</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Unit Code</th>
              <th className="text-left p-4 font-medium">Unit Name</th>
              <th className="text-left p-4 font-medium">Present</th>
              <th className="text-left p-4 font-medium">Absent</th>
              <th className="text-left p-4 font-medium">Rate</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((h: any, i: number) => {
              const present =
                h.records?.filter((r: any) => r.status === "PRESENT").length ||
                0;
              const total = h.totalStudents || h.records?.length || 0;
              const absent = Math.max(0, total - present);
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <tr
                  key={h.id}
                  className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                >
                  <td className="p-4 text-slate-400 text-xs">{i + 1}</td>
                  <td className="p-4 text-slate-300">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-emerald-400 font-mono text-xs font-medium">
                    {h.unit?.code}
                  </td>
                  <td className="p-4 text-white font-medium">{h.unit?.name}</td>
                  <td className="p-4 text-emerald-400 font-medium">
                    {present}
                  </td>
                  <td className="p-4 text-rose-400 font-medium">{absent}</td>
                  <td className="p-4 text-sm font-bold text-blue-400">
                    {rate}%
                  </td>
                  <td className="p-4 relative more-modal-container">
                    <button
                      onClick={() =>
                        setMoreModal(moreModal === h.id ? null : h.id)
                      }
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 text-slate-300 border border-slate-500 hover:bg-slate-500 transition"
                    >
                      More ▼
                    </button>
                    {moreModal === h.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                        <button
                          onClick={() => download(h.id, "pdf")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => download(h.id, "excel")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition"
                        >
                          Excel
                        </button>
                        {view === "active" ? (
                          <button
                            onClick={() => archive(h.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition"
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => unarchive(h.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => deleteSession(h.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-100 transition"
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
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  No {view} records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Archived Modal */}
      {archivedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-700 border border-slate-600 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Archived Records</h3>
              <button
                onClick={() => setArchivedModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-600">
                  <tr className="border-b border-slate-500 text-slate-400 text-xs uppercase">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Unit</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((h: any) => (
                    <tr
                      key={h.id}
                      className="border-b border-slate-600 hover:bg-slate-600/30"
                    >
                      <td className="p-4 text-slate-300">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-white">{h.unit?.name}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => {
                            unarchive(h.id);
                            setArchivedModal(false);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-emerald-900/20 text-emerald-400 border border-emerald-700 hover:bg-emerald-900/40 transition"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            deleteSession(h.id);
                            setArchivedModal(false);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-rose-900/20 text-rose-400 border border-rose-700 hover:bg-rose-900/40 transition"
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
                        className="p-8 text-center text-slate-400"
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
