import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import React, { useEffect, useState, useRef, useMemo } from "react";

const UniversityAdminLayout = () => {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [notifDetailsOpen, setNotifDetailsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
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
    { path: "/university-admin", label: "Overview", icon: "◈" },
    { path: "/university-admin/faculties", label: "Faculties", icon: "▣" },
    { path: "/university-admin/departments", label: "Departments", icon: "◉" },
    { path: "/university-admin/hods", label: "HODs", icon: "◊" },
    {
      path: "/university-admin/academic-calendar",
      label: "Academic Calendar",
      icon: "◐",
    },
    { path: "/university-admin/reports", label: "Dept Reports", icon: "◫" },
    {
      path: "/university-admin/technical",
      label: "Technical Center",
      icon: "⚠",
    },
    {
      path: "/university-admin/integrations",
      label: "Integrations",
      icon: "⇄",
    },
    {
      path: "/university-admin/subscription",
      label: "Subscription",
      icon: "◉",
    },
    { path: "/university-admin/settings", label: "Settings", icon: "◯" },
  ];

  useEffect(() => {
    if (!user || user.role !== "UNIVERSITY_ADMIN") navigate("/login");
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

  // Add this near line 60, after the other useEffect hooks

  // Create license expiry notifications
  useEffect(() => {
    const createLicenseNotification = async () => {
      try {
        const res = await api.get("/university-admin/license/status");
        const data = res.data.data;

        if (!data) return;

        // Check if notification already exists
        const existingNotif = notifications.find(
          (n) => n.type === "LICENSE_EXPIRY" && !n.isRead,
        );

        // EXPIRING SOON (30, 15, 7, 3, 1 days)
        if (
          data.status === "EXPIRING_SOON" &&
          data.daysLeft &&
          data.daysLeft <= 30
        ) {
          const title = `License expires in ${data.daysLeft} days`;
          const message = `Your ${data.isTrial ? "trial" : "subscription"} license will expire on ${new Date(data.expiryDate).toLocaleDateString()}. Renew now to avoid interruption.`;

          if (!existingNotif) {
            // Add to notifications
            const newNotif = {
              id: `license-expiry-${Date.now()}`,
              title,
              message,
              type: "LICENSE_EXPIRY",
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [newNotif, ...prev]);

            // Also save to backend if you want persistence
            try {
              await api.post("/notifications", {
                title,
                message,
                type: "LICENSE_EXPIRY",
                metadata: {
                  daysLeft: data.daysLeft,
                  expiryDate: data.expiryDate,
                },
              });
            } catch (err) {
              // Silent fail - notification already shown locally
            }
          }
        }

        // EXPIRED
        if (data.status === "EXPIRED") {
          const title = "License Expired";
          const message =
            "Your license has expired. Renew now to regain access to all features.";

          if (!existingNotif) {
            const newNotif = {
              id: `license-expired-${Date.now()}`,
              title,
              message,
              type: "LICENSE_EXPIRY",
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [newNotif, ...prev]);

            try {
              await api.post("/notifications", {
                title,
                message,
                type: "LICENSE_EXPIRY",
                metadata: { status: "EXPIRED" },
              });
            } catch (err) {
              // Silent fail
            }
          }
        }

        // GRACE PERIOD
        if (data.status === "GRACE_PERIOD" && data.daysLeft) {
          const title = `Grace Period: ${data.daysLeft} days remaining`;
          const message = `Your license has been revoked. You have ${data.daysLeft} days to resolve this before access is permanently blocked.`;

          if (!existingNotif) {
            const newNotif = {
              id: `license-grace-${Date.now()}`,
              title,
              message,
              type: "LICENSE_EXPIRY",
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [newNotif, ...prev]);

            try {
              await api.post("/notifications", {
                title,
                message,
                type: "LICENSE_EXPIRY",
                metadata: { daysLeft: data.daysLeft },
              });
            } catch (err) {
              // Silent fail
            }
          }
        }
      } catch (err) {
        // Silent fail
      }
    };

    // Only run if user is logged in
    if (user) {
      createLicenseNotification();
    }
  }, [user]); // Re-run when user changes (login/refresh)

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/mine");
      setNotifications(res.data.data || []);
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/university-admin/me");
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

  const handleNotificationClick = async (n: any) => {
    // Mark as read
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === n.id ? { ...notif, isRead: true } : notif,
          ),
        );
      } catch {}
    }

    // Open details modal
    setSelectedNotification(n);
    setNotifDetailsOpen(true);
  };

  const unreadCount = React.useMemo(() => {
    const count = notifications.filter((n) => !n.isRead).length;
    console.log("Unread count:", count, notifications);
    return count;
  }, [notifications]);

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await api.get(
        `/university-admin/search?q=${encodeURIComponent(q)}`,
      );
      setSearchResults(res.data.data);
      setShowSearch(true);
    } catch {}
  };

  const goToResult = (type: string, id: string) => {
    setShowSearch(false);
    setSearchQ("");
    if (type === "department")
      navigate("/university-admin/departments", { state: { highlightId: id } });
    else if (type === "hod")
      navigate("/university-admin/hods", { state: { highlightId: id } });
    else if (type === "faculty")
      navigate("/university-admin/faculties", { state: { highlightId: id } });
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

      const res = await api.put("/university-admin/me", payload);
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
    <div className="min-h-screen bg-[#0b1120] text-slate-200 flex font-sans">
      {/* Sidebar - sticky, does NOT scroll */}
      <aside
        className={`sticky top-0 h-screen ${collapsed ? "w-20" : "w-72"} bg-[#0f172a] border-r border-slate-800/60 flex flex-col transition-all duration-300 relative shrink-0 overflow-visible`}
      >
        {/* Brand - matching HOD layout style */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-3 border border-white/10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <svg
                className="w-8 h-8 text-white"
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
                <h1 className="font-bold text-xl text-white tracking-tight whitespace-nowrap">
                  SAMPHE
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  Admin Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle - RIGHT EDGE */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-24 -right-3 z-50 w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-xs text-white hover:bg-cyan-500 transition shadow-lg"
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
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div
          className="p-4 border-t border-slate-800/60 relative"
          ref={profileRef}
        >
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-slate-600 shrink-0 overflow-hidden">
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
                <p className="text-[10px] text-slate-500">University Admin</p>
              </div>
            )}
          </button>

          {/* Profile Popup */}
          {profileOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-[#131c31] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => {
                  setEditProfile(true);
                  setProfileOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-2"
              >
                <span>✎</span> Edit Profile
              </button>
              <div className="border-t border-slate-800" />
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
        <header className="sticky top-0 h-16 bg-[#0f172a]/80 backdrop-blur border-b border-slate-800/60 flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold text-white whitespace-nowrap">
                  {navItems.find((n) => n.path === location.pathname)?.label ||
                    "Dashboard"}
                </h2>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-xs text-slate-300 whitespace-nowrap">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Tall Separator - spans both rows */}
            <div className="flex flex-col items-center h-full py-1">
              <div className="h-full w-px bg-slate-600/50"></div>
            </div>

            {/* Right side: Institution Name */}
            <div>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-cyan-400 whitespace-nowrap">
                  <span className="text-slate-600 font-light text-lg">| </span>
                  {user?.universityName || "University"}
                </span>
              </div>
              {/* Empty spacer to match date row height */}
              <div className="h-[20px]"></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search - white border, white text, dark background */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">
                  ⌕
                </span>
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQ.length >= 2 && setShowSearch(true)}
                  placeholder="Search"
                  className="bg-transparent border border-white/40 rounded-lg pl-10 pr-4 py-2 text-sm w-40 focus:outline-none focus:border-white text-white placeholder-white/60"
                />
              </div>

              {/* Search Dropdown */}
              {showSearch && searchResults && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-[#131c31] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {!searchResults.departments?.length &&
                    !searchResults.hods?.length &&
                    !searchResults.faculties?.length && (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No results found
                      </div>
                    )}
                  {searchResults.departments?.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider px-3 py-1">
                        Departments
                      </p>
                      {searchResults.departments.map((d: any) => (
                        <button
                          key={d.id}
                          onClick={() => goToResult("department", d.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <p className="text-sm text-white">{d.title}</p>
                          <p className="text-xs text-slate-500">
                            {d.subtitle} • HOD: {d.meta || "None"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.hods?.length > 0 && (
                    <div className="p-2 border-t border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider px-3 py-1">
                        HODs
                      </p>
                      {searchResults.hods.map((h: any) => (
                        <button
                          key={h.id}
                          onClick={() => goToResult("hod", h.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <p className="text-sm text-white">{h.title}</p>
                          <p className="text-xs text-slate-500">
                            {h.subtitle} • {h.meta}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.faculties?.length > 0 && (
                    <div className="p-2 border-t border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider px-3 py-1">
                        Faculties
                      </p>
                      {searchResults.faculties.map((f: any) => (
                        <button
                          key={f.id}
                          onClick={() => goToResult("faculty", f.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <p className="text-sm text-white">{f.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications - no white background */}
            <button
              onClick={() => setNotifOpen(true)}
              className="w-9 h-9 rounded-lg bg-transparent border border-white/40 flex items-center justify-center hover:bg-white/5 transition relative"
            >
              <span className="text-white">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
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
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <button
                onClick={() => setNotifOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="p-8 text-center text-slate-500 text-sm">
                  No notifications
                </p>
              )}
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-slate-800/50 hover:bg-white/[0.02] transition cursor-pointer ${n.isRead ? "opacity-50" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-slate-600" : "bg-cyan-400"}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-2">
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

      {/* Notification Details Modal */}
      {notifDetailsOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Notification Details
              </h3>
              <button
                onClick={() => setNotifDetailsOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">
                {selectedNotification.title}
              </p>
              <p className="text-sm text-slate-400">
                {selectedNotification.message}
              </p>
              <p className="text-xs text-slate-600">
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>
              {selectedNotification.metadata && (
                <div className="bg-slate-800/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-slate-500">Additional Info:</p>
                  <pre className="text-xs text-slate-400 mt-1">
                    {JSON.stringify(selectedNotification.metadata, null, 2)}
                  </pre>
                </div>
              )}
              <button
                onClick={() => setNotifDetailsOpen(false)}
                className="w-full py-2.5 mt-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-medium text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Profile</h3>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl font-bold border border-slate-600 shrink-0 overflow-hidden">
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
                  <label className="block px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-medium cursor-pointer transition text-center">
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
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                required
              />
              <input
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
              />

              <div className="border-t border-slate-800 pt-4 mt-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
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
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white mb-3"
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
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white mb-3"
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
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfile(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-sm font-medium hover:bg-cyan-500 transition"
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

export default UniversityAdminLayout;
