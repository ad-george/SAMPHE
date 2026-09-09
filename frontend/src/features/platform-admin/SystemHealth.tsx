const SystemHealth = () => {
  const metrics = [
    { name: 'API Server', status: 'OPERATIONAL', uptime: '99.98%', latency: '45ms', color: 'emerald' },
    { name: 'PostgreSQL Database', status: 'OPERATIONAL', uptime: '99.99%', latency: '12ms', color: 'emerald' },
    { name: 'Redis Cache', status: 'OPERATIONAL', uptime: '100%', latency: '3ms', color: 'emerald' },
    { name: 'File Storage', status: 'DEGRADED', uptime: '99.2%', latency: '180ms', color: 'amber' },
    { name: 'Email Service', status: 'OPERATIONAL', uptime: '99.95%', latency: '250ms', color: 'emerald' },
    { name: 'WebSocket Server', status: 'OPERATIONAL', uptime: '99.97%', latency: '8ms', color: 'emerald' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-gray-500 mt-1">Real-time infrastructure monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#13131f] border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">All Systems Operational</span>
          </div>
          <p className="text-sm text-gray-500">Last incident: 14 days ago</p>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total Requests (24h)</p>
          <p className="text-3xl font-bold">284,392</p>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Error Rate</p>
          <p className="text-3xl font-bold text-emerald-400">0.02%</p>
        </div>
      </div>

      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left p-5 font-medium">Service</th>
              <th className="text-left p-5 font-medium">Status</th>
              <th className="text-left p-5 font-medium">Uptime</th>
              <th className="text-left p-5 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.name} className="border-b border-white/[0.02]">
                <td className="p-5 font-medium">{m.name}</td>
                <td className="p-5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-${m.color}-500/10 text-${m.color}-400 border border-${m.color}-500/20`}>
                    {m.status}
                  </span>
                </td>
                <td className="p-5 text-gray-400">{m.uptime}</td>
                <td className="p-5 text-gray-400">{m.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemHealth;