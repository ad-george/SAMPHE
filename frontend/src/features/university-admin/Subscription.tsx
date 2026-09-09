import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { userGuideHTML } from "../../utils/userGuide";

// Then in the onClick:
// guideWindow.document.write(userGuideHTML);

const Subscription = () => {
  const [license, setLicense] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // License Entry State
  const [licenseCode, setLicenseCode] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<any>(null);

  useEffect(() => {
    fetchLicense();
    fetchBillingHistory();
    fetchLicenseStatus();
  }, []);

  const fetchLicense = async () => {
    try {
      const res = await api.get("/university-admin/license");
      setLicense(res.data.data);
    } catch (err: any) {
      console.error("Failed to fetch license:", err);
    }
  };

  const fetchLicenseStatus = async () => {
    try {
      const res = await api.get("/university-admin/license/status");
      setLicenseStatus(res.data.data);
    } catch (err: any) {
      console.error("Failed to fetch license status:", err);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const res = await api.get("/university-admin/billing");
      setBillingHistory(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch billing history:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LICENSE ENTRY HANDLERS
  // ============================================================

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError("");
    setActivationSuccess(null);

    // Remove dashes to check length
    const rawCode = licenseCode.replace(/-/g, "");

    // Check length
    if (rawCode.length < 21) {
      setLicenseError(
        "License code is incomplete. Please enter all 21 characters.",
      );
      return;
    }

    if (rawCode.length > 21) {
      setLicenseError("Invalid license code.");
      return;
    }

    setActivating(true);

    try {
      const res = await api.post("/university-admin/license/activate", {
        code: licenseCode,
      });

      if (res.data.success) {
        setActivationSuccess(res.data.data);
        toast.success("License activated successfully!");
        // Refresh all data
        fetchLicense();
        fetchBillingHistory();
        fetchLicenseStatus();
        setLicenseCode("");
      }
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || "";
      const errorMessage = err.response?.data?.error || "";

      // Map backend error codes to user-friendly messages
      const errorMap: Record<string, string> = {
        INCOMPLETE:
          "License code is incomplete. Please enter all 21 characters.",
        INVALID: "Invalid license code.",
        EXPIRED: "License code has expired.",
        USED: "License code has already been used.",
        SUSPENDED: "This license has been suspended.",
        REVOKED: "This license has been revoked.",
      };

      setLicenseError(
        errorMap[backendMessage] ||
          errorMessage ||
          "Unable to activate license.",
      );
    } finally {
      setActivating(false);
    }
  };

  // ============================================================
  // OTHER HANDLERS
  // ============================================================

  const handleRequestNewLicense = async () => {
    if (
      !confirm(
        "A new license code will be requested from the Platform Administrator. Continue?",
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await api.post("/university-admin/license/request-new");
      toast.success(
        res.data.message || "License request sent to Platform Admin",
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request license");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertTrialToSubscription = async () => {
    if (!confirm("Upgrade to Subscription? Cost: KES 44,850/year. Continue?"))
      return;

    setActionLoading(true);
    try {
      const res = await api.post(
        "/university-admin/license/convert-to-subscription",
      );
      if (res.data.success) {
        toast.success("Successfully upgraded to Subscription!");
        fetchLicense();
        fetchBillingHistory();
        fetchLicenseStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertTrialToPerpetual = async () => {
    if (
      !confirm("Buy Perpetual license? Cost: KES 374,850 one-time. Continue?")
    )
      return;

    setActionLoading(true);
    try {
      const res = await api.post(
        "/university-admin/license/convert-to-perpetual",
      );
      if (res.data.success) {
        toast.success("Successfully upgraded to Perpetual!");
        fetchLicense();
        fetchBillingHistory();
        fetchLicenseStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeToPerpetual = async () => {
    if (
      !confirm(
        "Upgrade to Perpetual license? Cost: KES 374,850 one-time. Continue?",
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await api.post("/university-admin/license/upgrade");
      if (res.data.success) {
        toast.success("Successfully upgraded to Perpetual!");
        fetchLicense();
        fetchBillingHistory();
        fetchLicenseStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade");
    } finally {
      setActionLoading(false);
    }
  };

  const daysLeft = license?.expiryDate
    ? Math.ceil(
        (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
      )
    : null;

  const isExpired =
    license?.expiryDate && new Date(license.expiryDate) < new Date();
  const isPerpetual = license?.type === "PERPETUAL";
  const isTrial = license?.isTrial === true || license?.type === "TRIAL";
  const isRevoked = license?.status === "REVOKED";
  const isInGracePeriod = licenseStatus?.reason === "GRACE_PERIOD";
  const graceDaysLeft = licenseStatus?.daysLeft || 0;
  const isExpiringSoon = licenseStatus?.expiringSoon === true;
  const daysUntilExpiry = licenseStatus?.daysUntilExpiry || 0;

  // Determine if license entry card should be shown
  const showLicenseEntry = !license || isExpired || isRevoked || isTrial;

  const getLicenseTypeDisplay = () => {
    if (isPerpetual)
      return {
        label: "Perpetual",
        emoji: "∞",
        color: "text-emerald-400",
        bg: "emerald",
      };
    if (isTrial || license?.type === "TRIAL")
      return {
        label: "Trial",
        emoji: "🔬",
        color: "text-blue-400",
        bg: "blue",
      };
    return {
      label: "Subscription",
      emoji: "🔄",
      color: "text-cyan-400",
      bg: "cyan",
    };
  };

  const getStatusDisplay = () => {
    if (isPerpetual)
      return {
        label: "Active",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    if (isRevoked)
      return { label: "Revoked", color: "text-rose-400", bg: "bg-rose-500/10" };
    if (isExpired)
      return { label: "Expired", color: "text-rose-400", bg: "bg-rose-500/10" };
    if (isInGracePeriod)
      return {
        label: "Grace Period",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      };
    if (isExpiringSoon)
      return {
        label: "Expiring Soon",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      };
    return {
      label: "Active",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    };
  };

  const licenseType = getLicenseTypeDisplay();
  const statusDisplay = getStatusDisplay();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          🔑 Subscription & Licensing
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your institution's license and subscription
        </p>
      </div>

      {/* No License State */}
      {!license && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">
            No License Found
          </h2>
          <p className="text-slate-400 mb-4">
            Your institution does not have an active license.
          </p>
          <p className="text-sm text-slate-500">
            Enter a license code below or contact the Platform Administrator.
          </p>
        </div>
      )}

      {/* GRACE PERIOD WARNING */}
      {license && isInGracePeriod && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">
            License Revoked — Grace Period
          </h2>
          <p className="text-slate-300 mb-2">
            Your license has been revoked. You have{" "}
            <span className="text-amber-400 font-bold">
              {graceDaysLeft} days
            </span>{" "}
            of grace period remaining.
          </p>
          <p className="text-sm text-slate-400">
            Please enter a new license code or contact support.
          </p>
        </div>
      )}

      {/* EXPIRING SOON WARNING */}
      {license && isExpiringSoon && !isPerpetual && !isTrial && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-amber-400 font-medium">
                ⚠️ License Expires in {daysUntilExpiry} Days
              </p>
              <p className="text-xs text-slate-400">
                Request a new license now to avoid service interruption.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestNewLicense}
            disabled={actionLoading}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium transition disabled:opacity-50 text-white"
          >
            Request New License
          </button>
        </div>
      )}

      {/* CURRENT LICENSE CARD */}
      {license && (
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Current License
              </p>
              <div className="flex items-center gap-3">
                <h2 className={`text-3xl font-bold ${licenseType.color}`}>
                  {licenseType.emoji} {licenseType.label}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${statusDisplay.bg} ${statusDisplay.color} border-current/20`}
                >
                  {statusDisplay.label}
                </span>
              </div>
            </div>
            {license.code && (
              <div className="text-right">
                <p className="text-sm text-slate-500">License Code</p>
                <p className="text-base font-mono text-slate-300">
                  {license.code}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-xl mb-4">
            <div>
              <p className="text-sm text-slate-400/80">Acquired Date</p>
              <p className="text-sm font-medium text-white">
                {license.startDate
                  ? new Date(license.startDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400/80">Expiry Date</p>
              <p
                className={`text-sm font-medium ${isExpired ? "text-rose-400" : "text-white"}`}
              >
                {license.expiryDate
                  ? new Date(license.expiryDate).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400/80">Days Remaining</p>
              <p
                className={`text-sm font-medium ${daysLeft !== null && daysLeft <= 7 ? "text-rose-400" : daysLeft !== null && daysLeft <= 30 ? "text-amber-400" : "text-emerald-400"}`}
              >
                {isPerpetual
                  ? "∞"
                  : daysLeft !== null
                    ? `${daysLeft} days`
                    : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400/80">Status</p>
              <p className={`text-sm font-medium ${statusDisplay.color}`}>
                {statusDisplay.label}
              </p>
            </div>
          </div>

          {!isPerpetual && daysLeft !== null && !isExpired && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">License Progress</span>
                <span className="text-slate-400">
                  {Math.round(100 - (daysLeft / 365) * 100)}% used
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${daysLeft < 30 ? "bg-gradient-to-r from-rose-500 to-amber-500" : daysLeft < 60 ? "bg-gradient-to-r from-amber-500 to-emerald-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
                  style={{ width: `${(daysLeft / 365) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRIAL LICENSE UPGRADE OPTIONS */}
      {license && isTrial && (
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            🚀 Upgrade Your Trial
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {daysLeft !== null && daysLeft > 0
              ? `Your trial expires in ${daysLeft} days. Choose a plan to continue using the system.`
              : "Your trial has expired. Upgrade now to continue using the system."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-5 text-center border border-blue-500/20">
              <p className="text-xs text-slate-400 mb-2">Convert to</p>
              <p className="text-xl font-bold text-blue-400">Subscription</p>
              <p className="text-sm text-slate-300 mb-4">KES 44,850 / year</p>
              <button
                onClick={handleConvertTrialToSubscription}
                disabled={actionLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition disabled:opacity-50 text-white"
              >
                Subscribe Now — M-Pesa
              </button>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 text-center border border-emerald-500/20">
              <p className="text-xs text-slate-400 mb-2">Buy</p>
              <p className="text-xl font-bold text-emerald-400">Perpetual</p>
              <p className="text-sm text-slate-300 mb-4">
                KES 374,850 — Lifetime
              </p>
              <button
                onClick={handleConvertTrialToPerpetual}
                disabled={actionLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition disabled:opacity-50 text-white"
              >
                Buy Perpetual — M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      {license && !isPerpetual && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-2">
              🔄 {isExpired ? "Get New License" : "Renew Subscription"}
            </h3>
            <p className="text-base text-slate-400 mb-4">
              {isExpired
                ? "Your license has expired. Request a new license code from the Platform Administrator."
                : `Your subscription is active. Request a new license code for next year. ${daysLeft !== null ? `${daysLeft} days remaining.` : ""}`}
            </p>
            <button
              onClick={handleRequestNewLicense}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition shadow-lg ${isExpired ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20"} disabled:opacity-50`}
            >
              {actionLoading
                ? "Processing..."
                : isExpired
                  ? "Request New License"
                  : "Get New License Code"}
            </button>
          </div>

          <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-2">
              ⚡ Upgrade to Perpetual
            </h3>
            <p className="text-base text-slate-400 mb-4">
              Pay once, own forever. Includes lifetime updates, priority
              support, and no recurring fees.
            </p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white">KES 374,850</span>
              <span className="text-base text-slate-400">one-time</span>
            </div>
            <button
              onClick={handleUpgradeToPerpetual}
              disabled={actionLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-500/20 text-white disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Buy Perpetual — M-Pesa"}
            </button>
          </div>
        </div>
      )}

      {/* 🔑 ENTER NEW LICENSE + HELP CENTER - Side by Side */}
      {showLicenseEntry && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Entry Card */}
          <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
            {activationSuccess ? (
              // Success State
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl mx-auto mb-3">
                  ✅
                </div>
                <h4 className="text-lg font-bold text-emerald-400 mb-1">
                  Activated!
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  License activated successfully.
                </p>
                <div className="bg-slate-800/50 rounded-xl p-3 text-left space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Code:</span>
                    <span className="text-white font-mono">
                      {activationSuccess.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-white font-bold">
                      {activationSuccess.type}
                    </span>
                  </div>
                  {activationSuccess.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expires:</span>
                      <span className="text-white">
                        {new Date(
                          activationSuccess.expiryDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActivationSuccess(null)}
                  className="mt-3 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔑</span>
                  <h4 className="text-sm font-semibold text-white">
                    Enter New License
                  </h4>
                </div>
                <p className="text-base text-slate-400 mb-3">
                  {!license
                    ? "Activate your institution."
                    : isExpired
                      ? "Enter a new license code ."
                      : isRevoked
                        ? "Enter a new license code."
                        : isTrial
                          ? "Upgrade from Trial."
                          : "Activate or upgrade your license."}
                </p>

                <form onSubmit={handleActivateLicense} className="space-y-3">
                  <input
                    type="text"
                    value={licenseCode}
                    onChange={(e) => {
                      setLicenseError("");
                      setActivationSuccess(null);
                      const input = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "");
                      const limited = input.substring(0, 21);
                      let formatted = "";
                      for (let i = 0; i < limited.length; i++) {
                        if (i === 5 || i === 9 || i === 13 || i === 17)
                          formatted += "-";
                        formatted += limited[i];
                      }
                      setLicenseCode(formatted);
                    }}
                    placeholder="SUAMP-XXXX-XXXX-XXXX-XXXX"
                    maxLength={25}
                    className={`w-full bg-slate-800/50 border rounded-lg px-4 py-3 text-base font-mono text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none ${licenseError ? "border-rose-500" : "border-slate-700"}`}
                    disabled={activating}
                  />
                  {licenseError && (
                    <p className="text-rose-400 text-sm flex items-center gap-1">
                      <span>⚠️</span> {licenseError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={activating || !licenseCode}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20 text-white disabled:opacity-50"
                  >
                    {activating ? "Activating..." : "Activate License"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Help Center Card */}
          <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📞</span>
                <h4 className="text-sm font-semibold text-white">
                  Help Center
                </h4>
              </div>
              <div className="space-y-3 text-base">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">📧 Email:</span>
                  <span className="text-slate-300 text-sm">
                    support@suamp.com
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">📞 Phone:</span>
                  <span className="text-slate-300 text-sm">
                    +254 700 000 000
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">💬 Support:</span>
                  <span className="text-slate-300 text-sm">Available 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  const guideWindow = window.open(
                    "",
                    "_blank",
                    "width=800,height=600,scrollbars=yes",
                  );
                  if (guideWindow) {
                    guideWindow.document.write(userGuideHTML);
                    guideWindow.document.close();
                  }
                }}
                className="text-xs px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white flex items-center gap-2"
              >
                📚 User Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING HISTORY */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">
            📜 Billing & License History
          </h3>
          {billingHistory.length > 5 && (
            <button
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition font-medium"
            >
              {showAllHistory
                ? "View Less"
                : `View More (${billingHistory.length - 5} more)`}
            </button>
          )}
        </div>

        {billingHistory.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No billing history available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-left p-3 font-medium">License Code</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Payment Date</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(showAllHistory
                  ? billingHistory
                  : billingHistory.slice(0, 5)
                ).map((item: any) => {
                  const typeColors: Record<string, string> = {
                    PERPETUAL:
                      "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    SUBSCRIPTION:
                      "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    TRIAL:
                      "bg-orange-500/10 text-orange-400 border-orange-500/20",
                  };
                  const statusColors: Record<string, string> = {
                    ACTIVE:
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    EXPIRED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                    REVOKED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  };

                  const typeColor =
                    typeColors[item.type] || typeColors.SUBSCRIPTION;
                  const statusColor =
                    statusColors[item.status] || statusColors.ACTIVE;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                    >
                      <td className="p-3 text-white font-mono text-xs">
                        {item.licenseCode}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3 text-white">
                        {typeof item.amount === "number"
                          ? `KES ${item.amount.toFixed(2)}`
                          : item.amount || "Not Paid"}
                      </td>
                      <td className="p-3 text-slate-400">
                        {item.paymentDate
                          ? new Date(item.paymentDate).toLocaleDateString()
                          : "Not Paid"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
