import { useEffect, useState } from "react";
import api from "../../services/api";

const Analytics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/hod/analytics").then((r) => setData(r.data.data));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
        Department Analytics
      </h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Department Attendance Rate
          </h3>
          <span className="text-3xl font-bold text-emerald-600">
            {data?.departmentRate || 0}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(parseFloat(data?.departmentRate || 0), 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Program Comparison
          </h3>
          <div className="space-y-3">
            {data?.programStats?.map((p: any) => (
              <div
                key={p.programId}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {p.programName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.studentCount} students
                  </p>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {p.rate}%
                </span>
              </div>
            ))}
            {!data?.programStats?.length && (
              <p className="text-slate-400 text-sm text-center py-4">No data</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Lecturer Performance
          </h3>
          <div className="space-y-3">
            {data?.lecturerStats?.map((l: any) => (
              <div
                key={l.lecturerId}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {l.lecturerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {l.sessionCount} sessions
                  </p>
                </div>
                <span
                  className={`text-lg font-bold ${parseFloat(l.rate) >= 75 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {l.rate}%
                </span>
              </div>
            ))}
            {!data?.lecturerStats?.length && (
              <p className="text-slate-400 text-sm text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Worst Performing Units
        </h3>
        <div className="space-y-3">
          {data?.unitStats?.slice(0, 5).map((u: any) => (
            <div
              key={u.unitId}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {u.unitName}
                </p>
                <p className="text-xs text-slate-500">
                  {u.sessionCount} sessions
                </p>
              </div>
              <span className="text-lg font-bold text-rose-600">{u.rate}%</span>
            </div>
          ))}
          {!data?.unitStats?.length && (
            <p className="text-slate-400 text-sm text-center py-4">No data</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 text-rose-600">
          Intervention List (&lt; 75% Attendance)
        </h3>
        <div className="space-y-3">
          {data?.lowAttendees?.map((s: any) => (
            <div
              key={s.studentId}
              className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.regNo} &bull; {s.program}
                </p>
              </div>
              <span className="text-lg font-bold text-rose-600">{s.rate}%</span>
            </div>
          ))}
          {!data?.lowAttendees?.length && (
            <p className="text-emerald-600 text-sm text-center py-4 font-medium">
              No students below 75% &mdash; Great job!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
