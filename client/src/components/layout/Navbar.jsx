import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
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
  const { darkMode, toggleDarkMode, pendingCount, pendingInvitations, loadPendingInvitations, loadPendingCount, acceptInvite, declineInvite, loadGroups } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for pending invitation count every 30 seconds
  useEffect(() => {
    if (user) {
      loadPendingCount();
      const interval = setInterval(loadPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadPendingCount]);

  // Load full invitations when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      loadPendingInvitations();
    }
  }, [showNotifications, loadPendingInvitations]);

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

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode
          ? "bg-surface-900/80 border-surface-700"
          : "bg-white/80 border-surface-200"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
              to="/groups"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  darkMode
                    ? "text-surface-300 hover:bg-surface-800"
                    : "text-surface-500 hover:bg-surface-100"
                }`}
                aria-label="Notifications"
              >
                <HiOutlineBellAlert className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-sm">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border shadow-modal animate-scale-in z-50 ${
                    darkMode
                      ? "bg-surface-800 border-surface-700"
                      : "bg-white border-surface-200"
                  }`}
                >
                  <div className={`px-4 py-3 border-b ${darkMode ? "border-surface-700" : "border-surface-100"}`}>
                    <h3 className={`text-sm font-semibold ${darkMode ? "text-white" : "text-surface-800"}`}>
                      Invitations
                    </h3>
                  </div>

                  {pendingInvitations.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                        No pending invitations
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {pendingInvitations.map((inv) => (
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
                            <div className="min-w-0 flex-1">
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
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
                className={`flex items-center gap-2 ml-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
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
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
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
