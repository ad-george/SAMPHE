import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Reports = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const [programId, setProgramId] = useState("");
  const [studyYearId, setStudyYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [units, setUnits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAll, setShowAll] = useState(false);
  const viewLimit = 10;

  const [gridOpen, setGridOpen] = useState(false);
  const [gridData, setGridData] = useState<any>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [accentColor, setAccentColor] = useState("#10b981");

  // Load filters
  useEffect(() => {
    Promise.all([
      api.get("/hod/programs"),
      api.get("/hod/study-years"),
      api.get("/hod/semesters"),
    ]).then(([p, y, s]) => {
      setPrograms(p.data.data || []);
      setYears(y.data.data || []);
      setSemesters(s.data.data || []);
    });

    api
      .get("/university-admin/settings/report")
      .then((r) => {
        if (r.data.data?.accentColor) setAccentColor(r.data.data.accentColor);
      })
      .catch(() => {});
  }, []);

  // Fetch students matrix when filters change
  useEffect(() => {
    fetchMatrix();
  }, [programId, studyYearId, semesterId]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (programId) params.append("programId", programId);
      if (studyYearId) params.append("studyYearId", studyYearId);
      if (semesterId) params.append("semesterId", semesterId);

      const res = await api.get(`/hod/reports/students?${params}`);
      setStudents(res.data.data.students || []);
      setUnits(res.data.data.units || []);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const openGrid = async (studentId: string) => {
    setGridOpen(true);
    setGridLoading(true);
    setGridData(null);
    try {
      const res = await api.get(`/hod/reports/students/${studentId}/grid`);
      setGridData(res.data.data);
    } catch {
      toast.error("Failed to load student details");
      setGridOpen(false);
    } finally {
      setGridLoading(false);
    }
  };

  const closeGrid = () => {
    setGridOpen(false);
    setGridData(null);
  };

  // Get colour for a percentage
  const pctColour = (pct: number) => {
    if (pct >= 75) return "text-emerald-600";
    if (pct >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  // Truncate unit name for column header
  const truncate = (name: string) =>
    name.length > 7 ? name.substring(0, 7) + "..." : name;

  // ============================================================
  // PDF EXPORT (client-side)
  // ============================================================
  const downloadPDF = () => {
    if (!gridData) return;

    const uni = gridData.university || {};
    const dept = gridData.department || {};
    const faculty = gridData.faculty || {};

    const unitHeaders = gridData.units
      .map((u: any) => `<th>${u.code}</th>`)
      .join("");

    const rows = gridData.dates
      .map((date: string) => {
        const cells = gridData.units
          .map((u: any) => {
            const status = gridData.grid[date]?.[u.id];
            if (status === "PRESENT") return `<td class="present">✓</td>`;
            if (status === "ABSENT") return `<td class="absent">✗</td>`;
            return `<td>—</td>`;
          })
          .join("");
        return `<tr><td class="date">${date}</td>${cells}</tr>`;
      })
      .join("");

    const summaryRows = gridData.summary.perUnit
      .map(
        (u: any) =>
          `<tr><td>${u.unitCode} - ${u.unitName}</td><td>${u.present}</td><td>${u.missed}</td><td>${u.total}</td></tr>`,
      )
      .join("");

    const contactLines = [uni.address, uni.phone, uni.email, uni.website]
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");

    const logoHtml = uni.logo
      ? `<img src="${uni.logo}" class="logo" />`
      : `<div class="logo-fallback">${(uni.name || "U").charAt(0)}</div>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Attendance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { height: 100px; width: auto; margin-bottom: 10px; object-fit: contain; }
          .logo-fallback {
            width: 80px; height: 80px; border-radius: 16px;
            background: ${accentColor}; color: white; font-size: 36px;
            font-weight: bold; line-height: 80px; margin: 0 auto 10px;
          }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #64748b; margin: 1px 0; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin: 20px 0; font-size: 13px; }
          .details .label { color: #64748b; }
          .details .value { font-weight: 600; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; }
          th { background: ${accentColor}22; font-weight: 600; }
          td.date { text-align: left; font-weight: 500; }
          .present { color: #059669; font-weight: bold; }
          .absent { color: #dc2626; font-weight: bold; }
          .section-title { font-size: 14px; font-weight: bold; color: ${accentColor}; text-transform: uppercase; margin: 25px 0 10px; }
          .footer { text-align: center; margin-top: 25px; font-size: 10px; color: ${accentColor}; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>${uni.name || "University"}</h1>
          ${contactLines}
        </div>

        <hr />

        <div class="details">
          <div><span class="label">School:</span> <span class="value">${faculty.name || "—"}</span></div>
          <div><span class="label">Department:</span> <span class="value">${dept.name || "—"}</span></div>
          <div><span class="label">Programme:</span> <span class="value">${gridData.student.programName}</span></div>
          <div><span class="label">Year of Study:</span> <span class="value">${gridData.student.studyYearName}</span></div>
          <div><span class="label">Semester:</span> <span class="value">${gridData.student.semesterName}</span></div>
          <div><span class="label">Academic Year:</span> <span class="value">${gridData.academicYear || "—"}</span></div>
          <div><span class="label">Student Name:</span> <span class="value">${gridData.student.fullName}</span></div>
          <div><span class="label">Reg No:</span> <span class="value">${gridData.student.regNo}</span></div>
        </div>

        <hr />

        <div class="section-title">Attendance Grid</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              ${unitHeaders}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="section-title">Per Unit Summary</div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Unit</th>
              <th>Present</th>
              <th>Missed</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
            <tr style="font-weight:bold;background:#f1f5f9;">
              <td style="text-align:left;">TOTAL</td>
              <td>${gridData.summary.totalPresent}</td>
              <td>${gridData.summary.totalMissed}</td>
              <td>${gridData.summary.totalPresent + gridData.summary.totalMissed}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">Generated by SUAMP Smart Attendance System</div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups for this site");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const displayed = showAll ? students : students.slice(0, viewLimit);

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <h1 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight">
        Students Report
      </h1>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg md:rounded-2xl p-3 md:p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-2 md:gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Program
            </label>
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setStudyYearId("");
                setSemesterId("");
              }}
              className="bg-slate-50 border border-slate-200 rounded-md md:rounded-lg px-2 md:px-3 py-2 text-[12px] md:text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Programs</option>
              {programs.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {programId && (
            <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
              <label className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold">
                Year
              </label>
              <select
                value={studyYearId}
                onChange={(e) => {
                  setStudyYearId(e.target.value);
                  setSemesterId("");
                }}
                className="bg-slate-50 border border-slate-200 rounded-md md:rounded-lg px-2 md:px-3 py-2 text-[12px] md:text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              >
                <option value="">All Years</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {studyYearId && (
            <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
              <label className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-semibold">
                Semester
              </label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md md:rounded-lg px-2 md:px-3 py-2 text-[12px] md:text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              >
                <option value="">All Semesters</option>
                {semesters.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg md:rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-4 border-b border-slate-100">
          <span className="text-[11px] md:text-sm text-slate-500">
            {displayed.length} of {students.length} students
          </span>
          {students.length > viewLimit && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[11px] md:text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] md:text-xs uppercase">
                <th className="text-left p-2 md:p-3 font-semibold sticky left-0 bg-slate-50 z-10 min-w-[40px]">
                  S/N
                </th>
                <th className="text-left p-2 md:p-3 font-semibold sticky left-[40px] bg-slate-50 z-10 min-w-[140px]">
                  Student Name
                </th>
                <th className="text-left p-2 md:p-3 font-semibold min-w-[120px]">
                  Reg No
                </th>
                {units.map((u: any) => (
                  <th
                    key={u.id}
                    title={u.name}
                    className="text-center p-2 md:p-3 font-semibold min-w-[80px] whitespace-nowrap cursor-help"
                  >
                    {truncate(u.name)}
                  </th>
                ))}
                <th className="text-center p-2 md:p-3 font-semibold sticky right-[70px] bg-slate-50 z-10 min-w-[80px]">
                  Overall
                </th>
                <th className="text-center p-2 md:p-3 font-semibold sticky right-0 bg-slate-50 z-10 min-w-[70px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={units.length + 5}
                    className="p-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={units.length + 5}
                    className="p-8 text-center text-slate-400"
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                displayed.map((s: any, idx: number) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                  >
                    <td className="p-2 md:p-3 text-slate-400 font-mono text-[10px] md:text-xs sticky left-0 bg-white z-10">
                      {idx + 1}
                    </td>
                    <td className="p-2 md:p-3 text-slate-800 font-medium sticky left-[40px] bg-white z-10 whitespace-nowrap">
                      {s.fullName}
                    </td>
                    <td className="p-2 md:p-3 text-slate-600 font-mono text-[10px] md:text-xs whitespace-nowrap">
                      {s.regNo}
                    </td>
                    {units.map((u: any) => {
                      const val = s.attendance[u.id];
                      if (val === -1 || val === undefined) {
                        return (
                          <td
                            key={u.id}
                            className="p-2 md:p-3 text-center text-slate-300"
                          >
                            —
                          </td>
                        );
                      }
                      return (
                        <td
                          key={u.id}
                          className={`p-2 md:p-3 text-center font-semibold ${pctColour(val)}`}
                        >
                          {val}%
                        </td>
                      );
                    })}
                    <td
                      className={`p-2 md:p-3 text-center font-bold sticky right-[70px] bg-white z-10 ${pctColour(s.overall)}`}
                    >
                      {s.overall}%
                    </td>
                    <td className="p-2 md:p-3 text-center sticky right-0 bg-white z-10">
                      <button
                        onClick={() => openGrid(s.id)}
                        className="text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Modal */}
      {gridOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl p-3 md:p-6">
            {gridLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
              </div>
            ) : gridData ? (
              <div
                className="rounded-lg p-3 md:p-5 border-2"
                style={{ borderColor: accentColor }}
              >
                {/* Close */}
                <div className="flex justify-end mb-1">
                  <button
                    onClick={closeGrid}
                    className="text-slate-400 hover:text-slate-700 text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Institution Header */}
                <div className="text-center mb-4">
                  {gridData.university?.logo ? (
                    <img
                      src={gridData.university.logo}
                      alt=""
                      className="h-20 md:h-32 w-auto mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-2xl md:text-4xl font-bold text-white mx-auto mb-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      {(gridData.university?.name || "U").charAt(0)}
                    </div>
                  )}
                  <h3 className="text-base md:text-2xl font-bold text-slate-800">
                    {gridData.university?.name || "University"}
                  </h3>
                  {gridData.university?.address && (
                    <p className="text-[10px] md:text-sm text-slate-500">
                      {gridData.university.address}
                    </p>
                  )}
                  {gridData.university?.phone && (
                    <p className="text-[10px] md:text-sm text-slate-500">
                      {gridData.university.phone}
                    </p>
                  )}
                  {gridData.university?.email && (
                    <p className="text-[10px] md:text-sm text-slate-500">
                      {gridData.university.email}
                    </p>
                  )}
                  {gridData.university?.website && (
                    <p className="text-[10px] md:text-sm text-slate-500">
                      {gridData.university.website}
                    </p>
                  )}
                </div>

                <hr className="border-slate-200 my-3" />

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:text-sm mb-4">
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      School:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {gridData.faculty?.name || "—"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Department:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {gridData.department?.name || "—"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Programme:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {gridData.student.programName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Year:
                    </span>
                    <span className="text-slate-800 font-medium">
                      {gridData.student.studyYearName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Semester:
                    </span>
                    <span className="text-slate-800 font-medium">
                      {gridData.student.semesterName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Academic Year:
                    </span>
                    <span className="text-slate-800 font-medium">
                      {gridData.academicYear || "—"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Student:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {gridData.student.fullName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24 md:w-32 shrink-0">
                      Reg No:
                    </span>
                    <span className="text-slate-800 font-medium">
                      {gridData.student.regNo}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-200 my-3" />

                {/* Grid Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="text-[10px] md:text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-slate-300 p-1 md:p-2 bg-slate-50 text-slate-600 font-semibold sticky left-0 bg-slate-50 z-10">
                          Date
                        </th>
                        {gridData.units.map((u: any) => (
                          <th
                            key={u.id}
                            title={u.name}
                            className="border border-slate-300 p-1 md:p-2 bg-slate-50 text-slate-600 font-semibold whitespace-nowrap"
                            style={{
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                            }}
                          >
                            {u.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gridData.dates.map((d: string) => (
                        <tr key={d}>
                          <td className="border border-slate-300 p-1 md:p-2 text-slate-700 whitespace-nowrap sticky left-0 bg-white z-10">
                            {d}
                          </td>
                          {gridData.units.map((u: any) => {
                            const st = gridData.grid[d]?.[u.id];
                            return (
                              <td
                                key={u.id}
                                className="border border-slate-300 p-1 md:p-2 text-center font-bold"
                              >
                                {st === "PRESENT" ? (
                                  <span className="text-emerald-600">✓</span>
                                ) : st === "ABSENT" ? (
                                  <span className="text-rose-600">✗</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {gridData.dates.length === 0 && (
                        <tr>
                          <td
                            colSpan={gridData.units.length + 1}
                            className="p-4 text-center text-slate-400"
                          >
                            No sessions held yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mb-4">
                  <h4
                    className="text-[10px] md:text-sm font-semibold uppercase tracking-wide mb-2"
                    style={{ color: accentColor }}
                  >
                    Per Unit Summary
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] md:text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 uppercase">
                          <th className="border border-slate-300 text-left p-1 md:p-2">
                            Unit
                          </th>
                          <th className="border border-slate-300 p-1 md:p-2">
                            Present
                          </th>
                          <th className="border border-slate-300 p-1 md:p-2">
                            Missed
                          </th>
                          <th className="border border-slate-300 p-1 md:p-2">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridData.summary.perUnit.map((u: any) => (
                          <tr key={u.unitId}>
                            <td className="border border-slate-300 p-1 md:p-2 text-slate-700">
                              {u.unitCode} — {u.unitName}
                            </td>
                            <td className="border border-slate-300 p-1 md:p-2 text-center text-emerald-600 font-semibold">
                              {u.present}
                            </td>
                            <td className="border border-slate-300 p-1 md:p-2 text-center text-rose-600 font-semibold">
                              {u.missed}
                            </td>
                            <td className="border border-slate-300 p-1 md:p-2 text-center font-semibold">
                              {u.total}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                          <td className="border border-slate-300 p-1 md:p-2 text-slate-700">
                            TOTAL
                          </td>
                          <td className="border border-slate-300 p-1 md:p-2 text-center text-emerald-600">
                            {gridData.summary.totalPresent}
                          </td>
                          <td className="border border-slate-300 p-1 md:p-2 text-center text-rose-600">
                            {gridData.summary.totalMissed}
                          </td>
                          <td className="border border-slate-300 p-1 md:p-2 text-center">
                            {gridData.summary.totalPresent +
                              gridData.summary.totalMissed}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={closeGrid}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-[11px] md:text-sm font-medium hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[11px] md:text-sm font-medium hover:bg-emerald-500 transition"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
