const AuditLogs = () => {
  const logs = [
    { user: 'admin@suamp.com', action: 'Created university', target: 'Malawi University of Science', ip: '102.67.153.4', time: '2 min ago', type: 'create' },
    { user: 'system', action: 'Database backup', target: 'Full backup completed', ip: 'localhost', time: '1 hour ago', type: 'system' },
    { user: 'admin@suamp.com', action: 'Suspended license', target: 'Kampala International', ip: '102.67.153.4', time: '3 hours ago', type: 'warning' },
    { user: 'uniadmin@must.ac.mw', action: 'Imported 450 students', target: 'BSc Computer Science', ip: '41.70.64.12', time: '5 hours ago', type: 'info' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Complete activity trail across the platform</p>
        </div>
        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
          Export CSV
        </button>
      </div>

      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left p-5 font-medium">User</th>
              <th className="text-left p-5 font-medium">Action</th>
              <th className="text-left p-5 font-medium">Target</th>
              <th className="text-left p-5 font-medium">IP Address</th>
              <th className="text-left p-5 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition">
                <td className="p-5 font-mono text-xs text-violet-400">{l.user}</td>
                <td className="p-5">{l.action}</td>
                <td className="p-5 text-gray-400">{l.target}</td>
                <td className="p-5 font-mono text-xs text-gray-500">{l.ip}</td>
                <td className="p-5 text-gray-500 text-xs">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;