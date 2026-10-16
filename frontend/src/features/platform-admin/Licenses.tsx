import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";


const Licenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: "SUBSCRIPTION",
    expiryDate: "",
  });

  const [actionLicense, setActionLicense] = useState<any>(null);

  const [showActionModal, setShowActionModal] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // FETCH LICENSES
  // =========================================================

  const fetchLicenses = async () => {
    try {
      const res = await api.get("/licenses");

      setLicenses(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load licenses");
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
  try {
    await navigator.clipboard.writeText(text);
    if (id) {
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 1200);
    }
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Failed to copy");
  }
};

  // =========================================================
  // FETCH STATS
  // =========================================================

  const fetchStats = async () => {
    try {
      const res = await api.get("/licenses/stats");

      setStats(res.data.data);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to load license statistics",
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchLicenses();
    fetchStats();
  }, []);

  // =========================================================
  // DISPLAY-ONLY LICENSE FORMATTING
  // =========================================================
  //
  // Actual database code:
  //
  // 1VG6B3QMPWWVZF3L
  //
  // Display:
  //
  // SUAMP-1VG6-B3QM-PWWV-ZF3L
  //
  // NOTHING IS CHANGED IN THE DATABASE.
  // =========================================================

  const formatLicenseCode = (code: string) => {
    if (!code) return "-";

    const cleanCode = code
      .toUpperCase()
      .replace(/^SUAMP-/, "")
      .replace(/-/g, "");

    const groups = cleanCode.match(/.{1,4}/g) || [];

    return `SUAMP-${groups.join("-")}`;
  };

  // =========================================================
  // GENERATE LICENSE
  // =========================================================

  const generateLicense = async () => {
    setLoading(true);

    try {
      await api.post("/licenses", {
        type: form.type,

        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      });

      toast.success("License generated successfully!");

      setShowModal(false);

      setForm({
        type: "SUBSCRIPTION",
        expiryDate: "",
      });

      await fetchLicenses();
      await fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate license");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // STATUS COLORS
  // =========================================================

  const getStatusColor = (license: any) => {
    switch (license.status) {
      case "UNUSED":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";

      case "USED":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

      case "SUSPENDED":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";

      case "REVOKED":
        return "text-red-400 bg-red-500/10 border-red-500/20";

      case "EXPIRED":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";

      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  // =========================================================
  // OPEN ACTION WINDOW
  // =========================================================

  const openActionMenu = (license: any) => {
    setActionLicense(license);
    setShowActionModal(true);
  };

  // =========================================================
  // CLOSE ACTION WINDOW
  // =========================================================

  const closeActionMenu = () => {
    if (actionLoading) return;

    setActionLicense(null);
    setShowActionModal(false);
  };

  // =========================================================
  // REVOKE
  // =========================================================

  const revokeLicense = async () => {
    if (!actionLicense) return;

    const confirmed = window.confirm(
      `Are you sure you want to revoke this license?\n\n${formatLicenseCode(
        actionLicense.code,
      )}`,
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      await api.patch(`/licenses/${actionLicense.id}/revoke`);

      toast.success("License revoked successfully.");

      closeActionMenu();

      await fetchLicenses();
      await fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke license.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // REINSTATE
  // =========================================================

  const reinstateLicense = async () => {
    if (!actionLicense) return;

    setActionLoading(true);

    try {
      await api.patch(`/licenses/${actionLicense.id}/reinstate`);

      toast.success(
        actionLicense.universityId
          ? "License reinstated to USED status."
          : "License reinstated to UNUSED status.",
      );

      closeActionMenu();

      await fetchLicenses();
      await fetchStats();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to reinstate license.",
      );
    } finally {
      setActionLoading(false);
    }
  };

    const shareLicensePdf = (license: any) => {
    const formatted = formatLicenseCode(license.code);
    const institution = license.university?.name || "Institution";
    const expiry = license.expiryDate
      ? new Date(license.expiryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const subject = `SAMPHE License Code — ${institution}`;

    const body = [
      `SAMPHE — Smart Attendance Management Platform for Higher Education`,
      `──────────────────────────────────────────────`,
      ``,
      `OFFICIAL LICENSE DETAILS`,
      ``,
      `License Type : ${license.type}`,
      `Institution  : ${institution}`,
      `Generated On : ${new Date(license.createdAt).toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "short", year: "numeric" },
      )}`,
      `Expires On   : ${expiry}`,
      ``,
      `──────────────────────────────────────────────`,
      `LICENSE CODE`,
      ``,
      `   ${formatted}`,
      ``,
      `──────────────────────────────────────────────`,
      ``,
      `This license is password protected.`,
      `The PDF password is available from the SAMPHE platform admin.`,
      ``,
      `Please find the official PDF certificate attached.`,
      ``,
      `© ${new Date().getFullYear()} SAMPHE`,
    ].join("\n");

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const downloadLicensePdf = async (license: any) => {
    try {
      const res = await api.get(`/licenses/${license.id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAMPHE-License-${license.code
        .substring(0, 3)
        .toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to download PDF",
      );
    }
  };

  // =========================================================
  // REMOVE
  // =========================================================


  const removeLicense = async () => {
    if (!actionLicense) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently remove this license?\n\n${formatLicenseCode(
        actionLicense.code,
      )}`,
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      await api.delete(`/licenses/${actionLicense.id}`);

      toast.success("License removed successfully.");

      closeActionMenu();

      await fetchLicenses();
      await fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove license.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // ACTIONS BASED ON CURRENT STATUS
  // =========================================================

  const getAvailableActions = (license: any) => {
    if (!license) return [];

    switch (license.status) {
      // -----------------------------------------------------
      // UNUSED
      // -----------------------------------------------------

      case "UNUSED":
        return [
          {
            label: "Revoke",
            description: "Permanently revoke this license.",
            action: revokeLicense,
            className: "text-red-400 hover:bg-red-500/10",
          },

          {
            label: "Remove",
            description: "Permanently remove this license.",
            action: removeLicense,
            className: "text-gray-400 hover:bg-white/5",
          },
        ];

      // -----------------------------------------------------
      // USED
      // -----------------------------------------------------

      case "USED":
        return [
          {
            label: "Revoke",
            description: "Permanently revoke this license.",
            action: revokeLicense,
            className: "text-red-400 hover:bg-red-500/10",
          },
          {
            label: "Remove",
            description: "Permanently remove this license.",
            action: removeLicense,
            className: "text-gray-400 hover:bg-white/5",
          },
        ];

      // -----------------------------------------------------
      // REVOKED
      // -----------------------------------------------------

      case "REVOKED":
        return [
          {
            label: "Reinstate",
            description: actionLicense?.universityId
              ? "Return this license to USED status."
              : "Return this license to UNUSED status.",
            action: reinstateLicense,
            className: "text-emerald-400 hover:bg-emerald-500/10",
          },

          {
            label: "Remove",
            description: "Permanently remove this license.",
            action: removeLicense,
            className: "text-gray-400 hover:bg-white/5",
          },
        ];

      // -----------------------------------------------------
      // EXPIRED
      // -----------------------------------------------------

      case "EXPIRED":
        return [
          {
            label: "Remove",
            description: "Permanently remove this license.",
            action: removeLicense,
            className: "text-gray-400 hover:bg-white/5",
          },
        ];

      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>

          <p className="text-gray-500 mt-1">
            Manage platform licenses for all institutions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-medium text-sm hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-500/20"
        >
          + Generate License
        </button>
      </div>

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total Licenses</p>

          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
        </div>

        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Unused</p>

          <p className="text-3xl font-bold text-blue-400">
            {stats?.unused || 0}
          </p>
        </div>

        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Used</p>

          <p className="text-3xl font-bold text-emerald-400">
            {stats?.used || 0}
          </p>
        </div>

        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Expired</p>

          <p className="text-3xl font-bold text-rose-400">
            {stats?.expired || 0}
          </p>
        </div>
      </div>

      {/* ===================================================== LICENSE TABLE ====================================================== */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-5 font-medium w-[5%]">S/N</th>
              <th className="text-left px-4 py-5 font-medium w-[22%]">
                License Code
              </th>
              <th className="text-left px-4 py-5 font-medium w-[11%]">Type</th>
              <th className="text-left px-4 py-5 font-medium w-[13%]">
                Status
              </th>
              <th className="text-left px-4 py-5 font-medium w-[31%]">
                Institution
              </th>
              <th className="text-left px-4 py-5 font-medium w-[18%]">
                Generated/Expiry
              </th>
              <th className="text-center px-4 py-5 font-medium w-[10%]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license: any, index: number) => (
              <tr
                key={license.id}
                className="border-b border-white/[0.02] hover:bg-white/[0.02] transition"
              >
                {/* S/N */}
                <td className="px-4 py-4 text-gray-500 text-xs font-medium">
                  {index + 1}
                </td>

                {/* LICENSE CODE */}
                <td className="px-4 py-4 font-mono text-[11px] text-violet-400 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(formatLicenseCode(license.code), license.id)
                      }
                      title="Copy license code"
                      className="p-1 rounded hover:bg-white/10 transition text-violet-400"
                    >
                      {copyingId === license.id ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    <span>{formatLicenseCode(license.code)}</span>
                  </div>
                </td>

                {/* TYPE */}
                <td className="px-4 py-4 text-gray-400 text-xs">
                  {license.type}
                </td>

                {/* STATUS */}
                <td className="px-4 py-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(
                      license,
                    )}`}
                  >
                    {license.effectiveStatus || license.status}
                  </span>
                </td>

                {/* INSTITUTION */}
                <td className="px-4 py-4 text-gray-400 truncate">
                  {license.university?.name || "-"}
                </td>

                {/* GENERATED / EXPIRY */}
                <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                  {license.createdAt
                    ? new Date(license.createdAt).toLocaleDateString("en-GB")
                    : "-"}
                  {" - "}
                  {license.expiryDate
                    ? new Date(license.expiryDate).toLocaleDateString("en-GB")
                    : "Never"}
                </td>

                {/* ACTION */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => openActionMenu(license)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition"
                    title="License actions"
                  >
                    <span className="text-lg leading-none">⋮</span>
                  </button>
                </td>
              </tr>
            ))}
            {licenses.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-600">
                  No licenses generated yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          GENERATE LICENSE MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">Generate New License</h2>

            <p className="text-sm text-gray-500 mb-6">
              A unique 16-character code will be created
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                  License Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                >
                  <option value="SUBSCRIPTION">Subscription</option>

                  <option value="PERPETUAL">Perpetual</option>

                  <option value="TRIAL">Trial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Expiry Date (optional)
                </label>

                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiryDate: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={generateLicense}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition text-sm font-medium shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate License"}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

      {/* =====================================================
          ACTION MODAL
      ====================================================== */}

      {showActionModal && actionLicense && 
      createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-7 w-full max-w-lg shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  License Actions
                </h2>

                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {formatLicenseCode(actionLicense.code)}
                </p>
              </div>

              <button
                onClick={closeActionMenu}
                disabled={actionLoading}
                className="text-gray-500 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {/* CURRENT STATUS */}

            <div className="mb-5">
              <span className="text-xs text-gray-500">Current Status</span>

              <div className="mt-2">
                <span
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${getStatusColor(
                    actionLicense,
                  )}`}
                >
                  {actionLicense.status}
                </span>
              </div>
            </div>

            {/* PDF PASSWORD */}
            <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">PDF Password</p>
                  <p className="text-sm font-mono text-emerald-400 mt-1">
                    {actionLicense.pdfPassword || "—"}
                  </p>
                </div>
                {actionLicense.pdfPassword && (
                  <button
                    onClick={() =>
                      copyToClipboard(
                        actionLicense.pdfPassword!,
                        actionLicense.id + "-pw",
                      )
                    }
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                    title="Copy password"
                  >
                    {copyingId === actionLicense.id + "-pw" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-400"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ACTIONS */}

            <div className="space-y-2">
              {getAvailableActions(actionLicense).map(
                (item: any, index: number) => (
                  <button
                    key={index}
                    onClick={item.action}
                    disabled={actionLoading}
                    className={`w-full text-left px-4 py-3 rounded-xl transition border border-white/5 ${item.className} disabled:opacity-50`}
                  >
                    <div className="font-semibold text-sm">{item.label}</div>

                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  </button>
                ),
              )}
            </div>

            {/* SHARE + DOWNLOAD */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/5">
              <button
                onClick={() => shareLicensePdf(actionLicense)}
                className="py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Share
              </button>

              <button
                onClick={() => downloadLicensePdf(actionLicense)}
                className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>

            {/* CANCEL */}

            <button
              onClick={closeActionMenu}
              disabled={actionLoading}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition"
            >
              Cancel
            </button>
          </div>
         </div>,
          document.body,
        )}
    </div>
  );
};

export default Licenses;
