import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const StudentCheckIn = () => {
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
        `/student/search?regNo=${regNo}&unitId=${session.unitId}`,
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post(`/lecturer/attend/${token}`, {
            regNo,
            studentLat: pos.coords.latitude,
            studentLng: pos.coords.longitude,
            studentAccuracy: pos.coords.accuracy,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="bg-slate-700 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-600">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-white">🎓</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {session.lecturer?.university?.name || "University"}
          </h1>
          <p className="text-slate-400 text-sm">
            {session.unit?.programme?.name} | {session.unit?.studyYear?.name} |{" "}
            {session.unit?.semester?.name}
          </p>
          <h2 className="text-lg font-semibold text-white mt-2">
            {session.unit?.code} - {session.unit?.name}
          </h2>
          <p className="text-sm text-slate-400">
            Lecturer: {session.lecturer?.fullName}
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-emerald-400">
              Attendance Recorded!
            </h2>
            <p className="text-slate-400">
              You have successfully signed attendance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                onBlur={lookupStudent}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. BSC/01/2023"
              />
            </div>
            {studentName && (
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-400">Student Name</p>
                <p className="font-semibold text-white">{studentName}</p>
              </div>
            )}
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

export default StudentCheckIn;
