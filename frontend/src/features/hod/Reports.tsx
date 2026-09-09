import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Reports = () => {
  const [type, setType] = useState<"unit" | "student" | "lecturer" | "program">(
    "unit",
  );
  const [period, setPeriod] = useState<
    "month" | "semester" | "academicYear" | "custom"
  >("month");
  const [filters, setFilters] = useState({
    unitId: "",
    studentId: "",
    lecturerId: "",
    programId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [units, setUnits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/hod/units"),
      api.get("/hod/students"),
      api.get("/hod/lecturers"),
      api.get("/hod/programs"),
    ]).then(([u, s, l, p]) => {
      setUnits(u.data.data);
      setStudents(s.data.data);
      setLecturers(l.data.data);
      setPrograms(p.data.data);
    });
  }, []);

  const generate = async (format: "pdf" | "excel") => {
    try {
      toast.loading("Generating report...");
      const params = new URLSearchParams({ type, period, format, ...filters });
      const res = await api.get(`/hod/reports/generate?${params}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${type}_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      toast.dismiss();
      toast.success("Downloaded");
    } catch {
      toast.dismiss();
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
        Reports
      </h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 block">
            Report Type
          </label>
          <div className="flex gap-2 flex-wrap">
            {(["unit", "student", "lecturer", "program"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${type === t ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 block">
            Period
          </label>
          <div className="flex gap-2 flex-wrap">
            {(["month", "semester", "academicYear", "custom"] as const).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${period === p ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {p === "academicYear"
                    ? "Academic Year"
                    : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {period === "custom" && (
          <div className="flex gap-3">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {type === "unit" && (
            <select
              value={filters.unitId}
              onChange={(e) =>
                setFilters({ ...filters, unitId: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Units</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          {type === "student" && (
            <select
              value={filters.studentId}
              onChange={(e) =>
                setFilters({ ...filters, studentId: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.regNo})
                </option>
              ))}
            </select>
          )}
          {type === "lecturer" && (
            <select
              value={filters.lecturerId}
              onChange={(e) =>
                setFilters({ ...filters, lecturerId: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Lecturers</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName}
                </option>
              ))}
            </select>
          )}
          {type === "program" && (
            <select
              value={filters.programId}
              onChange={(e) =>
                setFilters({ ...filters, programId: e.target.value })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => generate("pdf")}
            className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 transition shadow-lg shadow-rose-500/20"
          >
            Export PDF
          </button>
          <button
            onClick={() => generate("excel")}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20"
          >
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
