import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PLATFORM_ADMIN' | 'UNIVERSITY_ADMIN' | 'HOD' | 'LECTURER'>('LECTURER');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleConfig = {
    PLATFORM_ADMIN: { endpoint: '/auth/admin/login', path: '/platform-admin' },
    UNIVERSITY_ADMIN: { endpoint: '/auth/university-admin/login', path: '/university-admin' },
    HOD: { endpoint: '/auth/hod/login', path: '/hod' },
    LECTURER: { endpoint: '/auth/lecturer/login', path: '/lecturer' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = roleConfig[role];
      const res = await api.post(config.endpoint, { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome, ${user.fullName}`);
      navigate(config.path);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {(['PLATFORM_ADMIN', 'UNIVERSITY_ADMIN', 'HOD', 'LECTURER'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-3 py-2 rounded-lg text-sm ${role === r ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default Login;