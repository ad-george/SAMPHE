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
  const [mobileOpen, setMobileOpen] = useState(false);
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
    { path: "/lecturer", label: "Dashboard", icon: "◯" },
    { path: "/lecturer/units", label: "My Units", icon: "◯" },
    { path: "/lecturer/start", label: "Start Attendance", icon: "▶" },
    { path: "/lecturer/live", label: "Live Session", icon: "◉" },
    { path: "/lecturer/history", label: "History", icon: "◯" },
    { path: "/lecturer/students", label: "Students", icon: "◯" },
    { path: "/lecturer/reports", label: "Reports", icon: "◯" },
    { path: "/lecturer/analytics", label: "Attendance", icon: "◯" },
    { path: "/lecturer/sessions-analytics", label: "Sessions", icon: "◯" },
  ];

  useEffect(() => {
    if (!user || user.role !== "LECTURER") navigate("/login");
    fetchNotifications();
    fetchProfile();
  }, [user, navigate]);

  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearch(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
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
      setShowSearch(false);
      return;
    }
    try {
      const res = await api.get(
        `/lecturer/global-search?q=${encodeURIComponent(q)}`,
      );
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
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      <aside
        className={`h-screen flex flex-col shrink-0 z-40 transition-all duration-300 overflow-visible bg-gray-800
      w-56 md:w-64
      fixed md:sticky md:top-0
      ${collapsed ? "md:w-20" : "md:w-64"}
      ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
      >
        <div className="bg-gray-800 shrink-0 flex items-center justify-center border-b border-gray-700 p-2 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 bg-white/10 rounded-full px-3 py-2 md:px-5 md:py-3 border border-white/10">
            <div className="w-9 h-9 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0">
              <svg
                className="w-5 h-5 md:w-8 md:h-8 text-gray-800"
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
                <h1 className="font-bold text-white text-base md:text-2xl tracking-tight whitespace-nowrap">
                  SAMPHE
                </h1>
                <p className="text-[10px] md:text-xs text-gray-300 font-medium whitespace-nowrap">
                  Lecturer Portal
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex flex-col flex-1 bg-gray-800 overflow-visible">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute top-8 -right-3 z-50 w-10 h-10 bg-emerald-600 rounded-full items-center justify-center text-xs text-white hover:bg-emerald-500 transition shadow-lg"
          >
            {collapsed ? "▶" : "◀"}
          </button>

          <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg transition-all text-[13px] md:text-sm ${
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
            className="p-2 md:p-3 border-t border-gray-700 relative"
            ref={profileRef}
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 md:gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-700 transition"
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
                  <p className="text-[13px] md:text-sm font-medium text-white truncate">
                    {profileForm.fullName || user?.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400">Lecturer</p>
                </div>
              )}
            </button>
            {profileOpen && (
              <div className="absolute bottom-full left-2 md:left-3 mb-2 w-52 md:w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
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

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-gray-100">
        <header className="sticky top-0 bg-emerald-600 border-b border-emerald-500 z-30 shrink-0">
          <div className="flex items-center px-3 md:px-6 h-14 md:h-16">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden mr-2 text-white text-2xl leading-none"
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <div className="flex flex-col min-w-0">
              <h2 className="text-sm md:text-lg font-semibold text-white leading-tight truncate">
                {navItems.find((n) => n.path === location.pathname)?.label ||
                  "Dashboard"}
              </h2>
              <p className="text-[10px] md:text-xs text-emerald-100 leading-tight truncate">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-4 ml-6">
              <div className="h-10 w-px bg-emerald-300/50"></div>
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

            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQ.length >= 2 && setShowSearch(true)}
                  className="w-24 md:w-32 lg:w-40 h-8 md:h-9 px-2 md:px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-100/70 text-xs md:text-sm focus:outline-none focus:bg-white/20 transition"
                />

                {showSearch && searchResults && (
                  <div className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-14 md:top-full mt-2 md:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[70] max-h-96 overflow-y-auto">
                    {" "}
                    {searchResults.units?.length > 0 && (
                      <div className="p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 py-1 font-semibold">
                          Units
                        </p>
                        {searchResults.units.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => goToResult("unit")}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {u.code} — {u.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.students?.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 py-1 font-semibold">
                          Students
                        </p>
                        {searchResults.students.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => goToResult("student")}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {s.fullName}
                            </p>
                            <p className="text-xs text-gray-500">{s.regNo}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.sessions?.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 py-1 font-semibold">
                          Sessions
                        </p>
                        {searchResults.sessions.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => goToResult("record")}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {s.unit?.code} — {s.unit?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.units?.length === 0 &&
                      searchResults.students?.length === 0 &&
                      searchResults.sessions?.length === 0 && (
                        <p className="p-6 text-center text-sm text-gray-500">
                          No results
                        </p>
                      )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setNotifOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition relative"
              >
                <span className="text-white">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 bg-gray-100">
          <Outlet />
        </div>
      </main>

      {notifOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-3 md:p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base md:text-lg font-bold text-gray-800">
                Notifications
              </h3>
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
        <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-3 md:p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-5 md:p-6 shadow-2xl my-auto">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">
              Edit Profile
            </h3>
            <form onSubmit={saveProfile} className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-300 overflow-hidden">
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
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
                required
              />
              <input
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 mb-3 focus:border-emerald-400 focus:outline-none"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 mb-3 focus:border-emerald-400 focus:outline-none"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 md:px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none"
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
