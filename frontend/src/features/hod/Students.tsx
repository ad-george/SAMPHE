import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [archived, setArchived] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [studyYears, setStudyYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [view, setView] = useState<"active" | "archived">("active");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [filters, setFilters] = useState({
    programId: "",
    studyYearId: "",
    semesterId: "",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [promoteModal, setPromoteModal] = useState<
    "selected_semester" | "selected_year" | "all_semester" | "all_year" | null
  >(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveUntil, setArchiveUntil] = useState("");
  const [importResult, setImportResult] = useState<any>(null);

  const [importedPreview, setImportedPreview] = useState<any[]>([]);
  const [showAllImported, setShowAllImported] = useState(false);

  const [form, setForm] = useState({
    regNo: "",
    fullName: "",
    email: "",
    phone: "",
    programId: "",
    studyYearId: "",
    semesterId: "",
    password: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
    fetchArchived();
    api.get("/hod/programs").then((r) => setPrograms(r.data.data || []));
    api.get("/hod/study-years").then((r) => setStudyYears(r.data.data || []));
    api.get("/hod/semesters").then((r) => setSemesters(r.data.data || []));
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.programId) params.append("programId", filters.programId);
      if (filters.studyYearId)
        params.append("studyYearId", filters.studyYearId);
      if (filters.semesterId) params.append("semesterId", filters.semesterId);
      const res = await api.get(`/hod/students?${params}`);
      setStudents(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchived = async () => {
    const res = await api.get("/hod/students/archived");
    setArchived(res.data.data || []);
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/hod/students/promotion-history");
      setHistoryData(res.data.data || []);
      setShowHistory(true);
    } catch {
      toast.error("Failed to fetch history");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const ids = filtered.map((s: any) => s.id);
    setSelectedIds(ids.length === selectedIds.length ? [] : ids);
  };

  const filtered = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.regNo?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayedData =
    view === "active" ? filtered.slice(0, showCount) : archived;
  const hasMore = view === "active" && filtered.length > showCount;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/hod/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const payload = res.data?.data ?? res.data;
      setImportResult(payload);
      const newlyImported = payload?.importedStudents || [];
      setImportedPreview((prev) => [...prev, ...newlyImported]);
      setShowAllImported(false);
      toast.success(
        `Created: ${payload?.created ?? 0}, Skipped: ${payload?.skipped ?? 0}, Failed: ${payload?.failed ?? 0}`,
      );
      fetchStudents();
      fetchArchived();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Import failed");
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hod/students", form);
      toast.success("Student added");
      setAddOpen(false);
      setForm({
        regNo: "",
        fullName: "",
        email: "",
        phone: "",
        programId: "",
        studyYearId: "",
        semesterId: "",
        password: "",
      });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const promote = async (
    type: "selected_semester" | "selected_year" | "all_semester" | "all_year",
  ) => {
    const isAll = type === "all_semester" || type === "all_year";
    const isSemester = type === "selected_semester" || type === "all_semester";

    if (!isAll && selectedIds.length === 0) {
      toast.error("Select students first");
      return;
    }

    const count = isAll ? filtered.length : selectedIds.length;
    if (
      !confirm(
        `Promote ${count} student(s) to ${isSemester ? "next semester" : "next study year"}?`,
      )
    )
      return;

    try {
      let endpoint = "";
      let payload: any = {};

      if (isAll) {
        endpoint = isSemester
          ? "/hod/students/promote-all-semester"
          : "/hod/students/promote-all-year";
        payload = { filters };
      } else {
        endpoint = isSemester
          ? "/hod/students/promote-semester"
          : "/hod/students/promote-year";
        payload = { studentIds: selectedIds };
      }

      const res = await api.post(endpoint, payload);
      toast.success(`Promoted ${res.data.data.promoted} students`);
      setPromoteModal(null);
      setSelectedIds([]);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const archive = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select students first");
      return;
    }
    try {
      for (const id of selectedIds) {
        await api.patch(`/hod/students/${id}/archive`, {
          archiveUntil: archiveUntil || undefined,
        });
      }
      toast.success("Archived");
      setArchiveModal(false);
      setSelectedIds([]);
      fetchStudents();
      fetchArchived();
    } catch {
      toast.error("Failed");
    }
  };

  const unarchive = async (id: string) => {
    try {
      await api.patch(`/hod/students/${id}/unarchive`);
      toast.success("Restored");
      fetchStudents();
      fetchArchived();
    } catch {
      toast.error("Failed");
    }
  };

  const permanentDelete = async (id: string) => {
    if (!confirm("PERMANENTLY delete this student and all attendance records?"))
      return;
    try {
      await api.delete(`/hod/students/${id}/permanent`);
      toast.success("Deleted");
      fetchArchived();
    } catch {
      toast.error("Failed");
    }
  };

  const data = view === "active" ? displayedData : archived;

  const sortedPreview = [...importedPreview].sort((a, b) =>
    (a.regNo || "").localeCompare(b.regNo || ""),
  );
  const previewToShow = showAllImported
    ? sortedPreview
    : sortedPreview.slice(0, 10);

  return (
    <div className="space-y-6 max-w-7.5xl mx-auto px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Students
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setView("active")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${view === "active" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Active
            </button>
            <button
              onClick={() => setView("archived")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${view === "archived" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <input
          placeholder="Search name or reg no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none placeholder-slate-400"
        />
        <select
          value={filters.programId}
          onChange={(e) =>
            setFilters({ ...filters, programId: e.target.value })
          }
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Programs</option>
          {programs.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filters.studyYearId}
          onChange={(e) =>
            setFilters({ ...filters, studyYearId: e.target.value })
          }
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Years</option>
          {studyYears.map((y: any) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
        <select
          value={filters.semesterId}
          onChange={(e) =>
            setFilters({ ...filters, semesterId: e.target.value })
          }
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Semesters</option>
          {semesters.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={fetchStudents}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition"
        >
          Apply
        </button>

        {view === "active" && (
          <>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setAddOpen(true)}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              + Add
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Import
            </button>

            {/* Promote Selected Dropdown */}
            <div className="relative group">
              <button
                disabled={selectedIds.length === 0}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition disabled:opacity-40"
              >
                Promote Selected ▼
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10">
                <button
                  onClick={() => setPromoteModal("selected_semester")}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  → To Semester
                </button>
                <button
                  onClick={() => setPromoteModal("selected_year")}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                >
                  → To Year
                </button>
              </div>
            </div>

            {/* Promote All Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition">
                Promote All ▼
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10">
                <button
                  onClick={() => setPromoteModal("all_semester")}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  → To Semester
                </button>
                <button
                  onClick={() => setPromoteModal("all_year")}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                >
                  → To Year
                </button>
              </div>
            </div>

            <button
              onClick={() => setArchiveModal(true)}
              disabled={selectedIds.length === 0}
              className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition disabled:opacity-40"
            >
              Archive
            </button>
            <button
              onClick={fetchHistory}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              📋 History
            </button>
          </>
        )}
      </div>

      {/* View More / View Less - Top Right */}
      {filtered.length > 10 && (
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

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50/50">
                <th className="text-left p-4 font-medium w-10">S/N</th>
                {view === "active" && (
                  <th className="text-left p-4 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filtered.length
                      }
                      onChange={selectAll}
                    />
                  </th>
                )}
                <th className="text-left p-4 font-medium">Reg No</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Program</th>
                <th className="text-left p-4 font-medium">Year</th>
                <th className="text-left p-4 font-medium">Semester</th>
                <th className="text-left p-4 font-medium">Email</th>
                {view === "archived" && (
                  <>
                    <th className="text-left p-4 font-medium">Archived</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((s: any, idx: number) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                >
                  <td className="p-4 text-slate-400 font-mono text-xs text-center">
                    {idx + 1}
                  </td>
                  {view === "active" && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                  )}
                  <td className="p-4 text-slate-600 font-mono text-xs">
                    {s.regNo}
                  </td>
                  <td className="p-4 text-slate-800 font-medium">
                    {s.fullName}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {s.program?.name}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {s.studyYear?.name}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {s.semester?.name}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{s.email}</td>
                  {view === "archived" && (
                    <>
                      <td className="p-4 text-slate-500 text-xs">
                        {s.archivedAt
                          ? new Date(s.archivedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => unarchive(s.id)}
                          className="text-xs px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => permanentDelete(s.id)}
                          className="text-xs px-3 py-1.5 rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={view === "archived" ? 9 : 8}
                    className="p-12 text-center text-slate-400"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote Modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Promote{" "}
              {promoteModal.includes("all")
                ? `All ${filtered.length}`
                : selectedIds.length}{" "}
              Student(s)
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              To{" "}
              {promoteModal.includes("semester")
                ? "Next Semester"
                : "Next Study Year"}
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPromoteModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => promote(promoteModal)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Promotion History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <th className="text-left p-3 font-medium">Reg No</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Program</th>
                    <th className="text-left p-3 font-medium">Year</th>
                    <th className="text-left p-3 font-medium">Semester</th>
                    <th className="text-left p-3 font-medium">Promoted</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="p-3 text-slate-600 font-mono text-xs">
                        {h.regNo}
                      </td>
                      <td className="p-3 text-slate-800">{h.fullName}</td>
                      <td className="p-3 text-slate-500">{h.program}</td>
                      <td className="p-3 text-slate-500">{h.studyYear}</td>
                      <td className="p-3 text-slate-500">{h.semester}</td>
                      <td className="p-3 text-slate-500 text-xs">
                        {new Date(h.promotedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-slate-400"
                      >
                        No promotion history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal - Existing */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Bulk Import Students
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportResult(null);
                  setImportedPreview([]);
                  setShowAllImported(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload Excel (.xlsx) or CSV. Columns:{" "}
              <span className="font-medium text-slate-700">
                regNo, fullName, email, program, studyYear, semester
              </span>
              . Optional: phone.
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

                {importedPreview.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">
                      Imported Preview ({importedPreview.length} total)
                    </p>
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium text-slate-600">
                              #
                            </th>
                            <th className="text-left p-2 font-medium text-slate-600">
                              Reg No
                            </th>
                            <th className="text-left p-2 font-medium text-slate-600">
                              Name
                            </th>
                            <th className="text-left p-2 font-medium text-slate-600">
                              Program
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewToShow.map((s: any, idx: number) => (
                            <tr
                              key={`${s.regNo}-${idx}`}
                              className="border-b border-slate-50 last:border-0"
                            >
                              <td className="p-2 text-slate-400">{idx + 1}</td>
                              <td className="p-2 font-mono text-slate-600">
                                {s.regNo}
                              </td>
                              <td className="p-2 text-slate-700">
                                {s.fullName}
                              </td>
                              <td className="p-2 text-slate-500">
                                {s.program}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importedPreview.length > 10 && (
                      <button
                        onClick={() => setShowAllImported(!showAllImported)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 font-medium"
                      >
                        {showAllImported
                          ? "← Show less"
                          : `View all ${importedPreview.length} →`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal - Existing */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Add Student
            </h3>
            <form onSubmit={addStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Reg No"
                  value={form.regNo}
                  onChange={(e) => setForm({ ...form, regNo: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
                <input
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  required
                />
                <input
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
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
                  <option value="">Program</option>
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
                  <option value="">Year</option>
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
                  <option value="">Semester</option>
                  {semesters.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                placeholder="Password (default: regNo)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
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
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal - Existing */}
      {archiveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Archive {selectedIds.length} Student(s)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Optional: set archive until date
            </p>
            <input
              type="date"
              value={archiveUntil}
              onChange={(e) => setArchiveUntil(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm hover:bg-slate-200 transition text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={archive}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-sm font-medium hover:bg-amber-500 transition text-white"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
