import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineGlobeAlt,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBellAlert,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheck,
  HiOutlineXMark,
} from "react-icons/hi2";

/**
 * Navbar — Top navigation bar.
 * Shows the app name, nav links, notification bell with invitation dropdown,
 * user info, dark mode toggle, and logout.
 */
export default function Navbar() {
  const {
    darkMode,
    toggleDarkMode,
    pendingCount,
    pendingInvitations,
    loadPendingInvitations,
    loadPendingCount,
    acceptInvite,
    declineInvite,
    loadGroups,
    notifications,
    notificationsCount,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("invites"); // "invites" or "activity"
  const dropdownRef = useRef(null);

  // Poll for pending invitation count and notifications every 30 seconds
  useEffect(() => {
    if (user) {
      loadPendingCount();
      loadNotifications();
      const interval = setInterval(() => {
        loadPendingCount();
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadPendingCount, loadNotifications]);

  // Load full invitations and notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      loadPendingInvitations();
      loadNotifications();
    }
  }, [showNotifications, loadPendingInvitations, loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAccept = async (id) => {
    try {
      await acceptInvite(id);
      await loadPendingInvitations();
      await loadGroups();
    } catch {
      // Error handled in context
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineInvite(id);
      await loadPendingInvitations();
    } catch {
      // Error handled in context
    }
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id);
    }
    setShowNotifications(false);
    navigate(`/community/${notif.post?._id || notif.post}`);
    setTimeout(() => {
      const el = document.getElementById("comments-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 600);
  };

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode
          ? "bg-surface-900/80 border-surface-700"
          : "bg-white/80 border-surface-200"
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:bg-primary-600 transition-colors">
              S
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                darkMode ? "text-white" : "text-surface-800"
              }`}
            >
              Split<span className="text-primary-500">Ease</span>
            </span>
          </Link>

          {/* Nav Links + Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                isActive("/")
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30"
                  : darkMode
                  ? "text-surface-300 hover:text-white hover:bg-surface-800"
                  : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
              } ${isActive("/") && darkMode ? "bg-primary-900/30 text-primary-400" : ""}`}
            >
              <HiOutlineHome className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              to="/community"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                isActive("/community") || location.pathname.startsWith("/community/")
                  ? "bg-primary-50 text-primary-600"
                  : darkMode
                  ? "text-surface-300 hover:text-white hover:bg-surface-800"
                  : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
              } ${
                (isActive("/community") || location.pathname.startsWith("/community/")) && darkMode
                  ? "bg-primary-900/30 text-primary-400"
                  : ""
              }`}
            >
              <HiOutlineGlobeAlt className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </Link>

            <Link
              to="/groups"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                isActive("/groups") || location.pathname.startsWith("/groups/")
                  ? "bg-primary-50 text-primary-600"
                  : darkMode
                  ? "text-surface-300 hover:text-white hover:bg-surface-800"
                  : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
              } ${
                (isActive("/groups") || location.pathname.startsWith("/groups/")) && darkMode
                  ? "bg-primary-900/30 text-primary-400"
                  : ""
              }`}
            >
              <HiOutlineUserGroup className="w-4 h-4" />
              <span className="hidden sm:inline">Groups</span>
            </Link>

            {/* Separator */}
            <div
              className={`w-px h-6 mx-1 ${
                darkMode ? "bg-surface-700" : "bg-surface-200"
              }`}
            />

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  darkMode
                    ? "text-surface-300 hover:bg-surface-800"
                    : "text-surface-500 hover:bg-surface-100"
                }`}
                aria-label="Notifications"
              >
                <HiOutlineBellAlert className="w-5 h-5" />
                {(pendingCount + notificationsCount) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-sm">
                    {Math.min(99, pendingCount + notificationsCount)}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className={`absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-h-[70vh] sm:max-h-96 overflow-y-auto rounded-2xl border shadow-modal animate-scale-in z-50 -right-2 ${
                    darkMode
                      ? "bg-surface-800 border-surface-700 text-white"
                      : "bg-white border-surface-200 text-surface-800"
                  }`}
                >
                  {/* Tab Selector */}
                  <div className="flex border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 sticky top-0 backdrop-blur-md z-10">
                    <button
                      type="button"
                      onClick={() => setActiveTab("invites")}
                      className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "invites"
                          ? "border-primary-500 text-primary-500 dark:text-primary-400"
                          : "border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                      }`}
                    >
                      📩 Invites
                      {pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "activity"
                          ? "border-primary-500 text-primary-500 dark:text-primary-400"
                          : "border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                      }`}
                    >
                      🔔 Activity
                      {notificationsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                          {notificationsCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Invites Tab View */}
                  {activeTab === "invites" && (
                    <div className="p-2 space-y-1">
                      {pendingInvitations.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                            No pending invitations
                          </p>
                        </div>
                      ) : (
                        pendingInvitations.map((inv) => (
                          <div
                            key={inv._id}
                            className={`rounded-xl p-3 transition-colors ${
                              darkMode
                                ? "bg-surface-700/50 hover:bg-surface-700"
                                : "bg-surface-50 hover:bg-surface-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{inv.group?.icon || "👥"}</span>
                              <div className="min-w-0 flex-1 text-left">
                                <p className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-surface-800"}`}>
                                  {inv.group?.name || "Unknown Group"}
                                </p>
                                <p className={`text-xs ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                                  Invited by @{inv.invitedBy?.username}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAccept(inv._id)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                              >
                                <HiOutlineCheck className="w-3.5 h-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleDecline(inv._id)}
                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  darkMode
                                    ? "bg-surface-600 text-surface-300 hover:bg-surface-500"
                                    : "bg-surface-200 text-surface-600 hover:bg-surface-300"
                                }`}
                              >
                                <HiOutlineXMark className="w-3.5 h-3.5" />
                                Decline
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Activity Tab View */}
                  {activeTab === "activity" && (
                    <div>
                      {notifications.length > 0 && notificationsCount > 0 && (
                        <div className={`px-3 py-1.5 flex justify-end border-b ${darkMode ? "border-surface-700/60" : "border-surface-100"}`}>
                          <button
                            type="button"
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-semibold text-primary-500 hover:text-primary-600 cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}

                      <div className="p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                              No notifications
                            </p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`rounded-xl p-2.5 transition-colors cursor-pointer text-left border ${
                                notif.isRead
                                  ? darkMode
                                    ? "bg-transparent border-transparent text-surface-300 hover:bg-surface-700/30"
                                    : "bg-transparent border-transparent text-surface-600 hover:bg-surface-50"
                                  : darkMode
                                  ? "bg-primary-950/20 border-primary-900/30 text-white hover:bg-primary-950/30"
                                  : "bg-primary-50/50 border-primary-100/50 text-surface-800 hover:bg-primary-50/70"
                              }`}
                            >
                              <p className="text-xs leading-relaxed">
                                <span className="font-semibold text-primary-500 dark:text-primary-400">
                                  @{notif.sender?.username || "Someone"}
                                </span>{" "}
                                {notif.type === "comment" ? "commented on" : "replied to your comment on"}{" "}
                                <span className="font-semibold">"{notif.post?.title}"</span>:
                              </p>
                              <p className={`text-[11px] truncate mt-0.5 ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                                "{notif.comment?.text}"
                              </p>
                              <span className={`text-[9px] block mt-1 ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
                darkMode
                  ? "text-yellow-400 hover:bg-surface-800"
                  : "text-surface-500 hover:bg-surface-100"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5" />
              ) : (
                <HiOutlineMoon className="w-5 h-5" />
              )}
            </button>

            {/* User avatar + name link to Profile */}
            {user && (
              <Link
                to="/profile"
                className={`flex items-center gap-2 ml-0 sm:ml-1 px-1.5 sm:px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${
                  darkMode
                    ? "hover:bg-surface-800 text-surface-300 hover:text-white"
                    : "hover:bg-surface-100 text-surface-600 hover:text-surface-800"
                }`}
                title="View Profile"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    darkMode
                      ? "bg-primary-900/40 text-primary-400"
                      : "bg-primary-100 text-primary-700"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user.name}
                </span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
                darkMode
                  ? "text-surface-400 hover:text-red-400 hover:bg-surface-800"
                  : "text-surface-400 hover:text-red-500 hover:bg-red-50"
              }`}
              aria-label="Logout"
              title="Logout"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
