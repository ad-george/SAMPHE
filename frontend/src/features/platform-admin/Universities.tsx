import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const PlatformAdminUniversities = () => {
  const [universities, setUniversities] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showAllInstitutions, setShowAllInstitutions] = useState(false);

  const fetch = () => {
    api.get("/platform-admin/universities").then((res) => {
      setUniversities(res.data.data);
      setFiltered(res.data.data);
    });
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    let result = universities;
    if (search) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (filterCategory !== "ALL") {
      result = result.filter(
        (u) => (u.category || "UNIVERSITY") === filterCategory,
      );
    }

    if (filterType !== "ALL") {
      result = result.filter((u) => {
        const licenseType = u.licenses?.[0]?.type;

        return licenseType === filterType;
      });
    }
    if (filterStatus !== "ALL") {
      result = result.filter((u) => u.status === filterStatus);
    }
    setFiltered(result);
  }, [search, filterCategory, filterType, filterStatus, universities]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.patch(`/platform-admin/universities/${id}/status`, {
        status: next,
      });

      toast.success(`University ${next.toLowerCase()}`);

      setSelectedUniversity((prev: any) =>
        prev ? { ...prev, status: next } : prev,
      );

      fetch();
    } catch {
      toast.error("Failed to update status");
    }
  };
  const removeUniversity = async () => {
    if (!selectedUniversity) return;

    setRemoving(true);

    try {
      await api.delete(`/platform-admin/universities/${selectedUniversity.id}`);

      toast.success("University removed successfully");

      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedUniversity(null);

      fetch();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to remove university",
      );
    } finally {
      setRemoving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SUSPENDED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institutions</h1>
          <p className="text-gray-500 mt-1">
            Manage all tenant institutions on the platform
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {filtered.length} institutions
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-[#13131f] border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="ALL" className="bg-[#1a1a2e] text-white">
            All Categories
          </option>
          <option value="UNIVERSITY" className="bg-[#1a1a2e] text-white">
            University
          </option>
          <option value="POLYTECHNIC" className="bg-[#1a1a2e] text-white">
            Polytechnic
          </option>
          <option value="COLLEGE" className="bg-[#1a1a2e] text-white">
            College
          </option>
          <option value="TVET" className="bg-[#1a1a2e] text-white">
            TVET
          </option>
          <option value="INSTITUTE" className="bg-[#1a1a2e] text-white">
            Institute
          </option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="ALL" className="bg-[#1a1a2e] text-white">
            All Types
          </option>
          <option value="SUBSCRIPTION" className="bg-[#1a1a2e] text-white">
            Subscription
          </option>
          <option value="PERPETUAL" className="bg-[#1a1a2e] text-white">
            Perpetual
          </option>
          <option value="TRIAL" className="bg-[#1a1a2e] text-white">
            Trial
          </option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="ALL" className="bg-[#1a1a2e] text-white">
            All Status
          </option>
          <option value="ACTIVE" className="bg-[#1a1a2e] text-white">
            Active
          </option>
          <option value="SUSPENDED" className="bg-[#1a1a2e] text-white">
            Suspended
          </option>
          <option value="PENDING" className="bg-[#1a1a2e] text-white">
            Pending
          </option>
        </select>

        {/* View More / View Less */}
        <button
          type="button"
          onClick={() => setShowAllInstitutions((prev) => !prev)}
          className="ml-auto whitespace-nowrap px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-600/30 transition"
        >
          {showAllInstitutions ? "View Less" : "View More"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
              {/* Added S/N Header */}
              <th className="text-left pl-5 pr-1 py-5 font-medium w-12">S/N</th>
              <th className="text-left p-5 font-medium">Category</th>
              <th className="text-left p-5 font-medium">Institution</th>
              <th className="text-left p-5 font-medium">Status</th>
              <th className="text-left p-5 font-medium">License Type</th>
              <th className="text-left p-5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, showAllInstitutions ? filtered.length : 10).map(
              (
                u: any,
                index: number, // 1. Added index parameter here
              ) => (
                <tr
                  key={u.id}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition"
                >
                  {/* 2. Added S/N Row Cell */}
                  <td className="pl-5 pr-1 py-5 text-gray-500 font-mono text-xs">
                    {index + 1}
                  </td>

                  <td className="p-5">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                      {u.category || "UNIVERSITY"}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg font-bold">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">
                          {u.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(u.status)}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                      {u.licenses?.[0]?.type ||
                        u.admins?.[0]?.licenseType ||
                        "SUBSCRIPTION"}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUniversity(u);
                          setShowDetailModal(true);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition border border-violet-500/20"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}

            {filtered.length === 0 && (
              <tr>
                {/* 3. Updated colSpan to 6 to account for the new column */}
                <td colSpan={6} className="p-12 text-center text-gray-600">
                  No institutions found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUniversity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 14l6.16-3.422A12.042 12.042 0 0112 21a12.042 12.042 0 01-6.16-10.422L12 14z"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">SUAMP</h2>

                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                    {selectedUniversity.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Institution Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Category:</span>{" "}
                    {selectedUniversity.category || "UNIVERSITY"}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    {selectedUniversity.email || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span>{" "}
                    {selectedUniversity.phone || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Address:</span>{" "}
                    {selectedUniversity.address || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Website:</span>{" "}
                    {selectedUniversity.website || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span>{" "}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(selectedUniversity.status)}`}
                    >
                      {selectedUniversity.status}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  License Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Type:</span>{" "}
                    {selectedUniversity.licenses?.[0]?.type ||
                      selectedUniversity.licenseType ||
                      "SUBSCRIPTION"}
                  </p>
                  <p>
                    <span className="text-gray-500">License Code:</span>{" "}
                    <span className="font-mono text-violet-400">
                      {selectedUniversity.licenses?.[0]?.code ||
                        selectedUniversity.licenseCode ||
                        "N/A"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span>{" "}
                    {selectedUniversity.licenses?.[0]?.status ||
                      selectedUniversity.licenseStatus ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Start Date:</span>{" "}
                    {selectedUniversity.licenses?.[0]?.startDate
                      ? new Date(
                          selectedUniversity.licenses[0].startDate,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Expiry Date:</span>{" "}
                    {selectedUniversity.licenses?.[0]?.expiryDate
                      ? new Date(
                          selectedUniversity.licenses[0].expiryDate,
                        ).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-violet-400">
                  {selectedUniversity._count?.faculties || 0}
                </p>
                <p className="text-xs text-gray-500">Faculties</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-emerald-400">
                  {selectedUniversity._count?.departments || 0}
                </p>
                <p className="text-xs text-gray-500">Departments</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-blue-400">
                  {selectedUniversity._count?.programmes || 0}
                </p>
                <p className="text-xs text-gray-500">Programmes</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-amber-400">
                  {selectedUniversity._count?.students || 0}
                </p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
              {/* Suspend / Activate Button */}
              <button
                onClick={() =>
                  toggleStatus(selectedUniversity.id, selectedUniversity.status)
                }
                className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                  selectedUniversity.status === "ACTIVE"
                    ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                }`}
              >
                {selectedUniversity.status === "ACTIVE"
                  ? "Suspend"
                  : "Activate"}
              </button>

              {/* Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-1 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition font-medium"
              >
                Share
              </button>

              {/* Remove Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition font-medium"
              >
                Remove
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Close
              </button>

              {/* Remove Confirmation Modal */}
              {showDeleteConfirm && selectedUniversity && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                  <div className="bg-[#13131f] border border-rose-500/20 rounded-2xl p-7 w-full max-w-md shadow-2xl">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl mb-5">
                      ⚠
                    </div>

                    <h2 className="text-xl font-bold mb-2">
                      Remove Institution?
                    </h2>

                    <p className="text-sm text-gray-400 leading-relaxed">
                      You are about to permanently remove{" "}
                      <span className="text-white font-medium">
                        {selectedUniversity.name}
                      </span>{" "}
                      from SUAMP.
                    </p>

                    <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                      This will remove the institution and its associated
                      institutional data from the system. Its license will be
                      released and returned to{" "}
                      <span className="text-blue-400">UNUSED</span>. The license
                      expiry date will remain unchanged.
                    </p>

                    <div className="flex gap-3 mt-7">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={removing}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={removeUniversity}
                        disabled={removing}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 transition text-white font-medium"
                      >
                        {removing ? "Removing..." : "Yes, Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedUniversity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-7 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Share Institution</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedUniversity.name}
                </p>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Choose how you would like to share the institution information.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  toast("PDF download will be connected next.");
                }}
                className="w-full py-3 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/20 transition font-medium"
              >
                ↓ Download PDF
              </button>

              <button
                onClick={() => {
                  toast("Email sharing will be connected next.");
                }}
                className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 transition font-medium"
              >
                ✉ Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminUniversities;
