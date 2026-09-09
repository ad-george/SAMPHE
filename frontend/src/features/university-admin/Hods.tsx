import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Hods = () => {
  const [hods, setHods] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({
    staffNumber: "",
    fullName: "",
    email: "",
    phone: "",
    departmentId: "",
  });
  const [credentials, setCredentials] = useState<any>(null);
  const [generatedPass, setGeneratedPass] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [shareTarget, setShareTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [manageTarget, setManageTarget] = useState<any>(null);
  const [viewTarget, setViewTarget] = useState<any>(null);
  const [showCount, setShowCount] = useState(10);

  const fetchData = () => {
    api.get("/university-admin/hods").then((r) => setHods(r.data.data || []));
    api
      .get("/university-admin/departments")
      .then((r) => setDepts(r.data.data || []));
    api.get("/university-admin/hods/stats").then((r) => setStats(r.data.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generatePass = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++)
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = generatePass();
    try {
      await api.post("/university-admin/hods", {
        ...form,
        password: pass,
        departmentId: form.departmentId || null,
      });
      toast.success("HOD created");
      setGeneratedPass(pass);
      setCredentials({ ...form, password: pass });
      setForm({
        staffNumber: "",
        fullName: "",
        email: "",
        phone: "",
        departmentId: "",
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const toggleStatus = async (hod: any) => {
    const next = hod.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/university-admin/hods/${hod.id}`, { status: next });
      toast.success(`HOD ${next === "ACTIVE" ? "activated" : "deactivated"}`);
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/university-admin/hods/${deleteTarget.id}`);
      toast.success("HOD removed");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const openShare = (hod: any) => {
    const pass = generatePass();
    setShareTarget({ ...hod, password: pass });
  };

  const getDepartmentName = (target: any) => {
    return (
      depts.find((d) => d.id === target.departmentId)?.name ||
      target.department?.name ||
      "Not Assigned"
    );
  };

  const shareViaWhatsApp = (target: any) => {
    const deptName = getDepartmentName(target);
    const message = `🔐 *SUAMP Login Credentials*\n\n*Name:* ${target.fullName}\n*Email:* ${target.email || "Not Set"}\n*Password:* ${target.password || "Use existing password"}\n*Department:* ${deptName}\n\nLogin at: ${window.location.origin}/login/hod`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const shareViaEmail = (target: any) => {
    const deptName = getDepartmentName(target);
    const subject = encodeURIComponent("SUAMP Login Credentials");
    const body = encodeURIComponent(
      `🔐 SUAMP HOD/COD Login Credentials\n\nName: ${target.fullName}\nEmail: ${target.email || "Not Set"}\nPassword: ${target.password || "Use existing password"}\nDepartment: ${deptName}\n\nLogin at: ${window.location.origin}/login/hod`,
    );
    window.open(
      `mailto:${target.email || ""}?subject=${subject}&body=${body}`,
      "_blank",
    );
  };

  const copyCreds = (target: any) => {
    const deptName = getDepartmentName(target);
    const text = `🔐 SUAMP HOD/COD Login Credentials\n\nName: ${target.fullName}\nEmail: ${target.email || "Not Set"}\nPassword: ${target.password || "Use existing password"}\nDepartment: ${deptName}\n\nLogin at: ${window.location.origin}/login/hod`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadCreds = (target: any) => {
    const deptName = getDepartmentName(target);
    const content = `🔐 SUAMP HOD/COD Login Credentials\n\nName: ${target.fullName}\nEmail: ${target.email || "Not Set"}\nPassword: ${target.password || "Use existing password"}\nDepartment: ${deptName}\n\nLogin at: ${window.location.origin}/login/hod`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${target.fullName.replace(/\s+/g, "_")}_credentials.txt`;
    a.click();
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/university-admin/hods/${editing.id}`, {
        ...editing,
        departmentId: editing.departmentId || null,
      });
      toast.success("HOD updated");
      setEditing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const displayedHods = hods.slice(0, showCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">
        Heads of Department
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total HODs</p>
          <p className="text-3xl font-bold text-cyan-400">
            {stats?.total || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Assigned to Departments</p>
          <p className="text-3xl font-bold text-emerald-400">
            {stats?.assigned || 0}
          </p>
        </div>
      </div>

      {/* Add HOD Form */}
      <form
        onSubmit={create}
        className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          placeholder="Staff Number *"
          value={form.staffNumber}
          onChange={(e) => setForm({ ...form, staffNumber: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
          required
        />
        <input
          placeholder="Full Name *"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
          required
        />
        <input
          placeholder="Email (Optional)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
        <select
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
        >
          <option value="">Select Department (Optional)</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Phone (Optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
        <button
          type="submit"
          className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 py-2.5"
        >
          Create HOD & Generate Credentials
        </button>
      </form>

      {/* HODs Table */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left p-5 font-medium">S/N</th>
              <th className="text-left p-5 font-medium">Staff No</th>
              <th className="text-left p-5 font-medium">Name</th>
              <th className="text-left p-5 font-medium">Department</th>
              <th className="text-left p-5 font-medium">Status</th>
              <th className="text-left p-5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedHods.map((h, idx) => (
              <tr
                key={h.id}
                className={`border-b border-slate-800/50 hover:bg-white/[0.02] transition ${h.status !== "ACTIVE" ? "opacity-60" : ""}`}
              >
                <td className="p-5 text-slate-400 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="p-5 text-white font-mono text-xs">
                  {h.staffNumber}
                </td>
                <td className="p-5 text-white font-medium">{h.fullName}</td>
                <td className="p-5">
                  {h.department?.name ? (
                    <span className="text-emerald-400">
                      {h.department.name}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Not Assigned</span>
                  )}
                </td>
                <td className="p-5">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${h.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}
                  >
                    {h.status}
                  </span>
                </td>
                <td className="p-5 space-x-2">
                  <button
                    onClick={() => setViewTarget(h)}
                    className="text-blue-400 hover:text-blue-300 text-xs transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setManageTarget(h)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs transition"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {hods.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-slate-500 text-sm"
                >
                  No HODs found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* View More / View Less */}
        {hods.length > 10 && (
          <div className="p-4 border-t border-slate-800 text-center">
            <button
              onClick={() => setShowCount(showCount === 10 ? hods.length : 10)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition font-medium"
            >
              {showCount === 10
                ? `View More (${hods.length - 10} more)`
                : "View Less"}
            </button>
          </div>
        )}
      </div>

      {/* View Modal with Share Button */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {viewTarget.fullName}
              </h2>
              <button
                onClick={() => setViewTarget(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Full Name
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewTarget.fullName}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Staff Number
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewTarget.staffNumber}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewTarget.email || "Not Provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewTarget.phone || "Not Provided"}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Department
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewTarget.department?.name || "Not Assigned"}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Status
                  </p>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full inline-block mt-1 ${viewTarget.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                  >
                    {viewTarget.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700 flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setEditing(viewTarget);
                  setViewTarget(null);
                }}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition text-white"
              >
                Edit HOD
              </button>
              <button
                onClick={() => {
                  openShare(viewTarget);
                  setViewTarget(null);
                }}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition text-white"
              >
                Share
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(viewTarget);
                  setViewTarget(null);
                }}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium transition text-white"
              >
                Delete HOD
              </button>
              <button
                onClick={() => setViewTarget(null)}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-emerald-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl mx-auto mb-3">
                📤
              </div>
              <h3 className="text-xl font-bold text-white">
                Share Credentials
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Share login details with the HOD
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 space-y-3 border border-slate-800 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="text-white font-medium">
                  {shareTarget.fullName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-cyan-400 font-mono">
                  {shareTarget.email || "Not Set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {shareTarget.password || "••••••••"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Department</span>
                <span className="text-white">
                  {getDepartmentName(shareTarget)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Login Link</span>
                <span className="text-blue-400 font-mono text-xs break-all">
                  {window.location.origin}/login/hod
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => copyCreds(shareTarget)}
                className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition text-sm font-medium flex flex-col items-center gap-1"
              >
                <span className="text-xl">📋</span>
                Copy
              </button>
              <button
                onClick={() => shareViaWhatsApp(shareTarget)}
                className="py-3 rounded-xl bg-green-600 hover:bg-green-500 transition text-sm font-medium flex flex-col items-center gap-1"
              >
                <span className="text-xl">💬</span>
                WhatsApp
              </button>
              <button
                onClick={() => shareViaEmail(shareTarget)}
                className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium flex flex-col items-center gap-1"
              >
                <span className="text-xl">✉️</span>
                Email
              </button>
            </div>

            <button
              onClick={() => {
                setShareTarget(null);
              }}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Success / Credentials Modal */}
      {credentials && !shareTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-cyan-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl mx-auto mb-3">
                ✉
              </div>
              <h3 className="text-xl font-bold text-white">HOD Credentials</h3>
              <p className="text-sm text-slate-500 mt-1">
                Share these details securely with the HOD
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-3 border border-slate-800 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="text-white font-medium">
                  {credentials.fullName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-cyan-400 font-mono">
                  {credentials.email || "Not Set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {credentials.password || "••••••••"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Department</span>
                <span className="text-white">
                  {depts.find((d) => d.id === credentials.departmentId)?.name ||
                    "Not Assigned"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => copyCreds(credentials)}
                className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition text-sm font-medium"
              >
                Copy
              </button>
              <button
                onClick={() => downloadCreds(credentials)}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setShareTarget(credentials);
                  setCredentials(null);
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition text-sm font-medium"
              >
                Share
              </button>
              <button
                onClick={() => {
                  setCredentials(null);
                }}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Edit HOD</h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <input
                value={editing.staffNumber}
                onChange={(e) =>
                  setEditing({ ...editing, staffNumber: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <input
                value={editing.fullName}
                onChange={(e) =>
                  setEditing({ ...editing, fullName: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <input
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="Email (Optional)"
              />
              <input
                value={editing.phone || ""}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="Phone (Optional)"
              />
              <select
                value={editing.departmentId || ""}
                onChange={(e) =>
                  setEditing({ ...editing, departmentId: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
              >
                <option value="">Select Department (Optional)</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-sm font-medium hover:bg-cyan-500 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Warning */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 mb-2">
              Remove HOD?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete{" "}
              <span className="text-white font-medium">
                {deleteTarget.fullName}
              </span>{" "}
              from the system. Department attendance records will remain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-medium hover:bg-rose-500 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {manageTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-slate-600">
                {manageTarget.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {manageTarget.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {manageTarget.staffNumber} •{" "}
                  {manageTarget.department?.name || "Unassigned"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setViewTarget(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition text-sm font-medium flex items-center gap-3"
              >
                <span>👁</span> View Details
              </button>
              <button
                onClick={() => {
                  setEditing(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-sm font-medium flex items-center gap-3"
              >
                <span>✎</span> Edit Details
              </button>
              <button
                onClick={() => {
                  toggleStatus(manageTarget);
                  setManageTarget(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm font-medium flex items-center gap-3 ${manageTarget.status === "ACTIVE" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}
              >
                <span>{manageTarget.status === "ACTIVE" ? "⊘" : "✓"}</span>{" "}
                {manageTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => {
                  openShare(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition text-sm font-medium flex items-center gap-3"
              >
                <span>📤</span> Share Credentials
              </button>
              <div className="border-t border-slate-800 my-2" />
              <button
                onClick={() => {
                  setDeleteTarget(manageTarget);
                  setManageTarget(null);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition text-sm font-medium flex items-center gap-3"
              >
                <span>🗑</span> Remove HOD
              </button>
            </div>
            <button
              onClick={() => setManageTarget(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hods;
