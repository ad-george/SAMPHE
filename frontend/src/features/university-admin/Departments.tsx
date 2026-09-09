import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Departments = () => {
  const [depts, setDepts] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const fetchDepartments = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api
      .get(`/university-admin/departments${params}`)
      .then((r) => setDepts(r.data.data || []));
  };

  const fetchStats = () => {
    api
      .get("/university-admin/departments/stats")
      .then((r) => setStats(r.data.data));
  };

  const fetchFaculties = () => {
    api
      .get("/university-admin/faculties")
      .then((r) => setFaculties(r.data.data || []));
  };

  useEffect(() => {
    fetchDepartments();
    fetchStats();
    fetchFaculties();
  }, [search]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/university-admin/departments", { name, facultyId });
      toast.success("Department created");
      setName("");
      setFacultyId("");
      fetchDepartments();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/university-admin/departments/${editing.id}`, {
        name: editing.name,
        facultyId: editing.facultyId,
      });
      toast.success("Updated");
      setEditing(null);
      fetchDepartments();
      fetchStats();
    } catch {
      toast.error("Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try {
      await api.delete(`/university-admin/departments/${id}`);
      toast.success("Deleted");
      if (viewing?.id === id) setViewing(null);
      fetchDepartments();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const viewDepartment = async (id: string) => {
    setViewingLoading(true);
    try {
      const res = await api.get(`/university-admin/departments/${id}`);
      setViewing(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load department details");
    } finally {
      setViewingLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white tracking-tight">
        Departments
      </h1>

      {/* Stats Cards*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Departments</p>
          <p className="text-3xl font-bold text-cyan-400">
            {stats?.totalDepartments || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Programmes</p>
          <p className="text-3xl font-bold text-emerald-400">
            {stats?.totalProgrammes || 0}
          </p>
        </div>
      </div>

      {/* Add Department Form */}
      <form
        onSubmit={create}
        className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          placeholder="Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
          required
        />
        <select
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
          required
        >
          <option value="">Select Faculty</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
        >
          Add Department
        </button>
      </form>

      {/* Search */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-4">
        <input
          placeholder="Search by department name, faculty, or HOD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
      </div>

      {/* Departments Table */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left p-5 font-medium">S/N</th>
              <th className="text-left p-5 font-medium">Department Name</th>
              <th className="text-left p-5 font-medium">Faculty</th>
              <th className="text-left p-5 font-medium">Programmes</th>
              <th className="text-left p-5 font-medium">HOD</th>
              <th className="text-left p-5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d, idx) => (
              <tr
                key={d.id}
                className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
              >
                <td className="p-5 text-slate-400 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="p-5 text-white font-semibold">{d.name}</td>
                <td className="p-5 text-slate-400">{d.faculty?.name || "-"}</td>
                <td className="p-5 text-slate-400">
                  {d._count?.programmes || 0}
                </td>
                <td className="p-5 text-slate-400">
                  {d.hods?.length > 0 ? (
                    d.hods.map((h: any) => h.fullName).join(", ")
                  ) : (
                    <span className="text-slate-500 text-xs">Not Assigned</span>
                  )}
                </td>
                <td className="p-5 space-x-3">
                  <button
                    onClick={() => viewDepartment(d.id)}
                    className="text-blue-400 hover:text-blue-300 text-xs transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditing(d)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(d.id)}
                    className="text-rose-400 hover:text-rose-300 text-xs transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {depts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-slate-500 text-sm"
                >
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal - Landscape */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {viewingLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {viewing.name}
                  </h2>
                  <button
                    onClick={() => setViewing(null)}
                    className="text-slate-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Department Name
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {viewing.name}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Faculty
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {viewing.faculty?.name || "Not Assigned"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Head of Department (HOD)
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {viewing.hods?.length > 0 ? (
                          viewing.hods.map((h: any) => h.fullName).join(", ")
                        ) : (
                          <span className="text-slate-400 text-sm">
                            Not Assigned
                          </span>
                        )}
                      </p>
                      {viewing.hods?.length > 0 && viewing.hods[0]?.email && (
                        <p className="text-xs text-slate-500 mt-1">
                          {viewing.hods[0].email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Department ID
                      </p>
                      <p className="text-sm font-mono text-slate-300 mt-1">
                        {viewing.id}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Total Programmes
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {viewing._count?.programmes || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Created
                      </p>
                      <p className="text-sm text-slate-300 mt-1">
                        {new Date(viewing.createdAt).toLocaleDateString()} at{" "}
                        {new Date(viewing.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Last Updated
                      </p>
                      <p className="text-sm text-slate-300 mt-1">
                        {new Date(viewing.updatedAt).toLocaleDateString()} at{" "}
                        {new Date(viewing.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Programmes List */}
                {viewing.programmes && viewing.programmes.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Programmes ({viewing.programmes.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewing.programmes.map((p: any) => (
                        <span
                          key={p.id}
                          className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300 border border-slate-700"
                        >
                          {p.code} - {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                      <p className="text-2xl font-bold text-cyan-400">
                        {viewing._count?.programmes || 0}
                      </p>
                      <p className="text-xs text-slate-500">Programmes</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                      <p className="text-2xl font-bold text-emerald-400">
                        {viewing._count?.lecturers || 0}
                      </p>
                      <p className="text-xs text-slate-500">Lecturers</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                      <p className="text-2xl font-bold text-amber-400">
                        {viewing._count?.students || 0}
                      </p>
                      <p className="text-xs text-slate-500">Students</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700">
                      <p className="text-2xl font-bold text-violet-400">
                        {viewing._count?.units || 0}
                      </p>
                      <p className="text-xs text-slate-500">Units</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => {
                      setEditing(viewing);
                      setViewing(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition text-white"
                  >
                    Edit Department
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this department?")) {
                        remove(viewing.id);
                        setViewing(null);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium transition text-white"
                  >
                    Delete Department
                  </button>
                  <button
                    onClick={() => setViewing(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              Edit Department
            </h3>
            <form onSubmit={update} className="space-y-4">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <select
                value={editing.facultyId || ""}
                onChange={(e) =>
                  setEditing({ ...editing, facultyId: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              >
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
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
    </div>
  );
};

export default Departments;
