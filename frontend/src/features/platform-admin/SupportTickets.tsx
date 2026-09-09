const SupportTickets = () => {
  const tickets = [
    { id: '#1243', subject: 'Login issues for lecturers', university: 'MUST', priority: 'HIGH', status: 'OPEN', time: '2h ago' },
    { id: '#1242', subject: 'GPS accuracy problems', university: 'University of Nairobi', priority: 'MEDIUM', status: 'IN_PROGRESS', time: '5h ago' },
    { id: '#1241', subject: 'PDF report generation fails', university: 'Kampala International', priority: 'HIGH', status: 'OPEN', time: '1d ago' },
    { id: '#1240', subject: 'Student import error', university: 'MUST', priority: 'LOW', status: 'RESOLVED', time: '2d ago' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-gray-500 mt-1">Technical support tickets from all tenant universities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Open Tickets</p>
          <p className="text-3xl font-bold text-rose-400">12</p>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">In Progress</p>
          <p className="text-3xl font-bold text-amber-400">5</p>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Resolved Today</p>
          <p className="text-3xl font-bold text-emerald-400">8</p>
        </div>
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Avg Response</p>
          <p className="text-3xl font-bold text-blue-400">2.4h</p>
        </div>
      </div>

      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left p-5 font-medium">Ticket</th>
              <th className="text-left p-5 font-medium">Subject</th>
              <th className="text-left p-5 font-medium">University</th>
              <th className="text-left p-5 font-medium">Priority</th>
              <th className="text-left p-5 font-medium">Status</th>
              <th className="text-left p-5 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition">
                <td className="p-5 font-mono text-violet-400">{t.id}</td>
                <td className="p-5">{t.subject}</td>
                <td className="p-5 text-gray-400">{t.university}</td>
                <td className="p-5">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    t.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                    t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>{t.priority}</span>
                </td>
                <td className="p-5">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    t.status === 'OPEN' ? 'bg-rose-500/10 text-rose-400' :
                    t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>{t.status.replace('_', ' ')}</span>
                </td>
                <td className="p-5 text-gray-500">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTickets;