import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useTerminology } from "../../hooks/useTerminology";
import { pluralize } from "../../utils/terminology";
import { useAuth } from "../../context/AuthContext";
import { createPortal } from "react-dom";

const Programmes = () => {
  const terms = useTerminology();
  const { user } = useAuth();
  const usesLevel = (user?.institutionType || "UNIVERSITY") !== "UNIVERSITY";
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [showCount, setShowCount] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    duration: 4,
    level: "" as number | "",
  });
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetch = () =>
    api.get("/hod/programs").then((r) => setProgrammes(r.data.data || []));
  useEffect(() => {
    fetch();
  }, []);

  const programTemplate = usesLevel
    ? {
        headers: [`${terms.program} Name`, "Code", "Duration", "KNQF Level"],
        samples: [
          ["Diploma in ICT", "DICT", "3", "5"],
          ["Craft in Plumbing", "CPLM", "2", "4"],
        ],
      }
    : {
        headers: [`${terms.program} Name`, "Code", "Duration"],
        samples: [
          ["Bachelor of Science in Nursing", "BSN", "4"],
          ["Bachelor of Commerce", "BCOM", "4"],
        ],
      };

  const downloadTemplate = () => {
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      programTemplate.headers.map(escape).join(","),
      ...programTemplate.samples.map((row) => row.map(escape).join(",")),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${terms.program}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/hod/programs/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });

      const payload = res.data?.data ?? res.data;
      setImportResult(payload);
      fetch();
    } catch (err: any) {
      setImportResult({
        created: 0,
        skipped: 0,
        failed: 0,
        errors: [
          err.response?.data?.message || err.message || "Import failed",
        ],
      });
    } finally {
      setImporting(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hod/programs", {
        ...form,
        level: form.level === "" ? null : form.level,
      });
      toast.success(`${terms.program} added`);
      setForm({ name: "", code: "", duration: 4, level: "" });
      setShowAddModal(false);
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/hod/programs/${editing.id}`, {
        ...editing,
        level: editing.level === "" || editing.level === undefined ? null : editing.level,
      });
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const ids = filtered.map((p: any) => p.id);
    setSelectedIds(ids.length === selectedIds.length ? [] : ids);
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0 || bulkDeleting) return;
    setBulkDeleting(true);

    try {
      const res = await api.post("/hod/programs/bulk-delete", {
        programIds: selectedIds,
      });

      const { deleted, failed, failedNames } = res.data.data;

      setBulkDeleting(false);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      fetch();

      toast.success(
        failed === 0
          ? `✓ Deleted ${deleted}`
          : `Deleted ${deleted}, Failed ${failed} (in use)${failedNames?.length ? ` — ${failedNames.slice(0, 3).join(", ")}${failedNames.length > 3 ? "…" : ""}` : ""}`,
        { duration: failed === 0 ? 5000 : 8000 },
      );
    } catch (err: any) {
      setBulkDeleting(false);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {pluralize(terms.program)}
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all academic {pluralize(terms.program).toLowerCase()} in
            your department
          </p>
        </div>
      </div>

      {/* Stats + Search - Side by Side */}
      <div className="flex items-center gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
          <p className="text-xs text-slate-500">
            Total {pluralize(terms.program)}
          </p>          <p className="text-xl font-bold text-emerald-600">
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
            onClick={() => {}}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex items-center justify-end gap-3">
        {selectedIds.length > 0 && (
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-100 transition"
          >
            🗑 Delete {selectedIds.length} selected
          </button>
        )}
        <button
          onClick={() => setImportOpen(true)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
        >
          Import
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition text-white shadow-lg shadow-emerald-500/20"
        >
         + Add {terms.program}
        </button>
      </div>

      {/* View More / View Less - Top Right, above the table */}
      {filtered.length > 10 && (
        <div className="flex justify-end -mt-2">
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

      {/* Programs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                <th className="text-left p-3 font-medium w-12">S/N</th>
                <th className="text-left p-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === filtered.length
                    }
                    onChange={selectAll}
                  />
                </th>
                <th className="text-left p-3 font-medium w-28">Code</th>
                <th className="text-left p-3 font-medium w-64">
                  {terms.program} Name
                </th>
                {usesLevel && (
                  <th className="text-left p-3 font-medium w-20">Level</th>
                )}
                <th className="text-left p-3 font-medium w-28">Actions</th>
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
                  <td className="p-3 text-slate-400 font-mono text-xs text-left">
                    {idx + 1}
                  </td>

                  <td className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>

                  <td className="p-3 text-slate-500 font-mono text-xs text-left">
                    {p.code || "-"}
                  </td>

                  <td className="p-3 text-slate-800 font-medium text-left truncate max-w-[256px]">
                    {p.name}
                  </td>

                  {usesLevel && (
                    <td className="p-3 text-slate-500 text-xs text-left">
                      {p.level ? `L${p.level}` : "—"}
                    </td>
                  )}

                  {/* Left-aligned actions buttons */}
                  <td className="p-3 text-left">
                    <div className="flex items-center justify-left gap-2">
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
                  <td
                    colSpan={usesLevel ? 6 : 5}
                    className="p-12 text-center text-slate-400"
                  >
                    No {pluralize(terms.program).toLowerCase()} found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Programme Modal */}
      {showAddModal && 
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Add {terms.program}
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
                placeholder={`${terms.program} Name *`}
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
              {usesLevel && (
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      level: e.target.value
                        ? parseInt(e.target.value)
                        : ("" as any),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">KNQF Level (optional)</option>
                  <option value="3">Level 3 — Artisan Certificate</option>
                  <option value="4">Level 4 — Craft Certificate</option>
                  <option value="5">Level 5 — Diploma</option>
                  <option value="6">Level 6 — Higher Diploma</option>
                </select>
              )}
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
                 Add {terms.program}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body,
        )}

      {/* Edit Modal */}
      {editing && 
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
               Edit {terms.program}
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
              {usesLevel && (
                <select
                  value={editing.level || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      level: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">KNQF Level (optional)</option>
                  <option value="3">Level 3 — Artisan Certificate</option>
                  <option value="4">Level 4 — Craft Certificate</option>
                  <option value="5">Level 5 — Diploma</option>
                  <option value="6">Level 6 — Higher Diploma</option>
                </select>
              )}
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
         </div>,
          document.body,
        )}

      {/* Delete Modal */}
      {deleteTarget && 
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-600 mb-2">
              Remove {terms.program}?
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
        </div>,
          document.body,
        )}

      {/* Import Modal */}
      {importOpen &&
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Bulk Import {pluralize(terms.program)}
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportResult(null);
                  setImporting(false);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Upload Excel (.xlsx) or CSV. Columns:{" "}
              <span className="font-medium text-slate-700">
                {programTemplate.headers.join(", ")}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mb-4"
            >
              📋 See Template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFile}
              disabled={importing}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
            />

            {importing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Importing… this may take a few seconds
              </div>
            )}

            {importResult && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1 text-sm">
                <p className="text-emerald-600 font-medium">
                  ✓ Created: {importResult.created ?? 0}
                </p>
                <p className="text-amber-600 font-medium">
                  ◈ Skipped: {importResult.skipped ?? 0}
                </p>
                <p className="text-rose-600 font-medium">
                  ✕ Failed: {importResult.failed ?? 0}
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
        </div>,
        document.body,
      )}

      {/* Template Preview Modal */}
      {templateOpen &&
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {terms.program} Import Template
              </h3>
              <button
                onClick={() => setTemplateOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Use these exact column headers. Sample rows below are examples
              only.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    {programTemplate.headers.map((h) => (
                      <th
                        key={h}
                        className="text-left p-2 font-semibold text-slate-700 border-b border-slate-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programTemplate.samples.map((row, i) => (
                    <tr key={i} className="text-slate-400 italic">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 border-b border-slate-100">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3 leading-snug">
              ⚠ The rows shown in grey are samples. Replace them with your real
              data, or delete them entirely.
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setTemplateOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
              >
                Close
              </button>
              <button
                onClick={downloadTemplate}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
              >
                ⬇ Download CSV
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteOpen &&
      createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-rose-600 mb-2">
              Delete {selectedIds.length} {pluralize(terms.program)}?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone.{" "}
              {pluralize(terms.program)} that are in use (have units or
              students) will not be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteOpen(false)}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-medium hover:bg-rose-500 transition text-white disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default Programmes;
