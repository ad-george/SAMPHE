import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Lecturers = () => {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showCount, setShowCount] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    staffNumber: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [credentials, setCredentials] = useState<any>(null);
  const [manageTarget, setManageTarget] = useState<any>(null);
  const [profileTarget, setProfileTarget] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [trackFilter, setTrackFilter] = useState({ unitId: "" });
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [shareTarget, setShareTarget] = useState<any>(null);

  const [assignModal, setAssignModal] = useState<any>(null);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [assignedUnits, setAssignedUnits] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Get HOD profile for email/phone
  const [hodProfile, setHodProfile] = useState<any>(null);

  const fetchLecturers = async () => {
    const res = await api.get("/hod/lecturers");
    setLecturers(res.data.data || []);
  };

  const fetchHodProfile = async () => {
    try {
      const res = await api.get("/hod/me");
      setHodProfile(res.data.data);
    } catch (err) {
      console.error("Failed to fetch HOD profile:", err);
    }
  };

  useEffect(() => {
    fetchLecturers();
    fetchHodProfile();
  }, []);

  const generatePass = () => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let p = "";
    for (let i = 0; i < 10; i++)
      p += c.charAt(Math.floor(Math.random() * c.length));
    return p;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = generatePass();
    try {
      await api.post("/hod/lecturers", { ...form, password: pass });
      toast.success("Lecturer created");
      setCredentials({ ...form, password: pass });
      setForm({
        staffNumber: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
      });
      setShowAddModal(false);
      fetchLecturers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const toggleStatus = async (lec: any) => {
    const next = lec.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/hod/lecturers/${lec.id}`, { status: next });
      toast.success(
        `Lecturer ${next === "ACTIVE" ? "activated" : "deactivated"}`,
      );
      fetchLecturers();
    } catch {
      toast.error("Failed");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/hod/lecturers/${deleteTarget.id}`);
      toast.success("Removed");
      setDeleteTarget(null);
      setManageTarget(null);
      fetchLecturers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const openProfile = async (lec: any) => {
    setProfileTarget(lec);
    await loadTracking(lec.id);
    await fetchAssignedUnits(lec.id);
  };

  const loadTracking = async (id: string, unitId?: string) => {
    try {
      const params = unitId ? `?unitId=${unitId}` : "";
      const res = await api.get(`/hod/lecturers/${id}/tracking${params}`);
      setTracking(res.data.data);
    } catch {}
  };

  // Share functions
  const shareViaWhatsApp = (target: any) => {
    const deptName = target.department?.name || "Department";
    const hodPhone = hodProfile?.phone || "";
    const message = `🔐 *SUAMP Lecturer Login Credentials*\n\n*Name:* ${target.fullName}\n*Email:* ${target.email || "Not Set"}\n*Password:* ${target.password || "Use existing password"}\n*Department:* ${deptName}\n\nLogin at: ${window.location.origin}/login/lecturer`;
    const encoded = encodeURIComponent(message);
    window.open(
      `https://wa.me/send?phone=${hodPhone}&text=${encoded}`,
      "_blank",
    );
  };

  const shareViaEmail = (target: any) => {
    const hodEmail = hodProfile?.email || "";
    const deptName = target.department?.name || "Department";
    const subject = encodeURIComponent("SUAMP Lecturer Login Credentials");
    const body = encodeURIComponent(
      `🔐 SUAMP Lecturer Login Credentials\n\nName: ${target.fullName}\nEmail: ${target.email || "Not Set"}\nPassword: ${target.password || "Use existing password"}\nDepartment: ${deptName}\n\nLogin at: ${window.location.origin}/login/lecturer`,
    );
    window.open(`mailto:${hodEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const copyCreds = (target: any) => {
    const deptName = target.department?.name || "Department";
    const text = `🔐 SUAMP Lecturer Login Credentials\n\nName: ${target.fullName}\nEmail: ${target.email || "Not Set"}\nPassword: ${target.password || "Use existing password"}\nDepartment: ${deptName}\n\nLogin at: ${window.location.origin}/login/lecturer`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/hod/lecturers/${editing.id}`, editing);
      toast.success("Updated");
      setEditing(null);
      fetchLecturers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const fetchAvailableUnits = async (lecturerId: string) => {
    setLoadingUnits(true);
    try {
      const res = await api.get(`/hod/lecturers/${lecturerId}/available-units`);
      setAvailableUnits(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch units");
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchAssignedUnits = async (lecturerId: string) => {
    try {
      const res = await api.get(`/hod/lecturers/${lecturerId}/assigned-units`);
      setAssignedUnits(res.data.data || []);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to fetch assigned units",
      );
    }
  };

  const handleAssignUnits = async () => {
    if (!assignModal || selectedUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }
    try {
      await api.post(`/hod/lecturers/${assignModal.id}/assign-units`, {
        unitIds: selectedUnits,
      });
      toast.success(`${selectedUnits.length} unit(s) assigned successfully`);
      setAssignModal(null);
      setSelectedUnits([]);
      fetchLecturers();
      if (profileTarget) {
        await loadTracking(profileTarget.id);
        await fetchAssignedUnits(profileTarget.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign units");
    }
  };

  const handleUnassignUnit = async (lecturerId: string, unitId: string) => {
    if (!confirm("Remove this unit from the lecturer?")) return;
    try {
      await api.delete(`/hod/lecturers/${lecturerId}/unassign-unit/${unitId}`);
      toast.success("Unit unassigned");
      fetchAssignedUnits(lecturerId);
      fetchLecturers();
      if (profileTarget?.id === lecturerId) {
        await loadTracking(lecturerId);
        await fetchAssignedUnits(lecturerId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unassign unit");
    }
  };

  const openAssignModal = (lecturer: any) => {
    setAssignModal(lecturer);
    setSelectedUnits([]);
    fetchAvailableUnits(lecturer.id);
    fetchAssignedUnits(lecturer.id);
  };

  const getProgramsFromUnits = (units: any[]) => {
    const programMap = new Map();
    units?.forEach((unit: any) => {
      if (unit.program) {
        const key = `${unit.program.name} ${unit.studyYear?.name || ""} ${unit.semester?.name || ""}`;
        if (!programMap.has(key)) {
          programMap.set(key, {
            program: unit.program,
            studyYear: unit.studyYear,
            semester: unit.semester,
            units: [],
          });
        }
        programMap.get(key).units.push(unit);
      }
    });
    return Array.from(programMap.values());
  };

  const filteredLecturers = lecturers.filter(
    (l) =>
      l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      l.staffNumber?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayedLecturers = filteredLecturers.slice(0, showCount);
  const hasMore = filteredLecturers.length > showCount;

  const chartData = tracking?.sessions
    ? {
        labels: tracking.sessions.map((_s: any, i: number) => `W${i + 1}`),
        datasets: [
          {
            label: "Attendance Rate %",
            data: tracking.sessions.map((s: any) => {
              const total = s.records.length;
              const present = s.records.filter(
                (r: any) => r.status === "PRESENT",
              ).length;
              return total > 0 ? ((present / total) * 100).toFixed(1) : 0;
            }),
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : { labels: [], datasets: [] };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Lecturer Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all lecturers in your department
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <input
          placeholder="Search by name, staff number, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Buttons Row */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white shadow-lg shadow-emerald-500/20"
        >
          + Add Lecturer
        </button>
        {filteredLecturers.length > 10 && (
          <button
            onClick={() =>
              setShowCount(showCount === 10 ? filteredLecturers.length : 10)
            }
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            {showCount === 10
              ? `View More (${filteredLecturers.length - 10} more)`
              : "View Less"}
          </button>
        )}
      </div>

      {/* Lecturers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                {/* Left-aligned all th classes */}
                <th className="text-left p-3 font-medium w-10">#</th>
                <th className="text-left p-3 font-medium w-20">Staff No</th>
                <th className="text-left p-3 font-medium w-64">Name</th>
                <th className="text-left p-3 font-medium w-16">Units</th>
                <th className="text-left p-3 font-medium w-28">Status</th>
                <th className="text-left p-3 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedLecturers.map((l, idx) => {
                const unitCount = l.units?.length || 0;
                const hasUnits = unitCount > 0;

                return (
                  <tr
                    key={l.id}
                    className={`border-b border-slate-100 transition ${
                      l.status !== "ACTIVE" ? "opacity-50" : ""
                    } ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    {/* Left-aligned serial number */}
                    <td className="p-3 text-slate-400 font-mono text-xs text-left">
                      {idx + 1}
                    </td>

                    {/* Left-aligned staff number */}
                    <td className="p-3 text-slate-800 font-mono text-xs truncate max-w-[110px] text-left">
                      {l.staffNumber}
                    </td>

                    {/* left aligned full name */}
                    <td className="p-3 text-slate-800 font-medium truncate max-w-[200px] text-left">
                      {l.fullName}
                    </td>

                    {/* Left-aligned unit count */}
                    <td className="p-3 text-slate-500 text-left font-medium">
                      {unitCount}
                    </td>

                    {/* Left-aligned status wrapper */}
                    <td className="p-3 text-left">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${
                          hasUnits
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {hasUnits ? "Assigned" : "Not Assigned"}
                      </span>
                    </td>

                    {/* Left-aligned action button */}
                    <td className="p-3 text-left">
                      <button
                        onClick={() => openProfile(l)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition font-medium whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLecturers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No lecturers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lecturer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Add Lecturer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <input
                placeholder="Staff Number *"
                value={form.staffNumber}
                onChange={(e) =>
                  setForm({ ...form, staffNumber: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Full Name *"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Email (Optional)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <input
                placeholder="Phone (Optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
                >
                  Create Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-3xl mx-auto mb-3 text-white">
                ✉
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Lecturer Credentials
              </h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-800 font-medium">
                  {credentials.fullName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-emerald-600 font-mono">
                  {credentials.email || "Not Set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="text-emerald-600 font-mono font-bold">
                  {credentials.password}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => copyCreds(credentials)}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition text-sm font-medium text-white"
              >
                Copy
              </button>
              <button
                onClick={() => setCredentials(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-sm text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-3xl mx-auto mb-3 text-white">
                📤
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Share Credentials
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Share login details with the lecturer
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-800 font-medium">
                  {shareTarget.fullName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-emerald-600 font-mono">
                  {shareTarget.email || "Not Set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="text-emerald-600 font-mono font-bold">
                  {shareTarget.password || "Use existing password"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  copyCreds(shareTarget);
                  setShareTarget(null);
                }}
                className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition text-sm font-medium text-white flex flex-col items-center gap-1"
              >
                <span className="text-xl">📋</span>
                Copy
              </button>
              <button
                onClick={() => {
                  shareViaWhatsApp(shareTarget);
                  setShareTarget(null);
                }}
                className="py-3 rounded-xl bg-green-600 hover:bg-green-500 transition text-sm font-medium text-white flex flex-col items-center gap-1"
              >
                <span className="text-xl">💬</span>
                WhatsApp
              </button>
              <button
                onClick={() => {
                  shareViaEmail(shareTarget);
                  setShareTarget(null);
                }}
                className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium text-white flex flex-col items-center gap-1"
              >
                <span className="text-xl">✉️</span>
                Email
              </button>
            </div>
            <button
              onClick={() => setShareTarget(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {manageTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                {manageTarget.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold">
                  {manageTarget.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {manageTarget.staffNumber}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setEditing(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition text-sm font-medium flex items-center gap-3"
              >
                ✎ Edit Details
              </button>
              <button
                onClick={() => {
                  setShareTarget(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition text-sm font-medium flex items-center gap-3"
              >
                📤 Share Credentials
              </button>

              <button
                onClick={() => {
                  setManageTarget(null);
                  openAssignModal(manageTarget);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition text-sm font-medium flex items-center gap-3"
              >
                📋 Assign/Unassign Units
              </button>
              <button
                onClick={() => {
                  toggleStatus(manageTarget);
                  setManageTarget(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm font-medium flex items-center gap-3 ${
                  manageTarget.status === "ACTIVE"
                    ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                }`}
              >
                {manageTarget.status === "ACTIVE"
                  ? "⊘ Deactivate"
                  : "✓ Activate"}
              </button>
              <div className="border-t border-slate-100 my-2" />
              <button
                onClick={() => {
                  setDeleteTarget(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition text-sm font-medium flex items-center gap-3"
              >
                🗑 Remove Lecturer
              </button>
            </div>
            <button
              onClick={() => setManageTarget(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                  {profileTarget.fullName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {profileTarget.fullName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {profileTarget.email || "No email"} •{" "}
                    {profileTarget.staffNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManageTarget(profileTarget)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition"
                >
                  Manage
                </button>
                <button
                  onClick={() => {
                    setProfileTarget(null);
                    setTracking(null);
                    setShowPrograms(false);
                    setSelectedProgram(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-slate-800">
                    {profileTarget.phone || "Not Provided"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Units</p>
                  <p className="text-xl font-bold text-slate-800">
                    {tracking?.lecturer?.units?.length || 0}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      tracking?.lecturer?.units?.length > 0
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {tracking?.lecturer?.units?.length > 0
                      ? "Units Assigned"
                      : "Not Assigned"}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Programs</p>
                  <button
                    onClick={() => setShowPrograms(!showPrograms)}
                    className="text-xl font-bold text-emerald-600 hover:text-emerald-500 transition"
                  >
                    {
                      getProgramsFromUnits(tracking?.lecturer?.units || [])
                        .length
                    }
                  </button>
                </div>
              </div>

              {/* Programs & Units Section */}
              {showPrograms && (
                <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Programs Teaching
                    </h4>
                  </div>
                  <div className="p-4">
                    {getProgramsFromUnits(tracking?.lecturer?.units || [])
                      .length > 0 ? (
                      <div className="space-y-4">
                        {getProgramsFromUnits(
                          tracking?.lecturer?.units || [],
                        ).map((pg: any, idx: number) => (
                          <div key={idx}>
                            <button
                              onClick={() =>
                                setSelectedProgram(
                                  selectedProgram?.key === pg.key ? null : pg,
                                )
                              }
                              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition group"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                📚 {pg.program.name} {pg.studyYear?.name || ""}{" "}
                                {pg.semester?.name || ""}
                              </span>
                              <span className="text-emerald-600 group-hover:translate-x-1 transition">
                                {selectedProgram?.key === pg.key ? "▼" : "→"}
                              </span>
                            </button>
                            {selectedProgram?.key === pg.key && (
                              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 ml-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                  Units
                                </p>
                                <div className="space-y-1">
                                  {pg.units.map((u: any) => (
                                    <div
                                      key={u.id}
                                      className="flex items-center gap-2 text-sm text-slate-700"
                                    >
                                      <span className="font-mono text-emerald-600">
                                        {u.code}
                                      </span>
                                      <span>—</span>
                                      <span>{u.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No programs assigned (no units assigned)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Units Section */}
              {assignedUnits.length > 0 && (
                <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                        {assignedUnits.length}
                      </span>
                      Assigned Units
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {assignedUnits.map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                        >
                          <div>
                            <span className="text-sm font-medium text-slate-700">
                              {a.unit.name}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              {a.unit.code}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {a.unit.program?.name} • {a.unit.studyYear?.name} •{" "}
                            {a.unit.semester?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Breakdown */}
              {tracking?.unitStats?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Unit Breakdown
                  </h4>
                  <div className="space-y-2">
                    {tracking.unitStats.map((u: any) => (
                      <div
                        key={u.unitId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <span className="text-sm text-slate-700 font-medium">
                          {u.unitName}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500">
                            {u.sessions} sessions
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {u.avgRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-64">
                {tracking?.sessions?.length > 0 ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#94a3b8" },
                        },
                        y: {
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#94a3b8" },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No session data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Edit Lecturer
            </h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <input
                value={editing.staffNumber}
                onChange={(e) =>
                  setEditing({ ...editing, staffNumber: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <input
                value={editing.fullName}
                onChange={(e) =>
                  setEditing({ ...editing, fullName: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <input
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                placeholder="Email (Optional)"
              />
              <input
                value={editing.phone || ""}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                placeholder="Phone (Optional)"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-600 mb-2">
              Remove Lecturer?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Permanently delete{" "}
              <span className="text-slate-800 font-medium">
                {deleteTarget.fullName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-medium hover:bg-rose-500 transition text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Units Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Manage Units
                </h3>
                <p className="text-sm text-slate-500">{assignModal.fullName}</p>
              </div>
              <button
                onClick={() => {
                  setAssignModal(null);
                  setSelectedUnits([]);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Assigned Units */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                    {assignedUnits.length}
                  </span>
                  Assigned Units
                </h4>
                {assignedUnits.length === 0 ? (
                  <p className="text-sm text-slate-400">No units assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {assignedUnits.map((a: any) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {a.unit.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {a.unit.code} • {a.unit.program?.name}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleUnassignUnit(assignModal.id, a.unitId)
                          }
                          className="text-rose-500 hover:text-rose-700 text-sm px-2 py-1 rounded hover:bg-rose-50 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Units */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                    {availableUnits.length}
                  </span>
                  Available Units
                </h4>
                {loadingUnits ? (
                  <p className="text-sm text-slate-400">Loading...</p>
                ) : availableUnits.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No available units to assign
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {availableUnits.map((unit: any) => (
                      <label
                        key={unit.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition cursor-pointer ${
                          selectedUnits.includes(unit.id)
                            ? "bg-indigo-50 border-indigo-300"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUnits([...selectedUnits, unit.id]);
                            } else {
                              setSelectedUnits(
                                selectedUnits.filter((id) => id !== unit.id),
                              );
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {unit.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {unit.code} • {unit.program?.name} •{" "}
                            {unit.studyYear?.name} • {unit.semester?.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => {
                  setAssignModal(null);
                  setSelectedUnits([]);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
              >
                Close
              </button>
              <button
                onClick={handleAssignUnits}
                disabled={selectedUnits.length === 0 || loadingUnits}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition text-white disabled:opacity-50"
              >
                Assign {selectedUnits.length} Unit(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lecturers;
