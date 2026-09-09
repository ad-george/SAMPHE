const Settings = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
      <p className="text-gray-500 mt-1">Platform-wide configuration and defaults</p>
    </div>

    <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Platform Branding</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Platform Name</label>
            <input defaultValue="SUAMP" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Support Email</label>
            <input defaultValue="support@suamp.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-6">
        <h3 className="font-semibold mb-4">Security</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-600" />
            <span className="text-sm">Require 2FA for Platform Admin</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-600" />
            <span className="text-sm">Auto-suspend expired licenses</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-600" />
            <span className="text-sm">Maintenance mode</span>
          </label>
        </div>
      </div>

      <div className="border-t border-white/5 pt-6">
        <button className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-500/20">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

export default Settings;