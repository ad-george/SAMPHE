import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const LoginUniversityAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/university-admin/login", {
        email,
        password,
      });
      const { token, user } = res.data.data;
      login(token, user);
      navigate("/university-admin");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid credentials or account inactive",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/70 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <span className="text-3xl">🏛️</span>
            </div>

            <h2 className="text-2xl font-bold text-white">University Admin</h2>

            <p className="text-gray-400 text-sm mt-1">
              Manage your institution
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="admin@university.ac.ke"
                className="w-full px-4 py-3 bg-gray-950/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-950/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition shadow-lg shadow-green-500/30 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-5">
            Don't have an account?{" "}
            <Link
              to="/signup/university-admin"
              className="text-green-400 font-medium hover:text-green-300 transition"
            >
              Register Institution
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginUniversityAdmin;
