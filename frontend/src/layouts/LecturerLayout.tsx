import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const LecturerLayout = () => {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: "/lecturer", label: "Dashboard", icon: "◈" },
    { path: "/lecturer/units", label: "My Units", icon: "◉" },
    { path: "/lecturer/start", label: "Start Attendance", icon: "▶" },
    { path: "/lecturer/live", label: "Live Session", icon: "●" },
    { path: "/lecturer/history", label: "History", icon: "◧" },
    { path: "/lecturer/students", label: "Students", icon: "◎" },
    { path: "/lecturer/reports", label: "Reports", icon: "📄" },
    { path: "/lecturer/analytics", label: "Analytics", icon: "◯" },
  ];

  useEffect(() => {
    if (!user || user.role !== "LECTURER") navigate("/login");
    fetchNotifications();
    fetchProfile();
  }, [user, navigate]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearch(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/mine");
      setNotifications(res.data.data || []);
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/lecturer/me");
      if (res.data.data)
        setProfileForm({
          fullName: res.data.data.fullName,
          email: res.data.data.email,
          phone: res.data.data.phone || "",
          avatar: res.data.data.avatar || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
    } catch {}
  };

  const markNotifRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await api.get(`/lecturer/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.data);
      setShowSearch(true);
    } catch {}
  };

  const goToResult = (type: string) => {
    setShowSearch(false);
    setSearchQ("");
    if (type === "student") navigate("/lecturer/students");
    if (type === "unit") navigate("/lecturer/units");
    if (type === "program") navigate("/lecturer/units");
    if (type === "record") navigate("/lecturer/history");
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      profileForm.newPassword ||
      profileForm.confirmPassword ||
      profileForm.currentPassword
    ) {
      if (!profileForm.currentPassword) {
        toast.error("Enter current password");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (profileForm.newPassword.length < 6) {
        toast.error("Min 6 characters");
        return;
      }
    }
    try {
      const payload: any = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
      };
      if (profileForm.avatar) payload.avatar = profileForm.avatar;
      if (profileForm.newPassword && profileForm.currentPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
      }
      const res = await api.put("/lecturer/me", payload);
      login(localStorage.getItem("token")!, {
        ...user!,
        fullName: res.data.data.fullName,
        email: res.data.data.email,
      });
      toast.success("Profile updated");
      setEditProfile(false);
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setProfileForm({ ...profileForm, avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-200 text-gray-800 flex font-sans">
      {/* Sidebar — Gray */}
      <aside
        className={`sticky top-0 h-screen flex flex-col shrink-0 z-40 transition-all duration-300 overflow-visible ${
          collapsed ? "w-20" : "w-64"
        } bg-gray-800`}
      >
        {/* Brand — circular pill */}
        <div className="bg-gray-800 shrink-0 flex items-center justify-center border-b border-gray-700 p-4">
          <div className="flex items-center gap-3 bg-white/10 rounded-full px-5 py-3 border border-white/10">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0">
              <svg
                className="w-8 h-8 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 14l6.16-3.422A12.042 12.042 0 0112 21a12.042 12.042 0 01-6.16-10.422L12 14z"
                />
              </svg>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-white text-2xl tracking-tight whitespace-nowrap">
                  SAMP
                </h1>
                <p className="text-xs text-gray-300 font-medium whitespace-nowrap">
                  Lecturer Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible body */}
        <div className="relative flex flex-col flex-1 bg-gray-800 overflow-visible">
          {/* Toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-8 -right-3 z-50 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white hover:bg-emerald-500 transition shadow-lg"
          >
            {collapsed ? "▶" : "◀"}
          </button>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    active
                      ? "bg-emerald-600 text-white font-medium shadow-sm"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className="p-3 border-t border-gray-700 relative"
            ref={profileRef}
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden border border-gray-600">
                {profileForm.avatar ? (
                  <img
                    src={profileForm.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileForm.fullName?.charAt(0) || "L"
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {profileForm.fullName || user?.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400">Lecturer</p>
                </div>
              )}
            </button>
            {profileOpen && (
              <div className="absolute bottom-full left-3 mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                <button
                  onClick={() => {
                    setEditProfile(true);
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex items-center gap-2 text-gray-700"
                >
                  ✎ Edit Profile
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
                >
                  <span>→</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main — expands to fill remaining space */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-gray-100">
        {/* Top Bar — Green */}
        {/* Top Bar — Green */}
        <header className="sticky top-0 bg-emerald-600 border-b border-emerald-500 flex items-center px-6 z-30 h-16 shrink-0">
          <div className="flex flex-col mr-8">
            <h2 className="text-lg font-semibold text-white leading-tight">
              {navItems.find((n) => n.path === location.pathname)?.label ||
                "Dashboard"}
            </h2>
            <p className="text-xs text-emerald-100 leading-tight">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center h-10 justify-between">
              <div className="h-full w-px bg-emerald-300/50"></div>
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white leading-tight">
                {user?.universityName || "University"}
              </span>
              <p className="text-xs text-emerald-100 leading-tight">
                Department of {user?.departmentName || "Department"}
              </p>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-4 ml-4">
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQ.length >= 2 && setShowSearch(true)}
                  placeholder="Search"
                  className="bg-slate-100 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm w-40 focus:outline-none focus:border-emerald-400 text-slate-700 placeholder-slate-400"
                />
              </div>
              {showSearch && searchResults && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {!searchResults.lecturers?.length &&
                    !searchResults.students?.length &&
                    !searchResults.units?.length &&
                    !searchResults.programs?.length && (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No results
                      </div>
                    )}
                  {["lecturers", "students", "units", "programs"].map(
                    (cat) =>
                      searchResults[cat]?.length > 0 && (
                        <div
                          key={cat}
                          className="p-2 border-t border-slate-100 first:border-0"
                        >
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider px-3 py-1">
                            {cat}
                          </p>
                          {searchResults[cat].map((item: any) => (
                            <button
                              key={item.id}
                              onClick={() => goToResult(item.type)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                            >
                              <p className="text-sm text-slate-800 font-medium">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.subtitle}
                              </p>
                            </button>
                          ))}
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition relative"
            >
              <span className="text-slate-500">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 bg-gray-100">
          <Outlet />
        </div>
      </main>

      {/* Modals */}
      {notifOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
              <button
                onClick={() => setNotifOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="p-8 text-center text-gray-500 text-sm">
                  No notifications
                </p>
              )}
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                    n.isRead ? "opacity-50" : ""
                  }`}
                  onClick={() => markNotifRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        n.isRead ? "bg-gray-300" : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editProfile && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Profile
            </h3>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-300 overflow-hidden">
                  {profileForm.avatar ? (
                    <img
                      src={profileForm.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profileForm.fullName?.charAt(0) || "L"
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium cursor-pointer transition text-white text-center">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatar}
                    />
                  </label>
                  {profileForm.avatar && (
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm({ ...profileForm, avatar: "" })
                      }
                      className="block text-xs text-rose-500 hover:text-rose-600 text-center w-full"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              <input
                placeholder="Full Name"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fullName: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
              />
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">
                  Change Password
                </p>
                <input
                  placeholder="Current Password"
                  type="password"
                  value={profileForm.currentPassword}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 mb-3 focus:border-emerald-400 focus:outline-none"
                />
                <input
                  placeholder="New Password"
                  type="password"
                  value={profileForm.newPassword}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 mb-3 focus:border-emerald-400 focus:outline-none"
                />
                <input
                  placeholder="Confirm New Password"
                  type="password"
                  value={profileForm.confirmPassword}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfile(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm hover:bg-gray-200 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-500 transition text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerLayout;
