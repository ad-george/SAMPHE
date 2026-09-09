import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io();

const Attendance = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [duration, setDuration] = useState(15);
  const [radius, setRadius] = useState(50);
  const [session, setSession] = useState<any>(null);
  const [liveRecords, setLiveRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/lecturers').then((res) => {
      const lecs = res.data.data || [];
      if (lecs.length > 0) {
        api.get(`/lecturers?departmentId=${lecs[0].departmentId}`).then(() => {});
      }
    });
    
    const fetchUnits = async () => {
      try {
        const res = await api.get('/lecturers');
        const lecturer = res.data.data?.find((l: any) => l.id);
        if (lecturer) {
          setUnits(lecturer.assignments?.map((a: any) => a.unit) || []);
        }
      } catch {}
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!session) return;
    socket.emit('join-session', session.id);
    socket.on('new-attendance', (record) => {
      setLiveRecords((prev) => [record, ...prev]);
      toast.success(`${record.studentName} signed attendance`);
    });
    return () => {
      socket.emit('leave-session', session.id);
      socket.off('new-attendance');
    };
  }, [session]);

  const startSession = async () => {
    if (!selectedUnit) return toast.error('Select a unit');
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await api.post('/attendance/session', {
          unitId: selectedUnit,
          duration,
          radius,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setSession(res.data.data);
        setLiveRecords([]);
        toast.success('Attendance session started!');
        setLoading(false);
      }, () => {
        toast.error('Location access required');
        setLoading(false);
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start session');
      setLoading(false);
    }
  };

  const closeSession = async () => {
    if (!session) return;
    await api.post(`/attendance/close/${session.id}`);
    setSession(null);
    toast.success('Session closed');
  };

  const link = session ? `${window.location.origin}/attendance/${session.sessionToken}` : '';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Start Attendance</h1>

      {!session ? (
        <div className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Teaching Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">Select unit...</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border rounded-lg px-4 py-2">
              {[5, 10, 15, 20, 30, 45, 60].map((d) => (
                <option key={d} value={d}>{d} Minutes</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Radius (metres)</label>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full border rounded-lg px-4 py-2">
              <option value={40}>Small Classroom (40m)</option>
              <option value={60}>Large Hall (60m)</option>
              <option value={100}>Outdoor (100m)</option>
              <option value={150}>Custom (150m)</option>
            </select>
          </div>
          <button
            onClick={startSession}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Generate Attendance Link'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-semibold">Session Active</h2>
                <p className="text-sm text-gray-500">Token: {session.sessionToken}</p>
                <p className="text-sm text-blue-600 mt-1">{link}</p>
              </div>
              <button onClick={closeSession} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">End Session</button>
            </div>
            <div className="flex gap-8 items-center">
              <div className="bg-gray-100 p-4 rounded-lg">
                <QRCodeSVG value={link} size={180} />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied'); }}
                  className="block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Live Attendance ({liveRecords.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Reg No</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Distance</th>
                </tr>
              </thead>
              <tbody>
                {liveRecords.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-4">{r.registrationNumber}</td>
                    <td className="p-4">{r.studentName}</td>
                    <td className="p-4">{new Date(r.submissionTime).toLocaleTimeString()}</td>
                    <td className="p-4">{Math.round(r.calculatedDistance)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;