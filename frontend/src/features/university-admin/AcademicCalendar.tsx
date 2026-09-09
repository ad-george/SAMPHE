import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const AcademicCalendar = () => {
  const [activeYear, setActiveYear] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [archivedYears, setArchivedYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updateData, setUpdateData] = useState({ startDate: "", endDate: "" });
  const [newYearName, setNewYearName] = useState("");
  const [semesterForm, setSemesterForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = async () => {
    try {
      const res = await api.get("/university-admin/academic-years");
      const data = res.data.data;
      setActiveYear(data.activeYear);
      setYears(data.years || []);
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await api.get("/university-admin/semesters");
      setSemesters(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch semesters:", err);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await api.get("/university-admin/academic-years/progress");
      setProgress(res.data.data);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    }
  };

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await api.get("/university-admin/academic-years/archived");
      setArchivedYears(res.data.data || []);
      setShowArchived(true);
    } catch (err) {
      toast.error("Failed to fetch archived years");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (yearId: string) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/university-admin/academic-years/${yearId}/attendance`,
      );
      setAttendanceData(res.data.data);
      setShowAttendanceModal(true);
    } catch (err) {
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProgress();
    fetchSemesters();
  }, []);

  const handleUpdateClick = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    setNewYearName(`${currentYear}/${nextYear}`);
    setUpdateData({
      startDate: `${currentYear}-08-01`,
      endDate: `${nextYear}-07-31`,
    });
    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = () => {
    setShowUpdateModal(false);
    setShowConfirmModal(true);
  };

  const executeUpdate = async (action: string) => {
    setLoading(true);
    try {
      await api.post("/university-admin/academic-years/update", {
        startDate: updateData.startDate,
        endDate: updateData.endDate,
        name: newYearName,
        action,
      });
      toast.success(
        action === "ACCEPT_ALL"
          ? "Academic year updated! Previous year archived."
          : action === "DONT_ARCHIVE"
            ? "Academic year updated! Previous year deleted."
            : "No changes made",
      );
      setShowConfirmModal(false);
      fetchData();
      fetchProgress();
      fetchSemesters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const deleteArchivedYear = async (yearId: string, yearName: string) => {
    if (!confirm(`Permanently delete ${yearName}? This cannot be undone.`))
      return;
    try {
      await api.delete(`/university-admin/academic-years/${yearId}`);
      toast.success("Archived year deleted");
      fetchArchived();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleSemesterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates are within academic year
    if (activeYear) {
      const yearStart = new Date(activeYear.startDate);
      const yearEnd = new Date(activeYear.endDate);
      const semStart = new Date(semesterForm.startDate);
      const semEnd = new Date(semesterForm.endDate);

      if (semStart < yearStart || semEnd > yearEnd) {
        toast.error("Semester dates must be within the academic year");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...semesterForm,
        studyYearId: activeYear?.studyYearId || "",
        universityId: activeYear?.universityId || "",
      };

      if (editingSemester) {
        await api.put(
          `/university-admin/semesters/${editingSemester.id}`,
          payload,
        );
        toast.success("Semester updated successfully!");
      } else {
        await api.post("/university-admin/semesters", payload);
        toast.success("Semester created successfully!");
      }

      setShowSemesterModal(false);
      setEditingSemester(null);
      setSemesterForm({ name: "", startDate: "", endDate: "" });
      fetchSemesters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save semester");
    } finally {
      setLoading(false);
    }
  };

  const deleteSemester = async (id: string) => {
    if (!confirm("Delete this semester? This cannot be undone.")) return;
    try {
      await api.delete(`/university-admin/semesters/${id}`);
      toast.success("Semester deleted");
      fetchSemesters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const openEditSemester = (semester: any) => {
    setEditingSemester(semester);
    setSemesterForm({
      name: semester.name,
      startDate: semester.startDate?.split("T")[0] || "",
      endDate: semester.endDate?.split("T")[0] || "",
    });
    setShowSemesterModal(true);
  };

  const openAddSemester = () => {
    setEditingSemester(null);
    setSemesterForm({ name: "", startDate: "", endDate: "" });
    setShowSemesterModal(true);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCurrentSemester = () => {
    const now = new Date();
    return semesters.find((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return now >= start && now <= end;
    });
  };

  const currentSemester = getCurrentSemester();

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Academic Calendar
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your institution's academic year and semester dates
        </p>
      </div>

      {/* Active Year Card */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">
              Current Academic Year
            </p>
            <h2 className="text-4xl font-bold text-white mt-1">
              {activeYear?.name || "Not Set"}
            </h2>
            {activeYear && (
              <div className="flex items-center gap-6 mt-3 text-sm">
                <span className="text-slate-400">
                  Started: {formatDate(activeYear.startDate)}
                </span>
                <span className="text-slate-400">
                  Ends: {formatDate(activeYear.endDate)}
                </span>
                {progress?.daysLeft !== null && (
                  <span className="text-emerald-400 font-medium">
                    {progress?.daysLeft} days left
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {progress?.hasActiveYear && (
              <div className="w-48">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{progress?.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress?.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleUpdateClick}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-sm font-medium transition shadow-lg shadow-cyan-500/20 text-white"
              >
                Update Year
              </button>
              <button
                onClick={fetchArchived}
                className="px-5 py-2 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 rounded-xl text-sm font-medium transition text-slate-300"
              >
                Archived ({archivedYears.length || 0})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Semester Card */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Current Semester
            </p>
            <h3 className="text-2xl font-bold text-white">
              {currentSemester?.name || "No active semester"}
            </h3>
            {currentSemester && (
              <p className="text-sm text-slate-400 mt-1">
                {formatDate(currentSemester.startDate)} —{" "}
                {formatDate(currentSemester.endDate)}
              </p>
            )}
          </div>
          <button
            onClick={openAddSemester}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition text-white"
          >
            + Add Semester
          </button>
        </div>
      </div>

      {/* Semester List */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">All Semesters</h3>
          <span className="text-xs text-slate-500">
            {semesters.length} semesters
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-left p-4 font-medium">Semester</th>
                <th className="text-left p-4 font-medium">Start Date</th>
                <th className="text-left p-4 font-medium">End Date</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {semesters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No semesters created yet
                  </td>
                </tr>
              ) : (
                semesters.map((s) => {
                  const isCurrent = currentSemester?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-800/50 hover:bg-white/[0.02] transition ${
                        isCurrent ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <td className="p-4">
                        <span
                          className={`font-medium ${isCurrent ? "text-emerald-400" : "text-white"}`}
                        >
                          {s.name}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              CURRENT
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {formatDate(s.startDate)}
                      </td>
                      <td className="p-4 text-slate-300">
                        {formatDate(s.endDate)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            isCurrent
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {isCurrent ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="p-4 space-x-2">
                        <button
                          onClick={() => openEditSemester(s)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSemester(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Previous Years List */}
      {years.length > 0 && (
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white">Previous Years</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-left p-4 font-medium">Year</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {years
                .filter((y) => y.id !== activeYear?.id)
                .map((y) => (
                  <tr
                    key={y.id}
                    className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
                  >
                    <td className="p-4 text-white font-medium">{y.name}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        INACTIVE
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-500 text-xs">—</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Years Modal */}
      {showArchived && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Archived Academic Years
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Auto-deleted after 5 years
                </p>
              </div>
              <button
                onClick={() => setShowArchived(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : archivedYears.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No archived years
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                    <th className="text-left p-4 font-medium">Year</th>
                    <th className="text-left p-4 font-medium">Archived Date</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedYears.map((y) => (
                    <tr
                      key={y.id}
                      className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
                    >
                      <td className="p-4 text-white font-medium">{y.name}</td>
                      <td className="p-4 text-slate-400">
                        {y.archivedAt
                          ? new Date(y.archivedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-4">
                        {y.autoDelete ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            AUTO-DELETE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            ARCHIVED
                          </span>
                        )}
                      </td>
                      <td className="p-4 space-x-2">
                        <button
                          onClick={() => fetchAttendanceData(y.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                        >
                          View Data
                        </button>
                        <button
                          onClick={() => deleteArchivedYear(y.id, y.name)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Semester Modal */}
      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-500/30">
                📚
              </div>
              <h3 className="text-2xl font-bold text-white">
                {editingSemester ? "Edit Semester" : "Add Semester"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {editingSemester
                  ? "Update semester dates"
                  : "Create a new semester"}
              </p>
              {activeYear && (
                <p className="text-xs text-cyan-400 mt-2">
                  Academic Year: {activeYear.name} (
                  {formatDate(activeYear.startDate)} —{" "}
                  {formatDate(activeYear.endDate)})
                </p>
              )}
            </div>

            <form onSubmit={handleSemesterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Semester Name
                </label>
                <input
                  type="text"
                  value={semesterForm.name}
                  onChange={(e) =>
                    setSemesterForm({ ...semesterForm, name: e.target.value })
                  }
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
                  placeholder="e.g., Semester 1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={semesterForm.startDate}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={semesterForm.endDate}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-400">
                  ⚠️ Semester dates must be within the academic year range
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingSemester
                      ? "Update"
                      : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-400 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Year Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-3 border border-cyan-500/30">
                📅
              </div>
              <h3 className="text-2xl font-bold text-white">
                Update Academic Year
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Set the new academic year details
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  New Academic Year
                </label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
                  placeholder="e.g., 2026/2027"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={updateData.startDate}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={updateData.endDate}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, endDate: e.target.value })
                    }
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition"
                  />
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 mt-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Summary
                </p>
                <p className="text-sm text-white mt-1">
                  Current:{" "}
                  <span className="text-cyan-400 font-medium">
                    {activeYear?.name || "None"}
                  </span>
                </p>
                <p className="text-sm text-white">
                  New:{" "}
                  <span className="text-emerald-400 font-medium">
                    {newYearName || "Not set"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleConfirmUpdate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition text-sm font-medium text-white shadow-lg shadow-cyan-500/20"
              >
                Confirm Update
              </button>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Update Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-amber-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-amber-500/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl mx-auto mb-3 border border-amber-500/30">
                ⚠️
              </div>
              <h3 className="text-2xl font-bold text-white">
                Confirm Academic Year Update
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                You are changing to:{" "}
                <span className="text-cyan-400 font-bold">{newYearName}</span>
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 mb-6">
              <p className="text-sm text-slate-300">
                <span className="text-amber-400 font-medium">
                  {activeYear?.name}
                </span>{" "}
                will be:
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => executeUpdate("ACCEPT_ALL")}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                ✅ Accept All — Archive Old Year
              </button>

              <button
                onClick={() => executeUpdate("DONT_ARCHIVE")}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition text-sm font-medium text-white shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                🗑️ Don't Archive — Delete Old Year
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  toast("No changes made", { icon: "ℹ️" });
                }}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-400 hover:text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-1.5">
              <p className="text-xs text-slate-500">What happens next:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>
                    <span className="text-emerald-400 font-medium">
                      Accept All
                    </span>{" "}
                    → New year active, old year archived
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>
                    <span className="text-rose-400 font-medium">
                      Don't Archive
                    </span>{" "}
                    → New year active, old year{" "}
                    <span className="text-rose-400 font-bold">DELETED</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>
                    <span className="text-slate-400">Cancel</span> → No changes
                    made
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Data Modal */}
      {showAttendanceModal && attendanceData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Attendance Data: {attendanceData.year}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(attendanceData.startDate)} —{" "}
                  {formatDate(attendanceData.endDate)}
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-2xl font-bold text-cyan-400">
                  {attendanceData.totalSessions}
                </p>
                <p className="text-xs text-slate-500">Total Sessions</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-2xl font-bold text-blue-400">
                  {attendanceData.totalRecords}
                </p>
                <p className="text-xs text-slate-500">Total Records</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-2xl font-bold text-emerald-400">
                  {attendanceData.totalPresent}
                </p>
                <p className="text-xs text-slate-500">Present</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-2xl font-bold text-amber-400">
                  {attendanceData.overallRate}%
                </p>
                <p className="text-xs text-slate-500">Overall Rate</p>
              </div>
            </div>

            <div className="bg-slate-800/20 rounded-xl overflow-hidden border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase">
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Sessions</th>
                    <th className="text-left p-4 font-medium">Records</th>
                    <th className="text-left p-4 font-medium">Rate</th>
                    <th className="text-left p-4 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.departments.map((dept: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-700/50 hover:bg-white/[0.02] transition"
                    >
                      <td className="p-4 text-white font-medium">
                        {dept.departmentName}
                      </td>
                      <td className="p-4 text-slate-300">
                        {dept.totalSessions}
                      </td>
                      <td className="p-4 text-slate-300">
                        {dept.totalRecords}
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-bold ${parseFloat(dept.rate) >= 75 ? "text-emerald-400" : parseFloat(dept.rate) >= 50 ? "text-amber-400" : "text-rose-400"}`}
                        >
                          {dept.rate}%
                        </span>
                      </td>
                      <td className="p-4 w-32">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${parseFloat(dept.rate) >= 75 ? "bg-emerald-500" : parseFloat(dept.rate) >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${dept.rate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowAttendanceModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCalendar;
