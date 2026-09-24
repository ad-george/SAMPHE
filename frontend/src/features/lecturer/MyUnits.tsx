import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const MyUnits = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/lecturer/units")
      .then((r) => setUnits(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const grouped = units.reduce((acc: any, u: any) => {
    const key = `${u.program} — ${u.studyYear}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-14 h-14 md:w-24 md:h-24 rounded-full bg-slate-700 flex items-center justify-center mb-3 md:mb-6 border border-slate-600">
          <svg
            className="w-12 h-12 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-sm md:text-xl font-bold text-white mb-1 md:mb-2">
          No Units Assigned
        </h2>
        <p className="text-[11px] md:text-sm text-slate-400 max-w-sm mb-4 md:mb-6">
          You currently have no teaching units assigned for this semester.
          Contact your HOD or University Admin to get started.
        </p>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => navigate("/lecturer")}
            className="px-3 md:px-5 py-1.5 md:py-2 bg-emerald-600 text-white rounded-md md:rounded-lg text-[11px] md:text-sm font-medium hover:bg-emerald-500 transition"
          >
            Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-700 border border-slate-600 text-slate-300 rounded-md md:rounded-lg text-[11px] md:text-sm font-medium hover:bg-slate-600 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base md:text-2xl font-bold text-green tracking-tight truncate">
          My Teaching Units
        </h1>
        <span className="text-[10px] md:text-xs text-slate-400 bg-slate-700 border border-slate-600 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg whitespace-nowrap shrink-0">
          {units.length} units
        </span>
      </div>

      {Object.entries(grouped).map(([group, list]: [string, any]) => (
        <div
          key={group}
          className="bg-slate-700 border border-slate-600 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm"
        >
          <h3 className="text-[10px] md:text-sm font-semibold text-emerald-400 uppercase tracking-wide md:tracking-wider mb-2 md:mb-4">
            {group}
          </h3>
          <div className="space-y-1.5 md:space-y-3">
            {list.map((u: any) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 md:p-4 bg-slate-800 rounded-md md:rounded-xl border border-slate-600 gap-2 md:gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <p className="text-[11px] md:text-sm font-bold text-white">
                      {u.code}
                    </p>
                    <p className="text-[11px] md:text-sm text-slate-300 truncate">
                      {u.name}
                    </p>
                  </div>
                  <p className="text-[9px] md:text-xs text-slate-400 mt-1 md:mt-1.5 leading-snug">
                    {u.semester} • {u.totalStudents} students •{" "}
                    {u.sessionsConducted} sessions • Avg{" "}
                    <span className="text-emerald-400 font-medium">
                      {u.avgAttendance}%
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() =>
                      navigate("/lecturer/start", {
                        state: { unitId: u.id, unitName: u.name },
                      })
                    }
                    className="text-[10px] md:text-xs px-2.5 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-medium shadow-lg shadow-emerald-500/10 w-full sm:w-auto"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyUnits;
