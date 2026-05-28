import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

/**
 * Login — Sign-in page.
 * Centered form with email + password fields.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 px-4 transition-colors duration-300">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Intro */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 rounded-2xl text-white font-bold text-lg mb-4 shadow-md shadow-primary-500/20 transform hover:scale-105 transition-transform duration-300">
            S
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
            Sign in to continue splitting with SplitEase
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-surface-800 rounded-3xl p-8 shadow-xl border border-surface-200/60 dark:border-surface-700/50 space-y-6 transition-all duration-300"
        >
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm px-4 py-3.5 rounded-2xl animate-scale-in">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wide uppercase text-surface-500 dark:text-surface-400">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-700/70 bg-transparent text-sm text-surface-800 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wide uppercase text-surface-500 dark:text-surface-400">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-11 py-3 rounded-2xl border border-surface-200 dark:border-surface-700/70 bg-transparent text-sm text-surface-800 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer transform active:scale-[0.98] flex items-center justify-center"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Signup link */}
          <p className="text-center text-xs text-surface-500 dark:text-surface-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-500 font-bold hover:text-primary-600 transition-colors"
            >
              Create free account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
