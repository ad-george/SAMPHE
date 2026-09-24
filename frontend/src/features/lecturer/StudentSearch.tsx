import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
);

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [period, setPeriod] = useState("semester");
  const [unitFilter, setUnitFilter] = useState("all");
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [viewLimit, setViewLimit] = useState(10);

  useEffect(() => {
    fetchStudents();
    api.get("/lecturer/units").then((r) => setUnits(r.data.data));
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (programFilter) params.append("programId", programFilter);
      const res = await api.get(`/lecturer/students?${params}`);
      setStudents(res.data.data || []);
      const progs = [
        ...new Map(
          res.data.data
            ?.map((s: any) => [s.programId, s.program])
            .filter(Boolean),
        ).values(),
      ];
      setPrograms(progs);
    } finally {
      setLoading(false);
    }
  };

  const viewStudentWithFilters = async (student: any, p: string, u: string) => {
    if (!student) return;
    try {
      const url = `/lecturer/students/${student.id}/detail?period=${p}${u !== "all" ? `&unitId=${u}` : ""}`;
      const res = await api.get(url);
      setDetail(res.data.data);
    } catch (error) {
      console.error("Failed to fetch student details:", error);
    }
  };

  const viewStudent = async (student: any) => {
    setSelectedStudent(student);
    viewStudentWithFilters(student, period, unitFilter);
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.fullName?.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.regNo?.toLowerCase().includes(searchQ.toLowerCase())) &&
      (programFilter ? s.programId === programFilter : true),
  );

  const displayedStudents = showAll
    ? filteredStudents
    : filteredStudents.slice(0, viewLimit);

  const toggleView = () => {
    setShowAll(!showAll);
  };

  const trendData = detail?.overallSessions
    ? {
        labels: detail.overallSessions
          .slice(0, 20)
          .map((_: any, i: number) => `C${i + 1}`),
        datasets: [
          {
            label: "Present",
            data: detail.overallSessions.map((r: any) =>
              r.status === "PRESENT" ? 100 : 0,
            ),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 2,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const unitBarData = detail?.byUnit
    ? {
        labels: detail.byUnit.map((u: any) => u.unit?.code),
        datasets: [
          {
            label: "Rate %",
            data: detail.byUnit.map((u: any) =>
              u.expected > 0 ? Math.round((u.present / u.expected) * 100) : 0,
            ),
            backgroundColor: "#10b981",
            borderRadius: 4,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const formatYearSem = (studyYear: any, semester: any) => {
    const yearNum = studyYear?.name?.match(/\d+/)?.[0] || "?";
    const semNum = semester?.name?.match(/\d+/)?.[0] || "?";
    return `Y${yearNum}S${semNum}`;
  };

  // ────────────────────────────────────────────────────────
  // STUDENT DETAIL VIEW
  // ────────────────────────────────────────────────────────
  if (selectedStudent && detail) {
    return (
      <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
        <button
          onClick={() => {
            setSelectedStudent(null);
            setDetail(null);
          }}
          className="text-[11px] md:text-sm text-green-600 hover:text-green-800 font-bold flex items-center gap-1 mb-1 md:mb-2"
        >
          ← Back to Students
        </button>

        {/* Student Header */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 flex items-start gap-2.5 md:gap-5 shadow-sm">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-emerald-900/30 flex items-center justify-center text-sm md:text-xl font-bold text-emerald-400 border border-emerald-700 shrink-0">
            {selectedStudent.fullName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] md:text-xl font-bold text-white truncate">
              {selectedStudent.fullName}
            </h2>
            <p className="text-[10px] md:text-sm text-slate-400 truncate">
              {selectedStudent.regNo} • {selectedStudent.program?.name} •{" "}
              {formatYearSem(
                selectedStudent.studyYear,
                selectedStudent.semester,
              )}
            </p>
          </div>
          <div className="flex gap-1.5 md:gap-2 shrink-0">
            <select
              value={period}
              onChange={(e) => {
                const newPeriod = e.target.value;
                setPeriod(newPeriod);
                viewStudentWithFilters(selectedStudent, newPeriod, unitFilter);
              }}
              className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-1.5 md:px-3 py-1 md:py-2 text-[10px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="semester">Sem</option>
              <option value="month">30d</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={unitFilter}
              onChange={(e) => {
                const newUnitFilter = e.target.value;
                setUnitFilter(newUnitFilter);
                viewStudentWithFilters(selectedStudent, period, newUnitFilter);
              }}
              className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-1.5 md:px-3 py-1 md:py-2 text-[10px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="all">All</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-1 md:gap-4">
          <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center shadow-sm">
            <p className="text-[8px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
              Expected
            </p>
            <p className="text-[11px] md:text-2xl font-bold text-white leading-tight">
              {detail.summary.totalExpected}
            </p>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center shadow-sm">
            <p className="text-[8px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
              Present
            </p>
            <p className="text-[11px] md:text-2xl font-bold text-emerald-400 leading-tight">
              {detail.summary.totalPresent}
            </p>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center shadow-sm">
            <p className="text-[8px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
              Missed
            </p>
            <p className="text-[11px] md:text-2xl font-bold text-rose-400 leading-tight">
              {detail.summary.totalMissed}
            </p>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center shadow-sm">
            <p className="text-[8px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
              Rate
            </p>
            <p className="text-[11px] md:text-2xl font-bold text-blue-400 leading-tight">
              {detail.summary.rate}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
            <h3 className="text-[11px] md:text-base font-bold text-white mb-1.5 md:mb-4">
              Attendance Trend
            </h3>
            <div className="h-40 md:h-56">
              <Line
                data={trendData}
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
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
            <h3 className="text-[11px] md:text-base font-bold text-white mb-1.5 md:mb-4">
              Performance by Unit
            </h3>
            <div className="h-40 md:h-56">
              <Bar
                data={unitBarData}
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
                      ticks: { color: "#94a3b8" },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Session History */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl overflow-hidden shadow-sm">
          <div className="px-2.5 py-1.5 md:p-5 border-b border-slate-600">
            <h3 className="text-[11px] md:text-base font-bold text-white">
              Session History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] md:text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-slate-400 text-[10px] md:text-xs uppercase bg-slate-800/50">
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Code
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Unit
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.overallSessions?.map((s: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                  >
                    <td className="px-2 py-1 md:p-4 text-slate-300 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-emerald-400 font-mono text-[11px] md:text-xs font-medium whitespace-nowrap">
                      {s.unitCode}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-white whitespace-nowrap">
                      {s.unitName}
                    </td>
                    <td className="px-2 py-1 md:p-4">
                      <span
                        className={`text-[9px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full border ${
                          s.status === "PRESENT"
                            ? "bg-emerald-900/30 text-emerald-400 border-emerald-700"
                            : "bg-rose-900/30 text-rose-400 border-rose-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {detail.overallSessions?.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 md:p-8 text-center text-slate-400 text-[11px] md:text-sm"
                    >
                      No sessions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per Unit Breakdown */}
        {detail.byUnit?.length > 0 && (
          <div className="space-y-2 md:space-y-4">
            <h3 className="text-[11px] md:text-base font-bold text-black mb-1.5 md:mb-3">
              Per Unit Breakdown
            </h3>
            {detail.byUnit.map((u: any) => (
              <div
                key={u.unit?.id}
                className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5 md:mb-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] md:text-sm font-bold text-white truncate">
                      {u.unit?.code} — {u.unit?.name}
                    </p>
                    <p className="text-[9px] md:text-xs text-slate-400">
                      {u.expected} classes • {u.present} present • {u.missed}{" "}
                      missed
                    </p>
                  </div>
                  <span
                    className={`text-sm md:text-lg font-bold shrink-0 ${
                      u.expected > 0 && (u.present / u.expected) * 100 >= 75
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {u.expected > 0
                      ? Math.round((u.present / u.expected) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-1.5 md:h-2">
                  <div
                    className="bg-emerald-500 h-1.5 md:h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, u.expected > 0 ? (u.present / u.expected) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // STUDENT LIST VIEW
  // ────────────────────────────────────────────────────────
  return (
    <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
      <h1 className="text-base md:text-2xl font-bold text-slate-800 tracking-tight">
        Students
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-3 bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-2 md:p-4 shadow-sm">
        <input
          placeholder="Search by name or reg no..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="flex-1 min-w-[150px] bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-2 md:px-4 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none placeholder-slate-400"
        />
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="bg-slate-600 border border-slate-500 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Programs</option>
          {programs.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-xl p-1.5 md:p-4 text-center shadow-sm">
          <p className="text-[9px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
            Students
          </p>
          <p className="text-[13px] md:text-xl font-bold text-white leading-tight">
            {students.length}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-xl p-1.5 md:p-4 text-center shadow-sm">
          <p className="text-[9px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
            Programs
          </p>
          <p className="text-[13px] md:text-xl font-bold text-emerald-400 leading-tight">
            {programs.length}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-xl p-1.5 md:p-4 text-center shadow-sm">
          <p className="text-[9px] md:text-xs text-slate-400 uppercase font-semibold leading-tight">
            Showing
          </p>
          <p className="text-[13px] md:text-xl font-bold text-blue-400 leading-tight">
            {displayedStudents.length}/{filteredStudents.length}
          </p>
        </div>
      </div>

      {/* Student Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header with View More/Less */}
          <div className="flex items-center justify-between px-2.5 py-1.5 md:p-5 border-b border-slate-600">
            <h3 className="text-[11px] md:text-base font-bold text-white">
              Student List
            </h3>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-[10px] md:text-xs text-slate-400">
                {displayedStudents.length}/{filteredStudents.length}
              </span>
              {filteredStudents.length > viewLimit && (
                <button
                  onClick={toggleView}
                  className="text-[11px] md:text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  {showAll ? "Less" : "More →"}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] md:text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-slate-400 text-[10px] md:text-xs uppercase bg-slate-800/50">
                  <th className="text-left px-2 py-1 md:p-4 font-medium">#</th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Reg No.
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium whitespace-nowrap">
                    Program
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium">
                    Y/S
                  </th>
                  <th className="text-left px-2 py-1 md:p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((s: any, index: number) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-600 hover:bg-slate-600/30 transition cursor-pointer"
                    onClick={() => viewStudent(s)}
                  >
                    <td className="px-2 py-1 md:p-4 text-slate-400 text-[10px] md:text-xs font-mono">
                      {index + 1}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-white font-medium whitespace-nowrap">
                      {s.fullName}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-slate-300 font-mono text-[11px] md:text-xs whitespace-nowrap">
                      {s.regNo}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-slate-300 whitespace-nowrap">
                      {s.program?.name}
                    </td>
                    <td className="px-2 py-1 md:p-4 text-slate-300 whitespace-nowrap">
                      {formatYearSem(s.studyYear, s.semester)}
                    </td>
                    <td className="px-2 py-1 md:p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewStudent(s);
                        }}
                        className="text-[11px] md:text-xs px-2 md:px-3 py-0.5 md:py-1.5 rounded md:rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {displayedStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 md:p-12 text-center text-slate-400 text-[11px] md:text-sm"
                    >
                      <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <span className="text-2xl md:text-4xl">👤</span>
                        <p>No students found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
