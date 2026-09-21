import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const PlatformAdminLayout = () => {
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
    password: "",
    avatar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: "/platform-admin", label: "Overview", icon: "◈" },
    { path: "/platform-admin/universities", label: "Institutions", icon: "▣" },
    {
      path: "/platform-admin/licenses",
      label: "Licenses & Billing",
      icon: "◉",
    },
    { path: "/platform-admin/support", label: "Support Center", icon: "◊" },
    { path: "/platform-admin/system", label: "System Health", icon: "◐" },
    { path: "/platform-admin/audit", label: "Audit Logs", icon: "◫" },
    { path: "/platform-admin/settings", label: "Global Settings", icon: "◯" },
  ];

  useEffect(() => {
    if (!user || user.role !== "PLATFORM_ADMIN") navigate("/login");
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
      const res = await api.get("/platform-admin/me");
      if (res.data.data) {
        setProfileForm({
          fullName: res.data.data.fullName,
          email: res.data.data.email,
          phone: res.data.data.phone || "",
          password: "",
          avatar: res.data.data.avatar || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
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
      const res = await api.get(
        `/platform-admin/search?q=${encodeURIComponent(q)}`,
      );
      setSearchResults(res.data.data);
      setShowSearch(true);
    } catch {}
  };

  const goToResult = (type: string, id: string) => {
    setShowSearch(false);
    setSearchQ("");
    if (type === "university")
      navigate("/platform-admin/universities", { state: { highlightId: id } });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      profileForm.newPassword ||
      profileForm.confirmPassword ||
      profileForm.currentPassword
    ) {
      if (!profileForm.currentPassword) {
        toast.error("Please enter your current password to change password");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      if (profileForm.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
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

      const res = await api.put("/platform-admin/me", payload);
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
      toast.error(err.response?.data?.message || "Failed to update profile");
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
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex font-sans selection:bg-violet-500/30">
      {/* Sidebar - sticky, does NOT scroll */}
      <aside
        className={`sticky top-0 h-screen ${collapsed ? "w-20" : "w-72"} transition-all duration-300 bg-[#0f0f16] border-r border-white/5 flex flex-col relative shrink-0 overflow-visible`}
      >
        {/* Brand - BIGGER icon and SUAMP text */}
        <div className="p-4 border-b border-white/5 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-3 border border-white/10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-2xl text-white tracking-tight whitespace-nowrap">
                  SAMPHE<span className="text-violet-400">.dev</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  Platform Control
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle - RIGHT EDGE */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-24 -right-3 z-50 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-xs text-white hover:bg-violet-500 transition shadow-lg shadow-violet-500/30"
        >
          {collapsed ? "▶" : "◀"}
        </button>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ outline: "none" }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-lg ${active ? "text-white" : "text-gray-500"} shrink-0`}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {item.path === "/platform-admin/support" &&
                  unreadCount > 0 &&
                  !collapsed && (
                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Card - above profile */}
        {!collapsed && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/20">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              System Status
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">
                All Systems Operational
              </span>
            </div>
            <div className="mt-1 text-[10px] text-gray-600">
              v1.0.0 • Build 2026.07
            </div>
          </div>
        )}

        {/* Profile Section - BIGGER avatar */}
        <div className="p-4 border-t border-white/5 relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg font-bold border border-white/10 shrink-0 overflow-hidden">
              {profileForm.avatar ? (
                <img
                  src={profileForm.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                profileForm.fullName?.charAt(0) || "A"
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {profileForm.fullName || user?.fullName}
                </p>
                <p className="text-[10px] text-gray-500">Super Administrator</p>
              </div>
            )}
          </button>

          {/* Profile Popup */}
          {profileOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => {
                  setEditProfile(true);
                  setProfileOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-2 text-gray-200"
              >
                <span>✎</span> Edit Profile
              </button>
              <div className="border-t border-white/5" />
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
              >
                <span>→</span> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar - sticky, does NOT scroll */}
        <header className="sticky top-0 h-16 bg-[#0f0f16]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-40 shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {navItems.find((n) => n.path === location.pathname)?.label ||
                "Dashboard"}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  ⌕
                </span>
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQ.length >= 2 && setShowSearch(true)}
                  placeholder="Search"
                  className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm w-40 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition"
                />
              </div>

              {/* Search Dropdown */}
              {showSearch && searchResults && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  {!searchResults.universities?.length && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No results found
                    </div>
                  )}
                  {searchResults.universities?.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 py-1">
                        Institutions
                      </p>
                      {searchResults.universities.map((d: any) => (
                        <button
                          key={d.id}
                          onClick={() => goToResult("university", d.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <p className="text-sm text-white">{d.title}</p>
                          <p className="text-xs text-gray-500">{d.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition relative"
            >
              <span className="text-gray-400">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

      {/* Notification Modal */}
      {notifOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <button
                onClick={() => setNotifOpen(false)}
                className="text-gray-500 hover:text-white"
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
                  className={`p-4 border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer ${
                    n.isRead ? "opacity-50" : ""
                  }`}
                  onClick={() => markNotifRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        n.isRead ? "bg-gray-600" : "bg-violet-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-600 mt-2">
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

      {/* Edit Profile Modal */}
      {editProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Profile</h3>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xl font-bold border border-white/10 shrink-0 overflow-hidden">
                  {profileForm.avatar ? (
                    <img
                      src={profileForm.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profileForm.fullName?.charAt(0) || "A"
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium cursor-pointer transition text-center text-white">
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
                      className="block text-xs text-rose-400 hover:text-rose-300 text-center w-full"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                required
              />
              <input
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />

              <div className="border-t border-white/5 pt-4 mt-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">
                  Change Password
                </p>
                <input
                  placeholder="Current Password"
                  type="password"
                  value={profileForm.currentPassword || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white mb-3 focus:outline-none focus:border-violet-500/50"
                />
                <input
                  placeholder="New Password"
                  type="password"
                  value={profileForm.newPassword || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white mb-3 focus:outline-none focus:border-violet-500/50"
                />
                <input
                  placeholder="Confirm New Password"
                  type="password"
                  value={profileForm.confirmPassword || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfile(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition text-sm font-medium text-white shadow-lg shadow-violet-500/20"
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

export default PlatformAdminLayout;
