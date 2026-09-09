import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Integration {
  id: string;
  type: string;
  config: any;
  isActive: boolean;
  lastSync?: string;
}

const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ [key: string]: any }>({});

  const fetchIntegrations = async () => {
    try {
      const res = await api.get("/university-admin/integrations");
      setIntegrations(res.data.data || []);

      // Initialize form state with existing configs
      const initialForm: { [key: string]: any } = {};
      res.data.data?.forEach((int: Integration) => {
        if (int.config) {
          try {
            initialForm[int.type] =
              typeof int.config === "string"
                ? JSON.parse(int.config)
                : int.config;
          } catch {
            initialForm[int.type] = {};
          }
        } else {
          initialForm[int.type] = {};
        }
      });
      setForm(initialForm);
    } catch (err: any) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const getIntegrationConfig = (type: string): any => {
    const integration = integrations.find((i) => i.type === type);
    if (integration?.config) {
      try {
        return typeof integration.config === "string"
          ? JSON.parse(integration.config)
          : integration.config;
      } catch {
        return {};
      }
    }
    return form[type] || {};
  };

  const isActive = (type: string): boolean => {
    return integrations.find((i) => i.type === type)?.isActive || false;
  };

  const handleConfigChange = (type: string, key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [key]: value,
      },
    }));
  };

  const saveIntegration = async (type: string) => {
    setSaving(true);
    try {
      const config = form[type] || {};
      const current = integrations.find((i) => i.type === type);

      await api.post("/university-admin/integrations", {
        type,
        config,
        isActive: current?.isActive || false,
      });

      toast.success(`${type} integration saved successfully`);
      fetchIntegrations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  const toggleIntegration = async (type: string) => {
    const current = integrations.find((i) => i.type === type);
    if (!current) {
      toast.error("Integration not found");
      return;
    }

    try {
      const res = await api.patch(
        `/university-admin/integrations/${type}/toggle`,
        {
          isActive: !current.isActive,
        },
      );
      if (res.data.success) {
        toast.success(
          `${type} ${!current.isActive ? "activated" : "deactivated"}`,
        );
        fetchIntegrations();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to toggle integration",
      );
    }
  };

  const deleteIntegration = async (type: string) => {
    if (!confirm(`Delete ${type} integration configuration?`)) return;

    try {
      await api.delete(`/university-admin/integrations/${type}`);
      toast.success(`${type} integration removed`);
      fetchIntegrations();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to delete integration",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Integrations
        </h1>
        <p className="text-slate-500 mt-1">
          Connect SUAMP with your university's existing systems
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SIS Integration */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">
                ⇄
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Student Information System (SIS)
                </h3>
                <p className="text-xs text-slate-500">
                  Sync students, programmes, and registrations
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("SIS")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                isActive("SIS")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
            >
              {isActive("SIS") ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="space-y-3">
            <input
              placeholder="API Endpoint URL"
              value={getIntegrationConfig("SIS")?.apiEndpoint || ""}
              onChange={(e) =>
                handleConfigChange("SIS", "apiEndpoint", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <input
              placeholder="API Key"
              type="password"
              value={getIntegrationConfig("SIS")?.apiKey || ""}
              onChange={(e) =>
                handleConfigChange("SIS", "apiKey", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={getIntegrationConfig("SIS")?.syncSchedule === "daily"}
                onChange={(e) =>
                  handleConfigChange(
                    "SIS",
                    "syncSchedule",
                    e.target.checked ? "daily" : "manual",
                  )
                }
                className="rounded bg-slate-800 border-slate-600 text-cyan-600"
              />
              Enable auto-sync every 24 hours
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => saveIntegration("SIS")}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save SIS Connection"}
              </button>
              {isActive("SIS") && (
                <button
                  onClick={() => deleteIntegration("SIS")}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition border border-rose-500/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Website Integration */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-lg">
                🌐
              </div>
              <div>
                <h3 className="font-semibold text-white">University Website</h3>
                <p className="text-xs text-slate-500">
                  Embed attendance portal or share data
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("WEBSITE")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                isActive("WEBSITE")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
            >
              {isActive("WEBSITE") ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="space-y-3">
            <input
              placeholder="Webhook URL"
              value={getIntegrationConfig("WEBSITE")?.webhookUrl || ""}
              onChange={(e) =>
                handleConfigChange("WEBSITE", "webhookUrl", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <input
              placeholder="API Key"
              value={getIntegrationConfig("WEBSITE")?.apiKey || ""}
              onChange={(e) =>
                handleConfigChange("WEBSITE", "apiKey", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveIntegration("WEBSITE")}
                disabled={saving}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Website Config"}
              </button>
              {isActive("WEBSITE") && (
                <button
                  onClick={() => deleteIntegration("WEBSITE")}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition border border-rose-500/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SMTP / Email Integration */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">
                ✉
              </div>
              <div>
                <h3 className="font-semibold text-white">Email / SMTP</h3>
                <p className="text-xs text-slate-500">
                  Send notifications from your domain
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("SMTP")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                isActive("SMTP")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
            >
              {isActive("SMTP") ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="space-y-3">
            <input
              placeholder="SMTP Host (e.g. smtp.gmail.com)"
              value={getIntegrationConfig("SMTP")?.host || ""}
              onChange={(e) =>
                handleConfigChange("SMTP", "host", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Port"
                value={getIntegrationConfig("SMTP")?.port || ""}
                onChange={(e) =>
                  handleConfigChange("SMTP", "port", e.target.value)
                }
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
              />
              <select
                value={getIntegrationConfig("SMTP")?.security || "TLS"}
                onChange={(e) =>
                  handleConfigChange("SMTP", "security", e.target.value)
                }
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
              >
                <option value="TLS">TLS</option>
                <option value="SSL">SSL</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <input
              placeholder="Sender Email"
              value={getIntegrationConfig("SMTP")?.senderEmail || ""}
              onChange={(e) =>
                handleConfigChange("SMTP", "senderEmail", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <input
              placeholder="SMTP Password"
              type="password"
              value={getIntegrationConfig("SMTP")?.password || ""}
              onChange={(e) =>
                handleConfigChange("SMTP", "password", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveIntegration("SMTP")}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Test & Save"}
              </button>
              {isActive("SMTP") && (
                <button
                  onClick={() => deleteIntegration("SMTP")}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition border border-rose-500/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SMS Gateway Integration */}
        <div className="bg-[#131c31] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg">
                📲
              </div>
              <div>
                <h3 className="font-semibold text-white">SMS Gateway</h3>
                <p className="text-xs text-slate-500">
                  Send attendance alerts via SMS
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("SMS")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                isActive("SMS")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
            >
              {isActive("SMS") ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="space-y-3">
            <select
              value={getIntegrationConfig("SMS")?.provider || "TWILIO"}
              onChange={(e) =>
                handleConfigChange("SMS", "provider", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
            >
              <option value="TWILIO">Twilio</option>
              <option value="AFRICASTALKING">Africa's Talking</option>
              <option value="CUSTOM">Custom Provider</option>
            </select>
            <input
              placeholder="Account SID / API Key"
              value={getIntegrationConfig("SMS")?.accountSid || ""}
              onChange={(e) =>
                handleConfigChange("SMS", "accountSid", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <input
              placeholder="API Secret / Token"
              type="password"
              value={getIntegrationConfig("SMS")?.apiSecret || ""}
              onChange={(e) =>
                handleConfigChange("SMS", "apiSecret", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <input
              placeholder="From Number"
              value={getIntegrationConfig("SMS")?.fromNumber || ""}
              onChange={(e) =>
                handleConfigChange("SMS", "fromNumber", e.target.value)
              }
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveIntegration("SMS")}
                disabled={saving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save SMS Config"}
              </button>
              {isActive("SMS") && (
                <button
                  onClick={() => deleteIntegration("SMS")}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium transition border border-rose-500/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
