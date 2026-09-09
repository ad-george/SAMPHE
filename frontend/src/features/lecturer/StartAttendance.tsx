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
    <div className="relative min-h-[calc(100vh-6rem)] flex items-stretch overflow-hidden rounded-2xl border border-slate-600 bg-slate-700">
      {/* Left — Fields */}
      <div className="relative z-10 flex-1 p-8 lg:p-12 flex flex-col justify-center max-w-2xl">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-8">
          Start Attendance
        </h1>

        <div className="space-y-8">
          <div>
            <label className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3 block">
              Select Teaching Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-500 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="" className="bg-slate-800">
                Choose a unit...
              </option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id} className="bg-slate-800">
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
            {unit && (
              <p className="text-xs text-slate-400 mt-2">
                {unit.program} {unit.studyYear} • {unit.totalStudents} students
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3 block">
              Session Duration
            </label>
            <div className="flex gap-3 flex-wrap items-center">
              {[5, 10, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    setCustomDuration("");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${duration === d ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
                >
                  {d} min
                </button>
              ))}
              <button
                onClick={() => setDuration(-1)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${duration === -1 ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
              >
                Customize
              </button>
              {duration === -1 && (
                <input
                  type="number"
                  placeholder="Minutes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-28 bg-slate-800 border border-slate-500 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3 block">
              Session Radius
            </label>
            <div className="flex gap-3 flex-wrap items-center">
              {[30, 50, 70].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRadius(r);
                    setCustomRadius("");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${radius === r ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
                >
                  {r}m
                </button>
              ))}
              <button
                onClick={() => setRadius(-1)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${radius === -1 ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500"}`}
              >
                Customize
              </button>
              {radius === -1 && (
                <input
                  type="number"
                  placeholder="Meters"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="w-28 bg-slate-800 border border-slate-500 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Recommended: 50m for standard lecture halls
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-600 space-y-2">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium">
              Session Summary
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-400">
                Unit:{" "}
                <span className="text-white font-medium">
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
              className="w-full mt-4 py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20 tracking-wide"
            >
              GENERATE ATTENDANCE LINK
            </button>
          </div>
        </div>
      </div>

      {/* Right — Fading Image & Statements */}
      <div className="hidden lg:block relative w-[45%] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80"
          alt="Classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Fade to left (into fields) */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-700/40 to-slate-700" />
        {/* Fade to bottom (for statements) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-700/90" />

        {/* Statements */}
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
