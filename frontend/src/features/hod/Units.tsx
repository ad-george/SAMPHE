import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Units = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [studyYears, setStudyYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    programId: "",
    studyYearId: "",
    semesterId: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUnits();
    api.get("/hod/programs").then((r) => setPrograms(r.data.data || []));
    api.get("/hod/study-years").then((r) => setStudyYears(r.data.data || []));
    api.get("/hod/semesters").then((r) => setSemesters(r.data.data || []));
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await api.get("/hod/units");
      setUnits(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/hod/units/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data.data);
      toast.success(
        `Created: ${res.data.data.created}, Skipped: ${res.data.data.skipped}, Failed: ${res.data.data.failed}`,
      );
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Import failed");
    }
  };

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hod/units", form);
      toast.success("Unit added");
      setAddOpen(false);
      setForm({
        code: "",
        name: "",
        programId: "",
        studyYearId: "",
        semesterId: "",
      });
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/hod/units/${editing.id}`, editing);
      toast.success("Updated");
      setEditOpen(false);
      setEditing(null);
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/hod/units/${deleteTarget.id}`);
      toast.success("Deleted");
      setDeleteTarget(null);
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filtered = units.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayed = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            📚 Units
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all units in your department
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Import
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white shadow-lg shadow-emerald-500/20"
          >
            + Add Unit
          </button>
        </div>
      </div>

      {/* Stats + Search Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
          <p className="text-xs text-slate-500">Total Units</p>
          <p className="text-xl font-bold text-emerald-600">{units.length}</p>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm min-w-[200px]">
          <input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none placeholder-slate-400"
          />
          <button
            onClick={() => {}}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* View More / View Less - Above Table, Right Aligned */}
      {hasMore && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              setShowCount(showCount === 10 ? filtered.length : 10)
            }
            className="text-sm text-emerald-600 hover:text-emerald-700 transition font-medium"
          >
            {showCount === 10
              ? `View More (${filtered.length - 10} more)`
              : "View Less"}
          </button>
        </div>
      )}

      {/* Units Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                {/* All header alignments updated to text-center */}
                <th className="text-center p-3 font-medium w-12">S/N</th>
                <th className="text-center p-3 font-medium w-24">Code</th>
                <th className="text-center p-3 font-medium w-64">Unit Name</th>
                <th className="text-center p-3 font-medium w-48">Program</th>
                <th className="text-center p-3 font-medium w-20">Year</th>
                <th className="text-center p-3 font-medium w-24">Semester</th>
                <th className="text-center p-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((u: any, i: number) => (
                <tr
                  key={u.id}
                  className={`border-b border-slate-100 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* Centered serial number */}
                  <td className="p-3 text-slate-400 font-mono text-xs text-center">
                    {i + 1}
                  </td>

                  {/* Centered unit code */}
                  <td className="p-3 text-emerald-600 font-mono text-xs font-medium text-center">
                    {u.code}
                  </td>

                  {/* Centered unit name with truncation boundaries */}
                  <td className="p-3 text-slate-800 font-medium text-center truncate max-w-[200px]">
                    {u.name}
                  </td>

                  {/* Centered program name */}
                  <td className="p-3 text-slate-500 text-xs text-center truncate max-w-[150px]">
                    {u.program?.name}
                  </td>

                  {/* Centered academic year */}
                  <td className="p-3 text-slate-500 text-xs text-center">
                    {u.studyYear?.name}
                  </td>

                  {/* Centered academic semester */}
                  <td className="p-3 text-slate-500 text-xs text-center">
                    {u.semester?.name}
                  </td>

                  {/* Centered action button clusters */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(u);
                          setEditOpen(true);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
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
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No units found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Bulk Import Units
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload Excel (.xlsx) or CSV. Columns:{" "}
              <span className="font-medium text-slate-700">
                S/N, unitCode, unitName, program, studyYear, semester
              </span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {importResult && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1 text-sm">
                <p className="text-emerald-600 font-medium">
                  ✓ Created: {importResult.created}
                </p>
                <p className="text-amber-600 font-medium">
                  ◈ Skipped: {importResult.skipped}
                </p>
                <p className="text-rose-600 font-medium">
                  ✕ Failed: {importResult.failed}
                </p>
                {importResult.errors?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs text-rose-500 mt-2 space-y-1">
                    {importResult.errors
                      .slice(0, 10)
                      .map((e: string, i: number) => (
                        <p key={i}>• {e}</p>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add Unit</h3>
              <button
                onClick={() => setAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={addUnit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Unit Code *"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
                <input
                  placeholder="Unit Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={form.programId}
                  onChange={(e) =>
                    setForm({ ...form, programId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Program *</option>
                  {programs.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.studyYearId}
                  onChange={(e) =>
                    setForm({ ...form, studyYearId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Year *</option>
                  {studyYears.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.semesterId}
                  onChange={(e) =>
                    setForm({ ...form, semesterId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Semester *</option>
                  {semesters.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Edit Unit</h3>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Unit Code *"
                  value={editing.code}
                  onChange={(e) =>
                    setEditing({ ...editing, code: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
                <input
                  placeholder="Unit Name *"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={editing.programId}
                  onChange={(e) =>
                    setEditing({ ...editing, programId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Program *</option>
                  {programs.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={editing.studyYearId}
                  onChange={(e) =>
                    setEditing({ ...editing, studyYearId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Year *</option>
                  {studyYears.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                <select
                  value={editing.semesterId}
                  onChange={(e) =>
                    setEditing({ ...editing, semesterId: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  required
                >
                  <option value="">Semester *</option>
                  {semesters.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditing(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-600 mb-2">
              Remove Unit?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Permanently delete{" "}
              <span className="text-slate-800 font-medium">
                {deleteTarget.name} ({deleteTarget.code})
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

export default Units;
