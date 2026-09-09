import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const StudentAttendance = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<any>(null);
  const [regNo, setRegNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .get(`/lecturer/attend/${token}`)
      .then((res) => {
        setSession(res.data.data);
      })
      .catch(() => {
        toast.error("Invalid or expired attendance link");
      });
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

    // Get Google Account ID if available
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
          await api.post(`/lecturer/attend/${token}`, {
            regNo: regNo.trim(),
            studentLat: pos.coords.latitude,
            studentLng: pos.coords.longitude,
            studentAccuracy: pos.coords.accuracy,
            googleAccountId: googleAccountId,
          });
          setSubmitted(true);
          toast.success("Attendance submitted successfully!");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Submission failed");
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Location permission is required");
        setLoading(false);
      },
    );
  };

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

  const sessionDate = new Date(session.createdAt);
  const startOfYear = new Date(sessionDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((sessionDate.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200">
        {/* University Header */}
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          {university?.logo ? (
            <img
              src={university.logo}
              alt={university.name}
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
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

        {/* Academic Session Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center uppercase tracking-wide border-b border-slate-200 pb-2">
            Academic Session Details
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">School:</span>
              <span className="text-slate-800 font-medium">
                {faculty?.name || department?.faculty?.name || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">
                Department:
              </span>
              <span className="text-slate-800 font-medium">
                {department?.name || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">
                Programme:
              </span>
              <span className="text-slate-800 font-medium">
                {program?.name || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">Unit:</span>
              <span className="text-slate-800 font-medium">
                {unit?.code} - {unit?.name}
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">
                Stage / Campus:
              </span>
              <span className="text-slate-800 font-medium">
                {studyYear?.name || "N/A"} / MAIN
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-500 w-32 flex-shrink-0">
                Date / Week:
              </span>
              <span className="text-slate-800 font-medium">
                {sessionDate.toLocaleDateString()} / Week {weekNumber}
              </span>
            </div>
            <div className="flex col-span-2">
              <span className="text-slate-500 w-32 flex-shrink-0">
                Lecturer:
              </span>
              <span className="text-slate-800 font-medium">
                {lecturer?.fullName || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 mb-6" />

        {/* ================================================ */}
        {/* ✅ SUCCESS STATE - CENTERED CARD OVERLAY */}
        {/* ================================================ */}

        {submitted ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
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
          /* ================================================ */
          /* ATTENDANCE FORM */
          /* ================================================ */
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
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
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
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
