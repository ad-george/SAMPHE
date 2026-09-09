import { useEffect, useState } from "react";
import api from "../../services/api";

const AcademicStructure = () => {
  const [studyYears, setStudyYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/hod/study-years"),
      api.get("/hod/semesters"),
    ]).then(([yearsRes, semRes]) => {
      setStudyYears(yearsRes.data.data || []);
      setSemesters(semRes.data.data || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          🏛️ Academic Structure
        </h1>
        <p className="text-slate-500 mt-1">
          Pre-defined study years and semesters used across all programs
        </p>
      </div>

      {/* Study Years */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Study Years</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            {studyYears.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {studyYears.map((y, i) => (
            <span
              key={y.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                i === 0 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {y.name}
            </span>
          ))}
          {studyYears.length === 0 && (
            <p className="text-slate-400 text-sm">No study years found</p>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Used to group students by academic level
        </p>
      </div>

      {/* Semesters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Semesters</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            {semesters.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {semesters.map((s, i) => (
            <span
              key={s.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                i === 0 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {s.name}
            </span>
          ))}
          {semesters.length === 0 && (
            <p className="text-slate-400 text-sm">No semesters found</p>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Used to define academic periods within each year
        </p>
      </div>
    </div>
  );
};

export default AcademicStructure;