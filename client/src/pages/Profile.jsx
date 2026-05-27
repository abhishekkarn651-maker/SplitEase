import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineCheck,
} from "react-icons/hi2";

/**
 * Profile — User profile page.
 * Allows users to edit their details (Name, Username, Email)
 * and update their password with secure verification.
 */
export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { darkMode } = useApp();

  // Details state
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !username.trim() || !email.trim()) {
      setError("Please fill in all profile fields");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      setError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    // If new password is provided, validate
    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        setError("Please enter your current password to make security changes");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("New passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
    darkMode
      ? "bg-surface-850 border-surface-700 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
      : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
  }`;

  const usernameInputClasses = `w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
    darkMode
      ? "bg-surface-850 border-surface-700 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
      : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
  }`;

  return (
    <div className="max-w-2xl mx-auto animate-slide-up py-4 px-2">
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md ${
            darkMode
              ? "bg-primary-900/40 text-primary-400 border border-primary-800"
              : "bg-primary-100 text-primary-700"
          }`}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            {user?.name || "My Profile"}
          </h1>
          <p className={`text-sm ${darkMode ? "text-primary-400" : "text-primary-600"} font-medium`}>
            @{user?.username}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleUpdateProfile}
        className={`rounded-3xl p-6 md:p-8 space-y-6 ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white border border-surface-200 shadow-card"
        }`}
      >
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <h3
            className={`text-sm font-semibold uppercase tracking-wider ${
              darkMode ? "text-primary-400" : "text-primary-600"
            }`}
          >
            Personal Details
          </h3>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
              Full Name
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className={inputClasses}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className={usernameInputClasses}
                required
                maxLength={30}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClasses}
                required
              />
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className={darkMode ? "border-surface-700" : "border-surface-100"} />

        <div className="space-y-4">
          <div className="flex flex-col">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                darkMode ? "text-primary-400" : "text-primary-600"
              }`}
            >
              Security Settings
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Fill these fields only if you want to change your password.
            </p>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
              Current Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClasses}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* New Password & Confirm Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
                New Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={inputClasses}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-surface-300">
                Confirm New Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={inputClasses}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            "Saving Changes..."
          ) : (
            <>
              <HiOutlineCheck className="w-5 h-5" />
              Save Profile Details
            </>
          )}
        </button>
      </form>
    </div>
  );
}
