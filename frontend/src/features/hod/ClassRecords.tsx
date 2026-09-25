import { useEffect, useState } from "react";
import api from "../../services/api";

const ClassRecords = () => {
  const [viewBy, setViewBy] = useState<"lecturer" | "unit" | "student">(
    "lecturer",
  );
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCount, setShowCount] = useState(10);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    unitId: "",
    programId: "",
    studentRegNo: "",
  });
  const [units, setUnits] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#10b981");

  const getColorWithOpacity = (opacity: number) => {
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    api
      .get("/university-admin/settings/report")
      .then((r) => {
        if (r.data.data?.accentColor) {
          setAccentColor(r.data.data.accentColor);
        }
      })
      .catch(() => {});
    api.get("/hod/units").then((r) => setUnits(r.data.data || []));
    api.get("/hod/programs").then((r) => setPrograms(r.data.data || []));
    fetchRecords();
  }, [viewBy]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ viewBy, ...filters });
      const res = await api.get(`/hod/class-records?${params}`);
      setRecords(res.data.data || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalSessions = records.length;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalRate = 0;

  records.forEach((r: any) => {
    const present =
      r.records?.filter((rec: any) => rec.status === "PRESENT").length || 0;
    // ✅ Use totalStudents instead of records.length
    const total = r.totalStudents || 0;
    totalPresent += present;
    totalAbsent += Math.max(0, total - present);
    if (total > 0) {
      totalRate += (present / total) * 100;
    }
  });

  const viewSession = (session: any) => {
    setSelectedSession(session);
    setViewModalOpen(true);
  };

  const avgRate =
    totalSessions > 0 ? (totalRate / totalSessions).toFixed(1) : "0.0";

  const displayed = records.slice(0, showCount);
  const hasMore = records.length > showCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          📊 Class Attendance Records
        </h1>
        <p className="text-slate-500 mt-1">
          View attendance sessions across your department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Sessions</p>
          <p className="text-2xl font-bold text-slate-800">{totalSessions}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Avg Rate</p>
          <p className="text-2xl font-bold text-emerald-600">{avgRate}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Present</p>
          <p className="text-2xl font-bold text-emerald-600">{totalPresent}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Absent</p>
          <p className="text-2xl font-bold text-rose-500">{totalAbsent}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        {(["lecturer", "unit", "student"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewBy(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewBy === v
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            By {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {viewBy === "student" && (
          <input
            placeholder="Search Reg No"
            value={filters.studentRegNo}
            onChange={(e) =>
              setFilters({ ...filters, studentRegNo: e.target.value })
            }
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
          />
        )}
        <select
          value={filters.unitId}
          onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Units</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={filters.programId}
          onChange={(e) =>
            setFilters({ ...filters, programId: e.target.value })
          }
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
        />
        <button
          onClick={fetchRecords}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition"
        >
          Apply
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-xs text-slate-500">
            Showing {displayed.length} of {records.length} records
          </span>
          {records.length > 10 && (
            <button
              onClick={() =>
                setShowCount(showCount === 10 ? records.length : 10)
              }
              className="text-sm text-emerald-600 hover:text-emerald-700 transition font-medium"
            >
              {showCount === 10
                ? `View More (${records.length - 10} more)`
                : "View Less"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                <th className="text-left p-3 font-medium w-12 text-center">
                  S/N
                </th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Unit</th>
                <th className="text-left p-3 font-medium">Lecturer</th>
                <th className="text-left p-3 font-medium text-center">
                  Status
                </th>
                <th className="text-left p-3 font-medium text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {viewBy === "student"
                ? (() => {
                    let runningIndex = 0;
                    return displayed.flatMap((s: any) => {
                      return (
                        s.records?.map((r: any) => {
                          runningIndex++;
                          return (
                            <tr
                              key={`${s.id}-${runningIndex}`}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                            >
                              <td className="p-3 text-slate-400 font-mono text-xs text-center">
                                {runningIndex}
                              </td>
                              <td className="p-3 text-slate-700">
                                {new Date(
                                  r.session.sessionDate,
                                ).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-slate-700">
                                {r.session.unit?.name}
                              </td>
                              <td className="p-3 text-slate-700">
                                {r.session.lecturer?.fullName}
                              </td>
                              <td className="p-3 text-center font-medium">
                                {r.status === "PRESENT" ? (
                                  <span className="text-emerald-600">
                                    ✅ Present
                                  </span>
                                ) : (
                                  <span className="text-rose-500">
                                    ❌ Absent
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => viewSession(r.session)}
                                  className="text-xs px-3 py-1.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800 hover:bg-blue-900/40 transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        }) || []
                      );
                    });
                  })()
                : displayed.map((r: any, idx: number) => {
                    const present =
                      r.records?.filter((rec: any) => rec.status === "PRESENT")
                        .length || 0;
                    const total = r.totalStudents || 0;
                    const rate =
                      total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                      >
                        <td className="p-3 text-slate-400 font-mono text-xs text-center">
                          {idx + 1}
                        </td>
                        <td className="p-3 text-slate-700">
                          {new Date(r.sessionDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-700">{r.unit?.name}</td>
                        <td className="p-3 text-slate-700">
                          {r.lecturer?.fullName}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={
                              parseFloat(rate) >= 70
                                ? "text-emerald-600"
                                : "text-rose-500"
                            }
                          >
                            {rate}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => viewSession(r)}
                            className="text-xs px-3 py-1.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800 hover:bg-blue-900/40 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    {loading ? "Loading..." : "No records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* View Session Modal */}
      {viewModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
            <div
              className="rounded-xl p-8 border-2"
              style={{ borderColor: accentColor }}
            >
              {/* Header - Close Button */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Institution Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {selectedSession.lecturer?.university?.logo ? (
                    <img
                      src={selectedSession.lecturer.university.logo}
                      alt={selectedSession.lecturer.university.name}
                      className="h-42 w-auto object-contain"
                    />
                  ) : (
                    <div
                      className="w-42 h-42 rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {selectedSession.lecturer?.university?.name?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {selectedSession.lecturer?.university?.name || "University"}
                </h3>
                {selectedSession.lecturer?.university?.address && (
                  <p className="text-sm text-slate-500 break-words">
                    {selectedSession.lecturer.university.address}
                  </p>
                )}
                {selectedSession.lecturer?.university?.phone && (
                  <p className="text-sm text-slate-500">
                    {selectedSession.lecturer.university.phone}
                  </p>
                )}
                {selectedSession.lecturer?.university?.email && (
                  <p className="text-sm text-slate-500 break-words">
                    {selectedSession.lecturer.university.email}
                  </p>
                )}
                {selectedSession.lecturer?.university?.website && (
                  <p className="text-sm text-slate-500 break-words">
                    {selectedSession.lecturer.university.website}
                  </p>
                )}
              </div>

              <hr className="border-slate-200 my-4" />

              {/* ACADEMIC SESSION DETAILS */}
              <div className="mb-6 text-center">
                <h4
                  className="text-sm font-semibold mb-3 uppercase tracking-wide text-center"
                  style={{ color: accentColor }}
                >
                  ACADEMIC SESSION DETAILS
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm max-w-2xl mx-auto text-left">
                  <div className="flex">
                    <span className="text-slate-500 w-32">School:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedSession.lecturer?.department?.faculty?.name ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Stage / Campus:</span>
                    <span className="text-slate-800 font-medium">
                      {(() => {
                        const year =
                          selectedSession.unit?.studyYear?.name || "";
                        const semester =
                          selectedSession.unit?.semester?.name || "";
                        const yearNum = year.match(/\d+/)?.[0] || "?";
                        const semNum = semester.match(/\d+/)?.[0] || "?";
                        return `Y${yearNum}S${semNum} / MAIN`;
                      })()}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Department:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedSession.lecturer?.department?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Date / Week:</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(selectedSession.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
                      / Week:{" "}
                      {Math.ceil(
                        (new Date(selectedSession.createdAt).getDate() - 1) /
                          7 +
                          1,
                      ) || 1}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Programme:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedSession.unit?.program?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Lecturer:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedSession.lecturer?.fullName || "N/A"}
                    </span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="text-slate-500 w-32">Unit:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedSession.unit?.code} -{" "}
                      {selectedSession.unit?.name}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 my-4" />

              {/* STATS */}
              {(() => {
                const total = selectedSession.totalStudents || 0;
                const present =
                  selectedSession.records?.filter(
                    (r: any) => r.status === "PRESENT",
                  ).length || 0;
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <div className="mb-6">
                    <h4
                      className="text-sm font-semibold mb-3 uppercase tracking-wide text-center"
                      style={{ color: accentColor }}
                    >
                      STATS
                    </h4>
                    <div
                      className="grid grid-cols-3 gap-0 border rounded-lg overflow-hidden"
                      style={{ borderColor: accentColor }}
                    >
                      <div
                        className="p-3 text-center border-r"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <p
                          className="text-xs uppercase font-medium"
                          style={{ color: accentColor }}
                        >
                          PRESENT
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {present}
                        </p>
                      </div>
                      <div
                        className="p-3 text-center border-r"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <p className="text-xs text-slate-500 uppercase font-medium">
                          TOTAL ENROLLED
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {total}
                        </p>
                      </div>
                      <div
                        className="p-3 text-center"
                        style={{ backgroundColor: getColorWithOpacity(0.05) }}
                      >
                        <p className="text-xs text-slate-500 uppercase font-medium">
                          ATTENDANCE RATE
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: accentColor }}
                        >
                          {rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <hr className="border-slate-200 my-4" />

              {/* ATTENDANCE RECORD */}
              <div className="mb-6">
                <h4
                  className="text-sm font-semibold mb-3 uppercase tracking-wide text-center"
                  style={{ color: accentColor }}
                >
                  ATTENDANCE RECORD
                </h4>
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{ borderColor: accentColor }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <th className="text-left p-3 font-medium text-slate-600 w-12">
                          #
                        </th>
                        <th className="text-left p-3 font-medium text-slate-600">
                          Registration No.
                        </th>
                        <th className="text-left p-3 font-medium text-slate-600">
                          Student Name
                        </th>
                        <th className="text-left p-3 font-medium text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSession.records?.map((r: any, idx: number) => (
                        <tr
                          key={r.id}
                          className="border-b hover:bg-slate-50 transition"
                          style={{ borderColor: `${accentColor}30` }}
                        >
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-slate-700 font-mono text-xs">
                            {r.student?.regNo || "N/A"}
                          </td>
                          <td className="p-3 text-slate-700">
                            {r.student?.fullName || "Unknown"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-xs font-bold ${
                                r.status === "PRESENT"
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!selectedSession.records ||
                        selectedSession.records.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-6 text-center text-slate-400"
                          >
                            No attendance records for this session
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="border-slate-200 my-4" />

              {/* SIGNATURE SECTION */}
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    HOD Signature:
                  </p>
                  <div className="h-8 border-b border-slate-300 mt-2"></div>
                  <p className="text-xs text-slate-400 mt-1">
                    Date: ___________
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    LEC. Signature:
                  </p>
                  <div className="h-8 border-b border-slate-300 mt-2"></div>
                  <p className="text-xs text-slate-400 mt-1">
                    Date: ___________
                  </p>
                </div>
              </div>

              <hr className="border-slate-200 my-4" />

              {/* FOOTER */}
              <div className="text-center">
                <p className="text-xs" style={{ color: accentColor }}>
                  Generated by SUAMP Smart Attendance System
                </p>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassRecords;
