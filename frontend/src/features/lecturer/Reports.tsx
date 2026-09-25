import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Reports = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    unitId: "",
    format: "pdf" as "pdf" | "excel",
  });
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#10b981");
  const [showAll, setShowAll] = useState(false);
  const [viewLimit] = useState(10);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  const generateReportHTML = (session: any, summary: any) => {
    const records = session.records || [];
    const year = session.unit?.studyYear?.name || "";
    const semester = session.unit?.semester?.name || "";
    const yearNum = year.match(/\d+/)?.[0] || "?";
    const semNum = semester.match(/\d+/)?.[0] || "?";
    const accentColor = "#10b981";

    const rows = records
      .map(
        (r: any, i: number) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i + 1}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${r.student?.regNo || "N/A"}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${r.student?.fullName || "Unknown"}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${r.status === "PRESENT" ? "#059669" : "#dc2626"};">${r.status}</td>
    </tr>
  `,
      )
      .join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px; 
          max-width: 900px; 
          margin: 0 auto; 
          background: #fff;
        }
        .outer-wrap {
          border: 2px solid ${accentColor};
          border-radius: 12px;
          padding: 30px 40px 20px;
        }
        .live-preview { 
          text-align: center; 
          font-size: 10px; 
          color: #94a3b8; 
          text-transform: uppercase; 
          letter-spacing: 1.5px;
          margin-bottom: 15px;
        }
        .header { text-align: center; margin-bottom: 25px; }
        .header .logo {
          display: inline-block;
          width: 60px;
          height: 60px;
          background: ${accentColor};
          border-radius: 12px;
          color: #fff;
          font-size: 26px;
          font-weight: bold;
          line-height: 60px;
          text-align: center;
          margin-bottom: 8px;
        }
        .header h1 { font-size: 22px; margin: 0; color: #1e293b; }
        .header p { margin: 2px 0; color: #64748b; font-size: 13px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .section-title { 
          font-size: 13px; 
          font-weight: bold; 
          color: ${accentColor}; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          margin: 16px 0 10px;
          text-align: center;
        }
        .details { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 3px 30px; 
          margin: 8px auto 12px;
          max-width: 700px;
        }
        .details .row { display: flex; }
        .details .label { color: #64748b; width: 120px; flex-shrink: 0; font-size: 13px; }
        .details .value { font-weight: 500; color: #1e293b; font-size: 13px; }
        .stats { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 0; 
          margin: 10px auto; 
          max-width: 700px;
          border: 1px solid ${accentColor};
          border-radius: 8px;
          overflow: hidden;
        }
        .stat-box { 
          text-align: center; 
          padding: 10px 8px; 
          border-right: 1px solid ${accentColor};
          background: #f8fafc;
        }
        .stat-box:last-child { border-right: none; }
        .stat-box .stat-label { 
          font-size: 10px; 
          color: #64748b; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .stat-box .stat-number { 
          font-size: 20px; 
          font-weight: bold; 
          color: ${accentColor};
          margin-top: 2px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 8px 0 12px;
          border: 1px solid ${accentColor};
          border-radius: 8px;
          overflow: hidden;
        }
        th { 
          text-align: left; 
          padding: 8px 12px; 
          background: #f0fdf4;
          border-bottom: 1px solid ${accentColor};
          color: #1e293b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td { 
          padding: 7px 12px; 
          border-bottom: 1px solid #e2e8f0; 
          font-size: 13px;
          color: #1e293b;
        }
        tr:last-child td { border-bottom: none; }
        .signatures { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 50px; 
          margin-top: 20px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        .signatures .sig-label { font-weight: 600; color: #1e293b; font-size: 13px; }
        .signatures .line { border-bottom: 1px solid #cbd5e1; height: 28px; margin-top: 4px; }
        .signatures .date-label { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: ${accentColor};
          letter-spacing: 0.5px;
        }
        .center-text { text-align: center; }
        @media print {
          body { padding: 20px; }
          .outer-wrap { border-color: ${accentColor} !important; }
        }
      </style>
    </head>
    <body>
      <div class="outer-wrap">

       <div class="header">
  <div class="logo">${session.lecturer?.university?.name?.charAt(0) || "U"}</div>
  <h1>${session.lecturer?.university?.name || "University"}</h1>
  ${
    session.lecturer?.university?.address
      ? `<p>${session.lecturer.university.address}</p>`
      : ""
  }
  ${
    session.lecturer?.university?.phone
      ? `<p>${session.lecturer.university.phone}</p>`
      : ""
  }
  ${
    session.lecturer?.university?.email
      ? `<p>${session.lecturer.university.email}</p>`
      : ""
  }
  ${
    session.lecturer?.university?.website
      ? `<p>${session.lecturer.university.website}</p>`
      : ""
  }
</div>

        <hr />

        <div class="section-title">ACADEMIC SESSION DETAILS</div>
        <div class="details">
          <div class="row"><span class="label">School:</span><span class="value">${session.lecturer?.department?.faculty?.name || "N/A"}</span></div>
          <div class="row"><span class="label">Stage / Campus:</span><span class="value">Y${yearNum}S${semNum} / MAIN</span></div>
          <div class="row"><span class="label">Department:</span><span class="value">${session.lecturer?.department?.name || "N/A"}</span></div>
          <div class="row"><span class="label">Date / Week:</span><span class="value">${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} / Week: ${Math.ceil((new Date(session.createdAt).getDate() - 1) / 7 + 1) || 1}</span></div>
          <div class="row"><span class="label">Programme:</span><span class="value">${session.unit?.program?.name || "N/A"}</span></div>
          <div class="row"><span class="label">Lecturer:</span><span class="value">${session.lecturer?.fullName || "N/A"}</span></div>
          <div class="row" style="grid-column: span 2;"><span class="label">Unit:</span><span class="value">${session.unit?.code} - ${session.unit?.name}</span></div>
        </div>

        <hr />

        <div class="section-title">STATS</div>
        <div class="stats">
          <div class="stat-box">
            <div class="stat-label">PRESENT</div>
            <div class="stat-number">${summary.present}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">TOTAL ENROLLED</div>
            <div class="stat-number">${summary.total}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">ATTENDANCE RATE</div>
            <div class="stat-number">${summary.rate}%</div>
          </div>
        </div>

        <hr />

        <div class="section-title">ATTENDANCE RECORD</div>
        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 50px;">#</th>
              <th>Registration No.</th>
              <th>Student Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            ${
              records.length === 0
                ? `
              <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">
                  No attendance records for this session
                </td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>

        <hr />

        <div class="signatures">
          <div>
            <div class="sig-label">HOD Signature:</div>
            <div class="line"></div>
            <div class="date-label">Date: ___________</div>
          </div>
          <div>
            <div class="sig-label">LEC Signature:</div>
            <div class="line"></div>
            <div class="date-label">Date: ___________</div>
          </div>
        </div>

        <hr />

        <div class="footer">Generated by SUAMP Smart Attendance System</div>
      </div>
    </body>
    </html>
  `;
  };

  useEffect(() => {
    api.get("/lecturer/units").then((r) => setUnits(r.data.data));
    fetchHistory();

    api
      .get("/university-admin/settings/report")
      .then((r) => {
        if (r.data.data?.accentColor) {
          setAccentColor(r.data.data.accentColor);
        }
      })
      .catch(() => {});
  }, []);

  const fetchHistory = async () => {
    const params = new URLSearchParams();
    if (filters.unitId) params.append("unitId", filters.unitId);
    const res = await api.get(`/lecturer/history?${params}`);
    setHistory(res.data.data || []);
  };

  const generateReport = async () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Report generated");
    }, 1500);
  };

  const viewReport = (report: any) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const download = async (sessionId: string, format: "pdf" | "excel") => {
    try {
      const res = await api.get(
        `/lecturer/reports/export/${sessionId}?format=${format}`,
      );
      const data = res.data.data;
      const session = data.session;
      const summary = data.summary;

      if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Please allow popups for this site");
          return;
        }

        const html = generateReportHTML(session, summary);
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        toast.success("PDF download started");
      } else {
        const year = session.unit?.studyYear?.name || "";
        const semester = session.unit?.semester?.name || "";
        const yearNum = year.match(/\d+/)?.[0] || "?";
        const semNum = semester.match(/\d+/)?.[0] || "?";

        let csv = "";

        csv += `"${session.lecturer?.university?.name || "University"}"\n`;
        if (session.lecturer?.university?.address)
          csv += `"${session.lecturer.university.address}"\n`;
        if (session.lecturer?.university?.phone)
          csv += `"${session.lecturer.university.phone}"\n`;
        if (session.lecturer?.university?.email)
          csv += `"${session.lecturer.university.email}"\n`;
        if (session.lecturer?.university?.website)
          csv += `"${session.lecturer.university.website}"\n`;
        csv += `\n`;

        csv += `"ACADEMIC SESSION DETAILS"\n`;
        csv += `"School:","${session.lecturer?.department?.faculty?.name || "N/A"}"\n`;
        csv += `"Stage / Campus:","Y${yearNum}S${semNum} / MAIN"\n`;
        csv += `"Department:","${session.lecturer?.department?.name || "N/A"}"\n`;
        csv += `"Date / Week:","${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} / Week: ${Math.ceil((new Date(session.createdAt).getDate() - 1) / 7 + 1) || 1}"\n`;
        csv += `"Programme:","${session.unit?.program?.name || "N/A"}"\n`;
        csv += `"Lecturer:","${session.lecturer?.fullName || "N/A"}"\n`;
        csv += `"Unit:","${session.unit?.code} - ${session.unit?.name}"\n`;
        csv += `\n`;

        csv += `"STATS"\n`;
        csv += `"PRESENT","TOTAL ENROLLED","ATTENDANCE RATE"\n`;
        csv += `"${summary.present}","${summary.total}","${summary.rate}%"\n`;
        csv += `\n`;

        csv += `"ATTENDANCE RECORD"\n`;
        csv += `"#","Registration No.","Student Name","Status"\n`;

        const records = session.records || [];
        records.forEach((r: any, i: number) => {
          csv += `"${i + 1}","${r.student?.regNo || "N/A"}","${r.student?.fullName || "Unknown"}","${r.status}"\n`;
        });
        csv += `\n`;

        csv += `"HOD Signature:","","LEC Signature:",""\n`;
        csv += `"__________________","","__________________",""\n`;
        csv += `"Date: ___________","","Date: ___________",""\n`;
        csv += `\n`;

        csv += `"Generated by SUAMP Smart Attendance System"\n`;

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance-report-${session.unit?.code || "session"}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Excel download started");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Download failed");
    }
  };

  const displayedHistory = showAll ? history : history.slice(0, viewLimit);

  const stats = {
    totalSessions: history.length,
    totalPresent: history.reduce(
      (sum, h) =>
        sum +
        (h.records?.filter((r: any) => r.status === "PRESENT").length || 0),
      0,
    ),
    totalStudents: history.reduce((sum, h) => sum + (h.totalStudents || 0), 0),
    avgRate:
      history.length > 0
        ? Math.round(
            history.reduce((sum, h) => {
              const p =
                h.records?.filter((r: any) => r.status === "PRESENT").length ||
                0;
              const t = h.totalStudents || 0;
              return sum + (t > 0 ? (p / t) * 100 : 0);
            }, 0) / history.length,
          )
        : 0,
  };

  const getColorWithOpacity = (opacity: number) => {
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getLighterColor = () => {
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lightR = Math.min(255, r + 50);
    const lightG = Math.min(255, g + 50);
    const lightB = Math.min(255, b + 50);
    return `rgb(${lightR}, ${lightG}, ${lightB})`;
  };

  return (
    <div className="space-y-2 md:space-y-6 max-w-6xl mx-auto">
      <h1 className="text-base md:text-2xl font-bold text-black tracking-tight">
        Attendance Reports
      </h1>

      {/* Stats Overview — 4 in one row on mobile */}
      <div className="grid grid-cols-4 gap-1 md:gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Sessions
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-white leading-tight">
            {stats.totalSessions}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Check-ins
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-emerald-400 leading-tight">
            {stats.totalPresent}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Students
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-blue-400 leading-tight">
            {stats.totalStudents}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-md md:rounded-2xl p-1 md:p-5 text-center">
          <p className="text-[8px] md:text-xs text-slate-400 uppercase leading-tight">
            Avg Rate
          </p>
          <p className="text-[11px] md:text-2xl font-bold text-violet-400 leading-tight">
            {stats.avgRate}%
          </p>
        </div>
      </div>

      {/* Generator */}
      {/* Generator */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
        <h3 className="text-xs md:text-base font-semibold text-white mb-2 md:mb-4">
          Generate Report
        </h3>
        <div className="flex flex-wrap items-end gap-1.5 md:gap-3">
          {/* Unit — custom dropdown */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-[120px]">
            <label className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium">
              Unit
            </label>
            <button
              type="button"
              onClick={() => setUnitDropdownOpen(true)}
              className="bg-slate-800 border border-slate-600 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white text-left focus:border-emerald-400 focus:outline-none w-full md:w-48 flex items-center justify-between gap-1"
            >
              <span className="truncate">
                {filters.unitId
                  ? units.find((u: any) => u.id === filters.unitId)?.code ||
                    "Selected"
                  : "All Units"}
              </span>
              <span className="text-slate-400 shrink-0">▾</span>
            </button>
          </div>

          {/* Format — custom dropdown */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wide md:tracking-wider font-medium">
              Format
            </label>
            <button
              type="button"
              onClick={() => setFormatDropdownOpen(true)}
              className="bg-slate-800 border border-slate-600 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white text-left focus:border-emerald-400 focus:outline-none w-20 md:w-32 flex items-center justify-between gap-1"
            >
              <span>{filters.format === "pdf" ? "PDF" : "Excel"}</span>
              <span className="text-slate-400 shrink-0">▾</span>
            </button>
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="px-3 md:px-6 py-1.5 md:py-2.5 bg-emerald-600 text-white rounded-md md:rounded-lg text-[11px] md:text-sm font-medium hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Unit dropdown — custom modal */}
      {unitDropdownOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 md:p-4"
          onClick={() => setUnitDropdownOpen(false)}
        >
          <div
            className="bg-slate-800 border border-slate-600 rounded-xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 md:px-4 md:py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
              <p className="text-[11px] md:text-sm text-emerald-400 uppercase tracking-wide font-semibold">
                Choose Unit
              </p>
              <button
                type="button"
                onClick={() => setUnitDropdownOpen(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...filters, unitId: "" });
                  setUnitDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 md:px-4 md:py-2.5 border-b border-slate-700/60 hover:bg-slate-700/50 transition text-[11px] md:text-sm ${
                  !filters.unitId
                    ? "bg-emerald-900/30 text-emerald-400"
                    : "text-white"
                }`}
              >
                All Units
              </button>
              {units.map((u: any) => {
                const isSelected = u.id === filters.unitId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, unitId: u.id });
                      setUnitDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 md:px-4 md:py-2.5 border-b border-slate-700/60 hover:bg-slate-700/50 transition flex items-start gap-2 ${
                      isSelected ? "bg-emerald-900/30" : ""
                    }`}
                  >
                    <span
                      className={`text-[11px] md:text-sm font-bold shrink-0 ${
                        isSelected ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {u.code}
                    </span>
                    <span className="text-[10px] md:text-xs text-slate-300 truncate">
                      {u.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Format dropdown — custom modal */}
      {formatDropdownOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 md:p-4"
          onClick={() => setFormatDropdownOpen(false)}
        >
          <div
            className="bg-slate-800 border border-slate-600 rounded-xl md:rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 md:px-4 md:py-3 border-b border-slate-700 flex items-center justify-between">
              <p className="text-[11px] md:text-sm text-emerald-400 uppercase tracking-wide font-semibold">
                Choose Format
              </p>
              <button
                type="button"
                onClick={() => setFormatDropdownOpen(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>
            {[
              { value: "pdf", label: "PDF" },
              { value: "excel", label: "Excel" },
            ].map((opt) => {
              const isSelected = filters.format === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFilters({
                      ...filters,
                      format: opt.value as "pdf" | "excel",
                    });
                    setFormatDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 md:px-4 md:py-3 border-b border-slate-700/60 hover:bg-slate-700/50 transition text-[12px] md:text-sm ${
                    isSelected
                      ? "bg-emerald-900/30 text-emerald-400 font-semibold"
                      : "text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* View Report Modal */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-2xl w-full max-w-4xl max-h-[92vh] md:max-h-[90vh] overflow-y-auto shadow-2xl p-3 md:p-8">
            <div
              className="rounded-lg md:rounded-xl p-3 md:p-8 border-2"
              style={{ borderColor: accentColor }}
            >
              {/* Close Button */}
              <div className="flex justify-end mb-1 md:mb-2">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-xl md:text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Institution Header */}
              <div className="text-center mb-3 md:mb-6">
                <div className="flex justify-center mb-1.5 md:mb-3">
                  <div
                    className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center text-sm md:text-2xl font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {selectedReport.lecturer?.university?.name?.charAt(0) ||
                      "U"}
                  </div>
                </div>
                <h3 className="text-sm md:text-2xl font-bold text-slate-800">
                  {selectedReport.lecturer?.university?.name || "University"}
                </h3>
                {selectedReport.lecturer?.university?.address && (
                  <p className="text-[10px] md:text-sm text-slate-500 break-words">
                    {selectedReport.lecturer.university.address}
                  </p>
                )}
                {selectedReport.lecturer?.university?.phone && (
                  <p className="text-[10px] md:text-sm text-slate-500">
                    {selectedReport.lecturer.university.phone}
                  </p>
                )}
                {selectedReport.lecturer?.university?.email && (
                  <p className="text-[10px] md:text-sm text-slate-500 break-words">
                    {selectedReport.lecturer.university.email}
                  </p>
                )}
                {selectedReport.lecturer?.university?.website && (
                  <p className="text-[10px] md:text-sm text-slate-500 break-words">
                    {selectedReport.lecturer.university.website}
                  </p>
                )}
              </div>

              <hr className="border-slate-200 my-2 md:my-4" />

              {/* Academic details */}
              <div className="mb-3 md:mb-6">
                <h4
                  className="text-[10px] md:text-sm font-semibold mb-1.5 md:mb-3 uppercase tracking-wide text-center"
                  style={{ color: accentColor }}
                >
                  ACADEMIC SESSION DETAILS
                </h4>
                <div className="grid grid-cols-2 gap-x-2 md:gap-x-8 gap-y-0.5 md:gap-y-1.5 text-[10px] md:text-sm max-w-2xl mx-auto text-left">
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      School:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {selectedReport.lecturer?.department?.faculty?.name ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Stage:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {(() => {
                        const year = selectedReport.unit?.studyYear?.name || "";
                        const semester =
                          selectedReport.unit?.semester?.name || "";
                        const yearNum = year.match(/\d+/)?.[0] || "?";
                        const semNum = semester.match(/\d+/)?.[0] || "?";
                        return `Y${yearNum}S${semNum} / MAIN`;
                      })()}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Dept:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {selectedReport.lecturer?.department?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Date:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {new Date(selectedReport.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
                      / W{" "}
                      {Math.ceil(
                        (new Date(selectedReport.createdAt).getDate() - 1) / 7 +
                          1,
                      ) || 1}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Prog:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {selectedReport.unit?.program?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Lect:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {selectedReport.lecturer?.fullName || "N/A"}
                    </span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="text-slate-500 w-16 md:w-32 shrink-0">
                      Unit:
                    </span>
                    <span className="text-slate-800 font-medium truncate">
                      {selectedReport.unit?.code} - {selectedReport.unit?.name}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 my-2 md:my-4" />

              {/* Stats */}
              {(() => {
                const total = selectedReport.totalStudents || 0;
                const present =
                  selectedReport.records?.filter(
                    (r: any) => r.status === "PRESENT",
                  ).length || 0;
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <div className="mb-3 md:mb-6">
                    <h4
                      className="text-[10px] md:text-sm font-semibold mb-1.5 md:mb-3 uppercase tracking-wide text-center"
                      style={{ color: accentColor }}
                    >
                      STATS
                    </h4>
                    <div
                      className="grid grid-cols-3 gap-0 border rounded-md md:rounded-lg overflow-hidden"
                      style={{ borderColor: accentColor }}
                    >
                      <div
                        className="p-1.5 md:p-3 text-center border-r"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <p
                          className="text-[8px] md:text-xs uppercase font-medium leading-tight"
                          style={{ color: accentColor }}
                        >
                          PRESENT
                        </p>
                        <p className="text-[13px] md:text-lg font-bold text-slate-800 leading-tight">
                          {present}
                        </p>
                      </div>
                      <div
                        className="p-1.5 md:p-3 text-center border-r"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <p className="text-[8px] md:text-xs text-slate-500 uppercase font-medium leading-tight">
                          ENROLLED
                        </p>
                        <p className="text-[13px] md:text-lg font-bold text-slate-800 leading-tight">
                          {total}
                        </p>
                      </div>
                      <div
                        className="p-1.5 md:p-3 text-center"
                        style={{ backgroundColor: getColorWithOpacity(0.05) }}
                      >
                        <p className="text-[8px] md:text-xs text-slate-500 uppercase font-medium leading-tight">
                          RATE
                        </p>
                        <p
                          className="text-[13px] md:text-lg font-bold leading-tight"
                          style={{ color: accentColor }}
                        >
                          {rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <hr className="border-slate-200 my-2 md:my-4" />

              {/* Attendance Record */}
              <div className="mb-3 md:mb-6">
                <h4
                  className="text-[10px] md:text-sm font-semibold mb-1.5 md:mb-3 uppercase tracking-wide text-center"
                  style={{ color: accentColor }}
                >
                  ATTENDANCE RECORD
                </h4>
                <div
                  className="border rounded-md md:rounded-lg overflow-x-auto"
                  style={{ borderColor: accentColor }}
                >
                  <table className="w-full text-[10px] md:text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{
                          backgroundColor: getColorWithOpacity(0.05),
                          borderColor: accentColor,
                        }}
                      >
                        <th className="text-left p-1.5 md:p-3 font-medium text-slate-600 w-8 md:w-12">
                          #
                        </th>
                        <th className="text-left p-1.5 md:p-3 font-medium text-slate-600 whitespace-nowrap">
                          Reg No.
                        </th>
                        <th className="text-left p-1.5 md:p-3 font-medium text-slate-600 whitespace-nowrap">
                          Name
                        </th>
                        <th className="text-left p-1.5 md:p-3 font-medium text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.records?.map((r: any, idx: number) => (
                        <tr
                          key={r.id}
                          className="border-b hover:bg-slate-50 transition"
                          style={{ borderColor: `${accentColor}30` }}
                        >
                          <td className="p-1.5 md:p-3 text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-1.5 md:p-3 text-slate-700 font-mono text-[9px] md:text-xs whitespace-nowrap">
                            {r.student?.regNo || "N/A"}
                          </td>
                          <td className="p-1.5 md:p-3 text-slate-700 whitespace-nowrap">
                            {r.student?.fullName || "Unknown"}
                          </td>
                          <td className="p-1.5 md:p-3">
                            <span
                              className={`text-[9px] md:text-xs font-bold ${
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
                      {(!selectedReport.records ||
                        selectedReport.records.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 md:p-6 text-center text-slate-400 text-[10px] md:text-sm"
                          >
                            No attendance records for this session
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="border-slate-200 my-2 md:my-4" />

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 md:gap-8 mt-4 md:mt-8">
                <div>
                  <p className="text-[10px] md:text-sm text-slate-700 font-medium">
                    HOD Signature:
                  </p>
                  <div className="h-5 md:h-8 border-b border-slate-300 mt-1 md:mt-2"></div>
                  <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                    Date: ___________
                  </p>
                </div>
                <div>
                  <p className="text-[10px] md:text-sm text-slate-700 font-medium">
                    LEC. Signature:
                  </p>
                  <div className="h-5 md:h-8 border-b border-slate-300 mt-1 md:mt-2"></div>
                  <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                    Date: ___________
                  </p>
                </div>
              </div>

              <hr className="border-slate-200 my-2 md:my-4" />

              <div className="text-center">
                <p
                  className="text-[9px] md:text-xs"
                  style={{ color: accentColor }}
                >
                  Generated by SUAMP Smart Attendance System
                </p>
              </div>

              <div className="mt-3 md:mt-6 flex justify-end">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-3 md:px-6 py-1.5 md:py-2.5 bg-slate-200 text-slate-700 rounded-md md:rounded-lg text-[11px] md:text-sm font-medium hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report List */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-2.5 py-1.5 md:p-5 border-b border-slate-600">
          <h3 className="text-[11px] md:text-base font-semibold text-white">
            Generated Reports
          </h3>
          <div className="flex items-center gap-2 md:gap-4">
            {history.length > viewLimit && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[11px] md:text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
              >
                {showAll ? "Less" : "More"}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] md:text-sm">
            <thead>
              <tr className="border-b border-slate-600 text-slate-400 text-[10px] md:text-xs uppercase bg-slate-800/50">
                <th className="text-left px-2 py-1 md:p-3 font-medium">#</th>
                <th className="text-left px-2 py-1 md:p-3 font-medium whitespace-nowrap">
                  Report
                </th>
                <th className="text-left px-2 py-1 md:p-3 font-medium whitespace-nowrap">
                  P/T
                </th>
                <th className="text-left px-2 py-1 md:p-3 font-medium">Rate</th>
                <th className="text-left px-2 py-1 md:p-3 font-medium">
                  Download
                </th>
                <th className="text-left px-2 py-1 md:p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((h: any, index: number) => {
                const present =
                  h.records?.filter((r: any) => r.status === "PRESENT")
                    .length || 0;
                const total = h.totalStudents || 0;
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr
                    key={h.id}
                    className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                  >
                    <td className="px-2 py-1 md:p-3 text-slate-400 text-[10px] md:text-xs font-mono">
                      {index + 1}
                    </td>
                    <td className="px-2 py-1 md:p-3">
                      <p className="text-[11px] md:text-sm font-medium text-white truncate max-w-[120px] md:max-w-none">
                        📄 {h.unit?.name}
                      </p>
                      <p className="text-[9px] md:text-xs text-slate-500">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-2 py-1 md:p-3 text-slate-300 whitespace-nowrap">
                      {present}/{total}
                    </td>
                    <td className="px-2 py-1 md:p-3 text-[11px] md:text-sm font-bold text-emerald-400 whitespace-nowrap">
                      {rate}%
                    </td>
                    <td className="px-2 py-1 md:p-3">
                      <div className="flex gap-1 md:gap-1.5">
                        <button
                          onClick={() => download(h.id, "pdf")}
                          className="text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1.5 rounded bg-rose-900/20 text-rose-400 border border-rose-800 hover:bg-rose-900/40 transition whitespace-nowrap"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => download(h.id, "excel")}
                          className="text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1.5 rounded bg-emerald-900/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/40 transition whitespace-nowrap"
                        >
                          Excel
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1 md:p-3">
                      <button
                        onClick={() => viewReport(h)}
                        className="text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800 hover:bg-blue-900/40 transition whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 md:p-12 text-center text-slate-500 text-[11px] md:text-sm"
                  >
                    No reports available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
