import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Faculties = () => {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [deanName, setDeanName] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);

  const fetchFaculties = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api
      .get(`/university-admin/faculties${params}`)
      .then((r) => setFaculties(r.data.data || []));
  };

  const fetchStats = () => {
    api
      .get("/university-admin/faculties/stats")
      .then((r) => setStats(r.data.data));
  };

  useEffect(() => {
    fetchFaculties();
    fetchStats();
  }, [search]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/university-admin/faculties", {
        name,
        deanName: deanName || undefined,
      });
      toast.success("Faculty created");
      setName("");
      setDeanName("");
      fetchFaculties();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/university-admin/faculties/${editing.id}`, {
        name: editing.name,
        deanName: editing.deanName || undefined,
      });
      toast.success("Updated");
      setEditing(null);
      fetchFaculties();
      fetchStats();
    } catch (err: any) {
      toast.error("Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this faculty?")) return;
    try {
      await api.delete(`/university-admin/faculties/${id}`);
      toast.success("Deleted");
      if (viewing?.id === id) setViewing(null);
      fetchFaculties();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white tracking-tight">
        Faculties
      </h1>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Faculties</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats?.totalFaculties || 0}
          </p>
        </div>
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-500 mb-1">Total Departments</p>
          <p className="text-3xl font-bold text-cyan-400">
            {stats?.totalDepartments || 0}
          </p>
        </div>
      </div>

      {/* Add Faculty Form */}
      <form
        onSubmit={create}
        className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          placeholder="Faculty Name (e.g. Faculty of Science)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
          required
        />
        <input
          placeholder="Dean Name (Optional)"
          value={deanName}
          onChange={(e) => setDeanName(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
        >
          Add Faculty
        </button>
      </form>

      {/* Search */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-4">
        <input
          placeholder="Search by faculty name or dean name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
        />
      </div>

      {/* Faculties Table */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left p-5 font-medium">S/N</th>
              <th className="text-left p-5 font-medium">Faculty Name</th>
              <th className="text-left p-5 font-medium">Dean</th>
              <th className="text-left p-5 font-medium">Departments</th>
              <th className="text-left p-5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculties.map((f, idx) => (
              <tr
                key={f.id}
                className="border-b border-slate-800/50 hover:bg-white/[0.02] transition"
              >
                <td className="p-5 text-slate-400 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="p-5 text-white font-medium">{f.name}</td>
                <td className="p-5 text-slate-400">{f.deanName || "—"}</td>
                <td className="p-5 text-slate-400">
                  {f._count?.departments || 0}
                </td>
                <td className="p-5 space-x-3">
                  <button
                    onClick={() => setViewing(f)}
                    className="text-blue-400 hover:text-blue-300 text-xs transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditing(f)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(f.id)}
                    className="text-rose-400 hover:text-rose-300 text-xs transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {faculties.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-slate-500 text-sm"
                >
                  No faculties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal - Landscape */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{viewing.name}</h2>
              <button
                onClick={() => setViewing(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Faculty Name
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewing.name}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Dean
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewing.deanName || "Not Assigned"}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Total Departments
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {viewing._count?.departments || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Faculty ID
                  </p>
                  <p className="text-sm font-mono text-slate-300 mt-1">
                    {viewing.id}
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

            {/* Departments List */}
            {viewing.departments && viewing.departments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Departments under this Faculty
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewing.departments.map((d: any) => (
                    <span
                      key={d.id}
                      className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300 border border-slate-700"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition text-white"
              >
                Edit Faculty
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this faculty?")) {
                    remove(viewing.id);
                    setViewing(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium transition text-white"
              >
                Delete Faculty
              </button>
              <button
                onClick={() => setViewing(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition text-slate-300"
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
            <h3 className="text-lg font-bold text-white mb-4">Edit Faculty</h3>
            <form onSubmit={update} className="space-y-4">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <input
                placeholder="Dean Name (Optional)"
                value={editing.deanName || ""}
                onChange={(e) =>
                  setEditing({ ...editing, deanName: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
              />
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

export default Faculties;
