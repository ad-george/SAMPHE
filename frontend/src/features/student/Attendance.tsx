import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import backgroundImage from "../../assets/submission.png";

const StudentAttendance = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<any>(null);
  const [regNo, setRegNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const pollInterval = useRef<any>(null);
  const timerInterval = useRef<any>(null);

  const accentColor = "#10b981"; // Green accent

  // ✅ Check if session is still valid
  const checkSessionValidity = async () => {
    try {
      const res = await api.get(`/public/attend/${token}`);
      if (!res.data.success || !res.data.data) {
        setExpired(true);
        setSession(null);
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setExpired(true);
        setSession(null);
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
      }
    }
  };

  useEffect(() => {
    const submittedKey = `attendance_submitted_${token}`;
    if (localStorage.getItem(submittedKey) === "true") {
      setSubmitted(true);
    }

    api
      .get(`/public/attend/${token}`)
      .then((res) => {
        setSession(res.data.data);

        // ✅ Start countdown timer
        const startTime = new Date(res.data.data.createdAt).getTime();
        const endTime = startTime + res.data.data.duration * 60000;

        const tick = () => {
          const remaining = Math.max(0, endTime - Date.now());
          setTimeLeft(Math.floor(remaining / 1000));
        };
        tick();
        timerInterval.current = setInterval(tick, 1000);

        // ✅ Start polling
        pollInterval.current = setInterval(checkSessionValidity, 5000);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setExpired(true);
        } else {
          toast.error("Invalid or expired attendance link");
        }
      });

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [token]);

  const lookupStudent = async () => {
    if (!regNo || !session) return;
    try {
      const res = await api.get(
        `/lecturer/students/search?regNo=${regNo}&unitId=${session.unitId}`,
      );
      const student = res.data.data;
      if (student) {
        setStudentName(student.fullName);
      } else {
        setStudentName("");
        toast.error("Student not found or not registered for this unit");
      }
    } catch {
      setStudentName("");
      toast.error("Student not found");
    }
  };

  const submit = async () => {
    if (!studentName) return toast.error("Enter a valid registration number");
    setLoading(true);

    let googleAccountId = null;
    try {
      const accounts = await (
        window as any
      ).google?.accounts?.id?.getCredentialState?.();
      if (accounts) {
        googleAccountId = accounts;
      }
    } catch (err) {
      console.log("Could not get Google account info");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post(`/public/attend/${token}`, {
            regNo: regNo.trim(),
            studentLat: pos.coords.latitude,
            studentLng: pos.coords.longitude,
            studentAccuracy: pos.coords.accuracy,
            googleAccountId: googleAccountId,
          });
          localStorage.setItem(`attendance_submitted_${token}`, "true");
          setSubmitted(true);
          toast.success("Attendance submitted successfully!");
        } catch (err: any) {
          if (err.response?.status === 404) {
            setExpired(true);
            setSession(null);
          } else {
            toast.error(err.response?.data?.message || "Submission failed", {
              duration: 6000,
            });
          }
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Location permission is required");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ✅ Expired
  if (expired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-800 p-4">
        <div className="bg-slate-700 rounded-2xl p-8 text-center border border-slate-600 max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-900/30 flex items-center justify-center mx-auto mb-4 border border-rose-800">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
          <p className="text-slate-400 text-sm">
            This attendance link is no longer valid.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Loading
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-800">
        <div className="bg-slate-700 rounded-2xl p-8 text-center border border-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading attendance session...</p>
        </div>
      </div>
    );
  }

  const university = session.lecturer?.university;
  const unit = session.unit;
  const lecturer = session.lecturer;
  const department = unit?.department;
  const faculty = department?.faculty;
  const program = unit?.program;
  const studyYear = unit?.studyYear;
  const semester = unit?.semester;

  // Format year/sem: "Year 2" → "Y2", "Semester 1" → "S1"
  const yearNum = studyYear?.name?.match(/\d+/)?.[0] || "?";
  const semNum = semester?.name?.match(/\d+/)?.[0] || "?";
  const yearSem = `Y${yearNum}S${semNum}`;

  // Start and End time
  const sessionDate = new Date(session.createdAt);
  const endDate = new Date(sessionDate.getTime() + session.duration * 60000);
  const startTimeStr = sessionDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Week number
  const startOfYear = new Date(sessionDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((sessionDate.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7,
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Card with reduced opacity backdrop */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full border border-slate-200">
        {/* University Header */}
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          {university?.logo ? (
            <img
              src={university.logo}
              alt={university.name}
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-3xl text-white">🎓</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">
            {university?.name || "University"}
          </h1>
          <div className="text-sm text-slate-500 mt-2 space-y-0.5">
            {university?.address && <p>{university.address}</p>}
            {university?.phone && <p>Tel: {university.phone}</p>}
            <p>
              {university?.email && `Email: ${university.email}`}
              {university?.email && university?.website && " | "}
              {university?.website && `Website: ${university.website}`}
            </p>
          </div>
        </div>

        {/* Countdown Banner */}
        <div className="mb-5 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Session Closes In
            </p>
            <p
              className="text-2xl font-bold font-mono"
              style={{ color: accentColor }}
            >
              {formatCountdown(timeLeft)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Started / Ends
            </p>
            <p className="text-sm font-semibold text-slate-700">
              {startTimeStr} — {endTimeStr}
            </p>
          </div>
        </div>

        {/* Academic Session Details */}
        <div className="mb-6">
          <h2
            className="text-sm font-bold mb-4 text-center uppercase tracking-wide border-b border-slate-200 pb-2"
            style={{ color: accentColor }}
          >
            Academic Session Details
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {/* LEFT COLUMN */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">School:</span>
              <span className="text-slate-800 font-medium">
                {faculty?.name || department?.faculty?.name || "N/A"}
              </span>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">
                Stage / Campus:
              </span>
              <span className="text-slate-800 font-medium">
                {yearSem} / MAIN
              </span>
            </div>

            {/* LEFT */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">
                Department:
              </span>
              <span className="text-slate-800 font-medium">
                {department?.name || "N/A"}
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">
                Date / Week:
              </span>
              <span className="text-slate-800 font-medium">
                {sessionDate.toLocaleDateString()} / Week {weekNumber}
              </span>
            </div>

            {/* LEFT */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">
                Programme:
              </span>
              <span className="text-slate-800 font-medium">
                {program?.name || "N/A"}
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex">
              <span className="text-slate-500 w-28 flex-shrink-0">
                Lecturer:
              </span>
              <span className="text-slate-800 font-medium">
                {lecturer?.fullName || "N/A"}
              </span>
            </div>

            {/* LEFT — Unit */}
            <div className="flex col-span-2">
              <span className="text-slate-500 w-28 flex-shrink-0">Unit:</span>
              <span className="text-slate-800 font-medium">
                {unit?.code} - {unit?.name}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 mb-6" />

        {/* Success State */}
        {submitted ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Attendance Recorded!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                You have already submitted attendance.
                <br />
                You cannot submit again.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                onBlur={lookupStudent}
                className="w-full bg-white/80 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. BSC/01/2023"
              />
            </div>

            {studentName && (
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs text-emerald-600">Student Name</p>
                <p className="font-semibold text-slate-800">{studentName}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 text-center mt-2">
              📍 Location will be verified automatically
            </div>

            <button
              onClick={submit}
              disabled={!studentName || loading}
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
