import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

const StartAttendance = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState("");
  const [radius, setRadius] = useState(50);
  const [customRadius, setCustomRadius] = useState("");
  const [gps, setGps] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false); // ⬅️ new
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as any)?.unitId;

  useEffect(() => {
    api.get("/lecturer/units").then((r) => {
      setUnits(r.data.data);
      if (preselected) setSelectedUnit(preselected);
    });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => toast("GPS access denied. Location will not be captured."),
    );
  }, [preselected]);

  const finalDuration =
    duration === -1 ? Number(customDuration) || 15 : duration;
  const finalRadius = radius === -1 ? Number(customRadius) || 50 : radius;

  const generate = async () => {
    if (!selectedUnit) {
      toast.error("Select a unit");
      return;
    }
    try {
      const res = await api.post("/lecturer/sessions", {
        unitId: selectedUnit,
        duration: finalDuration,
        radius: finalRadius,
        gpsLocation: gps,
      });
      toast.success("Session started");
      navigate("/lecturer/live", { state: { sessionId: res.data.data.id } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const unit = units.find((u: any) => u.id === selectedUnit);

  return (
    // ── Fix 1: no full-height stretch, no justify-center, so no scroll
    <div className="relative flex items-stretch overflow-hidden rounded-lg md:rounded-2xl border border-slate-600 bg-slate-700">
      {/* Left — Fields */}
      <div className="relative z-10 flex-1 p-3 md:p-8 lg:p-12 max-w-2xl">
        <h1 className="text-base md:text-3xl font-bold text-white tracking-tight mb-2 md:mb-8">
          Start Attendance
        </h1>

        <div className="space-y-2.5 md:space-y-8">
          {/* ── Fix 3: custom dropdown ── */}
          <div>
            <label className="text-[10px] md:text-xs text-emerald-400 uppercase tracking-wide md:tracking-wider font-medium mb-1 md:mb-3 block">
              Select Teaching Unit
            </label>

            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setDropdownOpen(true)}
              className="w-full bg-slate-800 border border-slate-500 rounded-md md:rounded-xl px-2.5 md:px-4 py-2 md:py-3 text-[12px] md:text-sm text-white text-left focus:border-emerald-400 focus:outline-none flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {unit ? `${unit.code} — ${unit.name}` : "Choose a unit..."}
              </span>
              <span className="text-slate-400 shrink-0">▾</span>
            </button>

            {unit && (
              <p className="text-[10px] md:text-xs text-slate-400 mt-1 md:mt-2">
                {unit.program} {unit.studyYear} • {unit.totalStudents} students
              </p>
            )}

            {/* Dropdown modal — centered, small, scrollable */}
            {dropdownOpen && (
              <div
                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 md:p-4"
                onClick={() => setDropdownOpen(false)}
              >
                <div
                  className="bg-slate-800 border border-slate-600 rounded-xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="px-3 py-2 md:px-4 md:py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <p className="text-[11px] md:text-sm text-emerald-400 uppercase tracking-wide font-semibold">
                      Choose Unit
                    </p>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(false)}
                      className="text-slate-400 hover:text-white text-base"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Unit list */}
                  <div className="overflow-y-auto flex-1">
                    {units.length === 0 && (
                      <p className="text-center text-[11px] text-slate-400 py-6">
                        No units assigned
                      </p>
                    )}
                    {units.map((u: any) => {
                      const isSelected = u.id === selectedUnit;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUnit(u.id);
                            setDropdownOpen(false);
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
          </div>

          {/* Session Duration */}
          <div>
            <label className="text-[10px] md:text-xs text-emerald-400 uppercase tracking-wide md:tracking-wider font-medium mb-1 md:mb-3 block">
              Session Duration
            </label>
            <div className="flex gap-1.5 md:gap-3 flex-wrap items-center">
              {[5, 10, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    setCustomDuration("");
                  }}
                  className={`px-2.5 md:px-5 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[11px] md:text-sm font-medium border transition ${duration === d ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
                >
                  {d} min
                </button>
              ))}
              <button
                onClick={() => setDuration(-1)}
                className={`px-2.5 md:px-5 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[11px] md:text-sm font-medium border transition ${duration === -1 ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
              >
                Customize
              </button>
              {duration === -1 && (
                <input
                  type="number"
                  placeholder="Minutes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-20 md:w-28 bg-slate-800 border border-slate-500 rounded-md md:rounded-xl px-2 md:px-3 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* ── Fix 2: Session Radius — same small sizes as Duration ── */}
          <div>
            <label className="text-[10px] md:text-xs text-emerald-400 uppercase tracking-wide md:tracking-wider font-medium mb-1 md:mb-3 block">
              Session Radius
            </label>
            <div className="flex gap-1.5 md:gap-3 flex-wrap items-center">
              {[30, 50, 70].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRadius(r);
                    setCustomRadius("");
                  }}
                  className={`px-2.5 md:px-5 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[11px] md:text-sm font-medium border transition ${radius === r ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
                >
                  {r}m
                </button>
              ))}
              <button
                onClick={() => setRadius(-1)}
                className={`px-2.5 md:px-5 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[11px] md:text-sm font-medium border transition ${radius === -1 ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
              >
                Customize
              </button>
              {radius === -1 && (
                <input
                  type="number"
                  placeholder="Meters"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="w-20 md:w-28 bg-slate-800 border border-slate-500 rounded-md md:rounded-xl px-2 md:px-3 py-1.5 md:py-2.5 text-[11px] md:text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">
              Recommended: 50m for standard lecture halls
            </p>
          </div>

          {/* Summary */}
          <div className="bg-slate-800 rounded-md md:rounded-xl p-2.5 md:p-5 border border-slate-600 space-y-1.5 md:space-y-2">
            <p className="text-[10px] md:text-xs text-emerald-400 uppercase tracking-wide md:tracking-wider font-medium">
              Session Summary
            </p>
            <div className="grid grid-cols-2 gap-1 md:gap-2 text-[11px] md:text-sm">
              <p className="text-slate-400">
                Unit:{" "}
                <span className="text-white font-medium truncate">
                  {unit?.name || "—"}
                </span>
              </p>
              <p className="text-slate-400">
                Duration:{" "}
                <span className="text-white font-medium">
                  {finalDuration} min
                </span>
              </p>
              <p className="text-slate-400">
                Radius:{" "}
                <span className="text-white font-medium">{finalRadius}m</span>
              </p>
              <p className="text-slate-400">
                GPS:{" "}
                <span className="text-white font-medium">
                  {gps ? "Captured" : "Pending"}
                </span>
              </p>
            </div>
            <button
              onClick={generate}
              className="w-full mt-2 md:mt-4 py-2 md:py-3.5 rounded-md md:rounded-xl bg-emerald-600 text-white text-[11px] md:text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20 tracking-wide"
            >
              GENERATE ATTENDANCE LINK
            </button>
          </div>
        </div>
      </div>

      {/* Right — Fading Image & Statements (desktop only) */}
      <div className="hidden lg:block relative w-[45%] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80"
          alt="Classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-700/40 to-slate-700" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-700/90" />
        <div className="absolute right-8 top-1/3 max-w-xs text-right space-y-6">
          <p className="text-white/90 text-lg font-semibold leading-relaxed drop-shadow-lg">
            Set a radius that matches your classroom size to ensure only present
            students can check in.
          </p>
          <p className="text-white/70 text-base font-medium leading-relaxed drop-shadow-md">
            Longer durations allow more students to sign in, but keep sessions
            tight to maintain accuracy.
          </p>
          <p className="text-white/50 text-sm font-medium leading-relaxed drop-shadow">
            GPS verification adds a layer of trust to every attendance record
            you create.
          </p>
          <p className="text-white/30 text-sm leading-relaxed drop-shadow">
            All sessions are automatically logged and ready for HOD review at
            any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartAttendance;
