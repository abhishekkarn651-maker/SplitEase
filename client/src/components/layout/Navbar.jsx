import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

/**
 * Navbar — Top navigation bar.
 * Shows the app name, nav links, user info, dark mode toggle, and logout.
 */
export default function Navbar() {
  const { darkMode, toggleDarkMode } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to check if a nav link is active
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
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

            {/* User avatar + name */}
            {user && (
              <div className="flex items-center gap-2 ml-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    darkMode
                      ? "bg-primary-900/40 text-primary-400"
                      : "bg-primary-100 text-primary-700"
                  }`}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`hidden md:inline text-sm font-medium ${
                    darkMode ? "text-surface-300" : "text-surface-600"
                  }`}
                >
                  {user.name}
                </span>
              </div>
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
