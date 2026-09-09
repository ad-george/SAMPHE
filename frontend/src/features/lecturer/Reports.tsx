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
        <div class="live-preview">LIVE PREVIEW</div>

        <div class="header">
          <div class="logo">${session.lecturer?.university?.name?.charAt(0) || "U"}</div>
          <h1>${session.lecturer?.university?.name || "Maseno University"}</h1>
          <p>${session.lecturer?.university?.address || "College"}</p>
          <p>${session.lecturer?.university?.phone || ""} • ${session.lecturer?.university?.email || ""}</p>
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

    // ✅ Fetch accent color from settings
    api
      .get("/university-admin/settings/report")
      .then((r) => {
        if (r.data.data?.accentColor) {
          setAccentColor(r.data.data.accentColor);
        }
      })
      .catch(() => {
        // Use default if fails
      });
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

  const shareReport = (report: any) => {
    const total = report.records?.length || 0;
    const present =
      report.records?.filter((r: any) => r.status === "PRESENT").length || 0;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const message =
      `📊 *Attendance Report*\n\n` +
      `Unit: ${report.unit?.name} (${report.unit?.code})\n` +
      `Date: ${new Date(report.createdAt).toLocaleDateString()}\n` +
      `Present: ${present}/${total}\n` +
      `Rate: ${rate}%\n` +
      `\nGenerated by SUAMP Smart Attendance System`;

    navigator.clipboard.writeText(message);
    toast.success(
      "Report copied to clipboard. Share via WhatsApp, Email, etc.",
    );
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
        // Excel - Full report with all details
        const year = session.unit?.studyYear?.name || "";
        const semester = session.unit?.semester?.name || "";
        const yearNum = year.match(/\d+/)?.[0] || "?";
        const semNum = semester.match(/\d+/)?.[0] || "?";

        let csv = "";

        // Header
        csv += `"${session.lecturer?.university?.name || "University"}"\n`;
        csv += `"${session.lecturer?.university?.address || ""}"\n`;
        csv += `"${session.lecturer?.university?.phone || ""} • ${session.lecturer?.university?.email || ""}"\n`;
        csv += `\n`;

        // Academic Session Details
        csv += `"ACADEMIC SESSION DETAILS"\n`;
        csv += `"School:","${session.lecturer?.department?.faculty?.name || "N/A"}"\n`;
        csv += `"Stage / Campus:","Y${yearNum}S${semNum} / MAIN"\n`;
        csv += `"Department:","${session.lecturer?.department?.name || "N/A"}"\n`;
        csv += `"Date / Week:","${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} / Week: ${Math.ceil((new Date(session.createdAt).getDate() - 1) / 7 + 1) || 1}"\n`;
        csv += `"Programme:","${session.unit?.program?.name || "N/A"}"\n`;
        csv += `"Lecturer:","${session.lecturer?.fullName || "N/A"}"\n`;
        csv += `"Unit:","${session.unit?.code} - ${session.unit?.name}"\n`;
        csv += `\n`;

        // Stats
        csv += `"STATS"\n`;
        csv += `"PRESENT","TOTAL ENROLLED","ATTENDANCE RATE"\n`;
        csv += `"${summary.present}","${summary.total}","${summary.rate}%"\n`;
        csv += `\n`;

        // Attendance Record
        csv += `"ATTENDANCE RECORD"\n`;
        csv += `"#","Registration No.","Student Name","Status"\n`;

        const records = session.records || [];
        records.forEach((r: any, i: number) => {
          csv += `"${i + 1}","${r.student?.regNo || "N/A"}","${r.student?.fullName || "Unknown"}","${r.status}"\n`;
        });
        csv += `\n`;

        // Signatures
        csv += `"HOD Signature:","","LEC Signature:",""\n`;
        csv += `"__________________","","__________________",""\n`;
        csv += `"Date: ___________","","Date: ___________",""\n`;
        csv += `\n`;

        // Footer
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

  const shareAll = () => {
    toast.success("All reports shared to HOD");
  };

  const stats = {
    totalSessions: history.length,
    totalPresent: history.reduce(
      (sum, h) =>
        sum +
        (h.records?.filter((r: any) => r.status === "PRESENT").length || 0),
      0,
    ),
    totalStudents: history.reduce(
      (sum, h) => sum + (h.records?.length || 0),
      0,
    ),
    avgRate:
      history.length > 0
        ? Math.round(
            history.reduce((sum, h) => {
              const p =
                h.records?.filter((r: any) => r.status === "PRESENT").length ||
                0;
              const t = h.records?.length || 0;
              return sum + (t > 0 ? (p / t) * 100 : 0);
            }, 0) / history.length,
          )
        : 0,
  };

  // Helper to get color with opacity
  const getColorWithOpacity = (opacity: number) => {
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper for lighter color (for backgrounds)
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 tracking-tight">
        Attendance Reports
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 uppercase">Total Sessions</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.totalSessions}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 uppercase">Total Check-ins</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {stats.totalPresent}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 uppercase">Total Students</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {stats.totalStudents}
          </p>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 uppercase">Average Rate</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">
            {stats.avgRate}%
          </p>
        </div>
      </div>

      {/* Generator */}
      <div className="bg-slate-700 border border-slate-600 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-white mb-4">Generate Report</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Unit
            </label>
            <select
              value={filters.unitId}
              onChange={(e) =>
                setFilters({ ...filters, unitId: e.target.value })
              }
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none w-48"
            >
              <option value="">All Units</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Format
            </label>
            <select
              value={filters.format}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  format: e.target.value as "pdf" | "excel",
                })
              }
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none w-32"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* View Report Modal - EXACT MATCH OF SETTINGS PAGE PREVIEW */}
      {/* View Report Modal - EXACT MATCH OF SETTINGS PAGE PREVIEW */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
            {/* ✅ Inner border with accent color - this creates space outside */}
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
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {selectedReport.lecturer?.university?.name?.charAt(0) ||
                      "U"}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {selectedReport.lecturer?.university?.name ||
                    "Maseno University"}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedReport.lecturer?.university?.address || "College"}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedReport.lecturer?.university?.phone ||
                    "+254704700000"}{" "}
                  •{" "}
                  {selectedReport.lecturer?.university?.email ||
                    "info@maseno.ac.ke"}
                </p>
              </div>

              <hr className="border-slate-200 my-4" />

              {/* ACADEMIC SESSION DETAILS - Centered */}
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
                      {selectedReport.lecturer?.department?.faculty?.name ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Stage / Campus:</span>
                    <span className="text-slate-800 font-medium">
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
                    <span className="text-slate-500 w-32">Department:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedReport.lecturer?.department?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Date / Week:</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(selectedReport.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
                      / Week:{" "}
                      {Math.ceil(
                        (new Date(selectedReport.createdAt).getDate() - 1) / 7 +
                          1,
                      ) || 1}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Programme:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedReport.unit?.program?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32">Lecturer:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedReport.lecturer?.fullName || "N/A"}
                    </span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="text-slate-500 w-32">Unit:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedReport.unit?.code} - {selectedReport.unit?.name}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 my-4" />

              {/* STATS - Centered */}
              {/* STATS - Full width like Attendance Record */}
              {(() => {
                const total = selectedReport.records?.length || 0;
                const present =
                  selectedReport.records?.filter(
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

              {/* ATTENDANCE RECORD - Centered */}
              {/* ATTENDANCE RECORD - Left aligned */}
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
                      {selectedReport.records?.map((r: any, idx: number) => (
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
                      {(!selectedReport.records ||
                        selectedReport.records.length === 0) && (
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

              {/* SIGNATURE SECTION - with extra space above (mt-8) */}
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

      {/* Report List */}
      <div className="bg-slate-700 border border-slate-600 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-600 flex items-center justify-between">
          <h3 className="font-semibold text-white">Generated Reports</h3>
          <button
            onClick={shareAll}
            className="text-xs px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
          >
            Share All to HOD
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600 text-slate-400 text-xs uppercase bg-slate-800/50">
              <th className="text-left p-3 font-medium w-2/5">Report</th>
              <th className="text-left p-3 font-medium w-1/6">Sessions</th>
              <th className="text-left p-3 font-medium w-1/6">Rate</th>
              <th className="text-left p-3 font-medium w-1/4">Download</th>
              <th className="text-left p-3 font-medium w-1/6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any) => {
              const present =
                h.records?.filter((r: any) => r.status === "PRESENT").length ||
                0;
              const total = h.records?.length || 0;
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <tr
                  key={h.id}
                  className="border-b border-slate-600 hover:bg-slate-600/30 transition"
                >
                  <td className="p-3">
                    <p className="text-sm font-medium text-white">
                      📄 {h.unit?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-3 text-slate-300">{total} students</td>
                  <td className="p-3 text-sm font-bold text-emerald-400">
                    {rate}%
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => download(h.id, "pdf")}
                        className="text-xs px-2.5 py-1.5 rounded bg-rose-900/20 text-rose-400 border border-rose-800 hover:bg-rose-900/40 transition whitespace-nowrap"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => download(h.id, "excel")}
                        className="text-xs px-2.5 py-1.5 rounded bg-emerald-900/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/40 transition whitespace-nowrap"
                      >
                        Excel
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 transform -translate-x-6">
                      <button
                        onClick={() => viewReport(h)}
                        className="text-xs px-2.5 py-1.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800 hover:bg-blue-900/40 transition whitespace-nowrap"
                      >
                        View
                      </button>
                      <button
                        onClick={() => shareReport(h)}
                        className="text-xs px-2.5 py-1.5 rounded bg-purple-900/20 text-purple-400 border border-purple-800 hover:bg-purple-900/40 transition whitespace-nowrap"
                      >
                        Share
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  No reports available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
