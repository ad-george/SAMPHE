import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Programmes = () => {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [showCount, setShowCount] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", code: "", duration: 4 });
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetch = () =>
    api.get("/hod/programs").then((r) => setProgrammes(r.data.data || []));
  useEffect(() => {
    fetch();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hod/programs", form);
      toast.success("Program added");
      setForm({ name: "", code: "", duration: 4 });
      setShowAddModal(false);
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/hod/programs/${editing.id}`, editing);
      toast.success("Updated");
      setEditing(null);
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/hod/programs/${deleteTarget.id}`);
      toast.success("Deleted");
      setDeleteTarget(null);
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filtered = programmes.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayed = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            📚 Programmes
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all academic programs in your department
          </p>
        </div>
      </div>

      {/* Stats + Search - Side by Side */}
      <div className="flex items-center gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
          <p className="text-xs text-slate-500">Total Programmes</p>
          <p className="text-xl font-bold text-emerald-600">
            {programmes.length}
          </p>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
          <input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none placeholder-slate-400"
          />
          <button
            onClick={() => {}} // Already filters on change, but for explicit search
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white shadow-lg shadow-emerald-500/20"
        >
          + Add Programme
        </button>
        {hasMore && (
          <button
            onClick={() =>
              setShowCount(showCount === 10 ? filtered.length : 10)
            }
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            {showCount === 10
              ? `View More (${filtered.length - 10} more)`
              : "View Less"}
          </button>
        )}
      </div>

      {/* Programmes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                {/* All headers changed to text-center */}
                <th className="text-center p-3 font-medium w-12">S/N</th>

                {/* Explicitly defined width added to stop expansion */}
                <th className="text-center p-3 font-medium w-64">
                  Programme Name
                </th>

                <th className="text-center p-3 font-medium w-28">Code</th>
                <th className="text-center p-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* Centered serial number */}
                  <td className="p-3 text-slate-400 font-mono text-xs text-center">
                    {idx + 1}
                  </td>

                  {/* Centered name column with tighter width restrictions */}
                  <td className="p-3 text-slate-800 font-medium text-center truncate max-w-[256px]">
                    {p.name}
                  </td>

                  {/* Centered code column */}
                  <td className="p-3 text-slate-500 font-mono text-xs text-center">
                    {p.code || "-"}
                  </td>

                  {/* Centered actions buttons */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditing(p)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    No programmes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Programme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Add Programme
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <input
                placeholder="Programme Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Code (optional)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />

              <input
                type="number"
                placeholder="Duration (years) *"
                value={form.duration || 4}
                onChange={(e) =>
                  setForm({ ...form, duration: parseInt(e.target.value) || 4 })
                }
                min={1}
                max={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <div className="flex gap-3 pt-2"></div>
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
                  Add Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Edit Programme
            </h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <input
                value={editing.code || ""}
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                placeholder="Code (optional)"
              />

              <input
                type="number"
                placeholder="Duration (years)"
                value={editing.duration || 4}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    duration: parseInt(e.target.value) || 4,
                  })
                }
                min={1}
                max={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
              <div className="flex gap-3"></div>
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

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-600 mb-2">
              Remove Programme?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Delete{" "}
              <span className="text-slate-800 font-medium">
                {deleteTarget.name}
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
    </div>
  );
};

export default Programmes;
