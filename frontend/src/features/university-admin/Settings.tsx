import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Settings = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });
  const [reportSettings, setReportSettings] = useState({
    accentColor: "#10b981",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  // Integration Settings
  const [integration, setIntegration] = useState({
    mode: "STANDALONE",
    endpoint: "",
    apiKey: "",
    syncData: ["students", "lecturers", "units", "programs"],
    syncSchedule: "daily",
    lastSyncAt: null as string | null,
  });
  const [integrationLoading, setIntegrationLoading] = useState(false);

  const colorPallete = [
    "#10b981",
    "#059669",
    "#047857",
    "#065f46",
    "#34d399",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    "#60a5fa",
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    "#a78bfa",
    "#ec4899",
    "#db2777",
    "#be185d",
    "#9d174d",
    "#f472b6",
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#991b1b",
    "#f87171",
    "#f59e0b",
    "#d97706",
    "#b45309",
    "#92400e",
    "#fbbf24",
    "#14b8a6",
    "#0d9488",
    "#0f766e",
    "#0d5e5a",
    "#2dd4bf",
    "#6366f1",
    "#4f46e5",
    "#4338ca",
    "#3730a3",
    "#818cf8",
    "#f43f5e",
    "#e11d48",
    "#be123c",
    "#9f1239",
    "#fb7185",
    "#64748b",
    "#475569",
    "#334155",
    "#1e293b",
    "#94a3b8",
  ];

  useEffect(() => {
    // Fetch profile
    api.get("/university-admin/my-university").then((r) => {
      const data = r.data.data;
      setProfile(data);
      setForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
      });
      if (data.logo) setLogoPreview(data.logo);
    });

    // Fetch stats
    api.get("/university-admin/stats").then((r) => setStats(r.data.data));

    // Fetch report settings
    api
      .get("/university-admin/settings/report")
      .then((r) => {
        setReportSettings({
          accentColor: r.data.data?.accentColor || "#10b981",
        });
      })
      .catch(() => {
        setReportSettings({ accentColor: "#10b981" });
      });

    // Fetch integration settings
    api
      .get("/university-admin/integration/settings")
      .then((r) => {
        const data = r.data.data;
        setIntegration({
          mode: data.integrationMode || "STANDALONE",
          endpoint: data.integrationConfig?.endpoint || "",
          apiKey: data.integrationConfig?.apiKey || "",
          syncData: data.integrationConfig?.syncData || [
            "students",
            "lecturers",
            "units",
            "programs",
          ],
          syncSchedule: data.integrationConfig?.syncSchedule || "daily",
          lastSyncAt: data.lastSyncAt || null,
        });
      })
      .catch(() => {
        // Use defaults if endpoint doesn't exist
      });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/university-admin/profile", {
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website,
      });
      toast.success("Profile updated");
      // Refresh the profile so the preview updates
      const r = await api.get("/university-admin/my-university");
      setProfile(r.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const saveReportSettings = async () => {
    try {
      await api.put("/university-admin/settings/report", reportSettings);
      toast.success("Report settings saved");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      await api.post("/university-admin/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload logo");
    }
  };

  // Integration handlers
  const saveIntegrationSettings = async () => {
    setIntegrationLoading(true);
    try {
      await api.put("/university-admin/integration/settings", {
        integrationMode: integration.mode,
        integrationConfig: {
          endpoint: integration.endpoint,
          apiKey: integration.apiKey,
          syncData: integration.syncData,
          syncSchedule: integration.syncSchedule,
        },
      });
      toast.success("Integration settings saved");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setIntegrationLoading(false);
    }
  };

  const testConnection = async () => {
    setIntegrationLoading(true);
    try {
      const res = await api.post("/university-admin/integration/test");
      if (res.data.data) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed. Check your settings.");
      }
    } catch {
      toast.error("Connection failed");
    } finally {
      setIntegrationLoading(false);
    }
  };

  const syncNow = async () => {
    setIntegrationLoading(true);
    try {
      const res = await api.post("/university-admin/integration/sync");
      const data = res.data.data;
      toast.success(
        `Sync complete! ${data.students} students, ${data.lecturers} lecturers, ${data.units} units`,
      );
      // Update last sync time
      setIntegration((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Sync failed");
    } finally {
      setIntegrationLoading(false);
    }
  };

  const currentColor = reportSettings.accentColor;
  const isLightColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };
  const textColor = isLightColor(currentColor) ? "text-gray-900" : "text-white";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          ⚙️ Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage institution settings and attendance report template
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Profile */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">
            Institution Profile
          </h3>

          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold overflow-hidden border-2"
              style={{
                backgroundColor: currentColor,
                borderColor: currentColor,
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={textColor}>
                  {profile?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div>
              <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition cursor-pointer inline-block text-slate-300">
                Change Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Recommended: 512x512 PNG or SVG
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Institution Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="e.g. Mount Kenya University"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Postal Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white h-20 resize-none"
                placeholder="e.g. P.O. Box 123-00100, Nairobi"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Phone (comma-separated for multiple)
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="e.g. +254700000000, +254720111222"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Email (comma-separated for multiple)
              </label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="e.g. info@mku.ac.ke, registrar@mku.ac.ke"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="e.g. www.mku.ac.ke"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 text-white"
            >
              Save Profile
            </button>
          </form>

          <div className="border-t border-slate-800 pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-400">
              University Overview
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-400">
                  {stats?.faculties || 0}
                </p>
                <p className="text-[10px] text-slate-500">Faculties</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-cyan-400">
                  {stats?.departments || 0}
                </p>
                <p className="text-[10px] text-slate-500">Departments</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">
                  {stats?.students || 0}
                </p>
                <p className="text-[10px] text-slate-500">Students</p>
              </div>
            </div>

            {logoPreview && (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                  Logo Preview
                </p>
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-16 w-auto mx-auto object-contain"
                />
              </div>
            )}

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Institution Code
              </p>
              <p className="text-sm font-mono text-slate-300">
                {profile?.code || "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Attendance Report Template */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">
            📄 Attendance Report Template
          </h3>
          <p className="text-xs text-slate-500">
            This template applies to all attendance reports generated in the
            system
          </p>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
              Choose Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorPallete.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setReportSettings({ ...reportSettings, accentColor: color })
                  }
                  onMouseEnter={() => setHoverColor(color)}
                  onMouseLeave={() => setHoverColor(null)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    currentColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                      : hoverColor === color
                        ? "scale-110 ring-1 ring-white/30"
                        : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-slate-500">Selected:</span>
              <span
                className="w-5 h-5 rounded-full border border-white/20"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs text-slate-400 font-mono">
                {currentColor}
              </span>
            </div>
          </div>

          <button
            onClick={saveReportSettings}
            className="w-full px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-lg text-white"
            style={{
              background: `linear-gradient(to right, ${currentColor}, ${currentColor}dd)`,
              boxShadow: `0 10px 15px -3px ${currentColor}40`,
            }}
          >
            Save Template Settings
          </button>

          {/* Live Preview - shortened for brevity */}
          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Live Preview
            </p>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: currentColor }}
            >
              <div
                className="p-4 border-b text-center"
                style={{
                  backgroundColor: `${currentColor}15`,
                  borderColor: currentColor,
                }}
              >
                <div className="flex justify-center mb-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: currentColor }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      profile?.name?.charAt(0) || "U"
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-white">
                  {profile?.name || "University Name"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {profile?.address || "Address"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {profile?.phone || "Phone"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {profile?.email || "Email"}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white text-center">
                  ACADEMIC SESSION DETAILS
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">School:</span>{" "}
                    <span className="text-white">School of Computing</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stage / Campus:</span>{" "}
                    <span className="text-white">Y2S2 / MAIN</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Department:</span>{" "}
                    <span className="text-white">Computer Science</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Date / Week:</span>{" "}
                    <span className="text-white">12 Jul 2026 / Week 11</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Programme:</span>{" "}
                    <span className="text-white">BSc Data Science</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lecturer:</span>{" "}
                    <span className="text-white">Makau Mutua</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Unit:</span>{" "}
                    <span className="text-white">CIT216 - Networking 3</span>
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    borderColor: currentColor,
                    backgroundColor: `${currentColor}10`,
                  }}
                >
                  <h5
                    className="text-xs font-semibold text-center mb-2"
                    style={{ color: currentColor }}
                  >
                    STATS
                  </h5>
                  <div className="grid grid-cols-3 text-center text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">PRESENT</p>
                      <p className="font-bold text-white">12</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">TOTAL ENROLLED</p>
                      <p className="font-bold text-white">30</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">ATTENDANCE RATE</p>
                      <p className="font-bold text-white">40%</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h5
                    className="text-xs font-semibold text-center mb-2"
                    style={{ color: currentColor }}
                  >
                    ATTENDANCE RECORD
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-500">
                          <th className="text-left p-2 font-medium">#</th>
                          <th className="text-left p-2 font-medium">
                            Registration No.
                          </th>
                          <th className="text-left p-2 font-medium">
                            Student Name
                          </th>
                          <th className="text-left p-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/50">
                          <td className="p-2 text-slate-400">1</td>
                          <td className="p-2 text-white">CT100/12345/22</td>
                          <td className="p-2 text-white">JAMES OKOTH</td>
                          <td
                            className="p-2 font-medium"
                            style={{ color: currentColor }}
                          >
                            PRESENT
                          </td>
                        </tr>
                        <tr className="border-b border-slate-800/50">
                          <td className="p-2 text-slate-400">2</td>
                          <td className="p-2 text-white">CT100/12346/22</td>
                          <td className="p-2 text-white">MARY WANJIKU</td>
                          <td className="p-2 text-rose-400 font-medium">
                            ABSENT
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-400">3</td>
                          <td className="p-2 text-white">CT100/12347/22</td>
                          <td className="p-2 text-white">PETER OTIENO</td>
                          <td
                            className="p-2 font-medium"
                            style={{ color: currentColor }}
                          >
                            PRESENT
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div
                  className="pt-3 border-t"
                  style={{ borderColor: currentColor }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500">
                        HOD Signature:
                      </p>
                      <p className="text-white text-sm">__________________</p>
                      <p className="text-[10px] text-slate-500 mt-2">Date:</p>
                      <p className="text-white text-sm">__________________</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">
                        LEC. Signature:
                      </p>
                      <p className="text-white text-sm">__________________</p>
                      <p className="text-[10px] text-slate-500 mt-2">Date:</p>
                      <p className="text-white text-sm">__________________</p>
                    </div>
                  </div>
                  <p
                    className="text-center text-[10px] mt-3"
                    style={{ color: currentColor }}
                  >
                    Generated by SUAMP Smart Attendance System
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔗 INTEGRATION MODE - New Section */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">
          🔗 Integration Mode
        </h3>
        <p className="text-xs text-slate-500">
          Choose how your institution manages data. Standalone uses manual
          import, Integrated syncs with external systems.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() =>
              setIntegration({ ...integration, mode: "STANDALONE" })
            }
            className={`p-4 rounded-xl border-2 transition ${
              integration.mode === "STANDALONE"
                ? "border-emerald-500 bg-emerald-500/10 text-white"
                : "border-slate-700 text-slate-500 hover:border-slate-600"
            }`}
          >
            📦 Standalone
            <p className="text-xs text-slate-500 mt-1">
              Manual data entry and import
            </p>
          </button>
          <button
            onClick={() =>
              setIntegration({ ...integration, mode: "INTEGRATED" })
            }
            className={`p-4 rounded-xl border-2 transition ${
              integration.mode === "INTEGRATED"
                ? "border-cyan-500 bg-cyan-500/10 text-white"
                : "border-slate-700 text-slate-500 hover:border-slate-600"
            }`}
          >
            🔗 Integrated
            <p className="text-xs text-slate-500 mt-1">
              Sync with external system
            </p>
          </button>
        </div>

        {integration.mode === "INTEGRATED" && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                API Endpoint
              </label>
              <input
                value={integration.endpoint}
                onChange={(e) =>
                  setIntegration({ ...integration, endpoint: e.target.value })
                }
                placeholder="https://sis.university.ac.ke/api"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={integration.apiKey}
                onChange={(e) =>
                  setIntegration({ ...integration, apiKey: e.target.value })
                }
                placeholder="Enter your API key"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Sync Schedule
              </label>
              <select
                value={integration.syncSchedule}
                onChange={(e) =>
                  setIntegration({
                    ...integration,
                    syncSchedule: e.target.value,
                  })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Data to Sync
              </label>
              <div className="space-y-2">
                {["students", "lecturers", "units", "programs"].map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={integration.syncData.includes(item)}
                      onChange={(e) => {
                        const newData = e.target.checked
                          ? [...integration.syncData, item]
                          : integration.syncData.filter((d) => d !== item);
                        setIntegration({ ...integration, syncData: newData });
                      }}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-600"
                    />
                    <span className="text-sm text-slate-300 capitalize">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={testConnection}
                disabled={integrationLoading}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-medium transition text-white disabled:opacity-50"
              >
                Test Connection
              </button>
              <button
                onClick={syncNow}
                disabled={integrationLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition text-white disabled:opacity-50"
              >
                Sync Now
              </button>
              {integration.lastSyncAt && (
                <span className="text-xs text-slate-500">
                  Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={saveIntegrationSettings}
          disabled={integrationLoading}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          Save Integration Settings
        </button>
      </div>

      {/* 🔒 Security Section */}
      <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">🔒 Security</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-sm text-slate-300">
              Require strong passwords for HODs
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-600"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-sm text-slate-300">
              Auto-lock inactive accounts (90 days)
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-600"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-sm text-slate-300">
              Allow attendance only during class hours
            </span>
            <input
              type="checkbox"
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-600"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#131c31] border border-rose-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-rose-400 mb-4">
          ⚠ Danger Zone
        </h3>
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
          <p className="text-sm text-rose-300 mb-3">
            Deleting your university data is irreversible. All students,
            lecturers, and attendance records will be permanently lost.
          </p>
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-medium transition text-white">
            Request Data Deletion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
