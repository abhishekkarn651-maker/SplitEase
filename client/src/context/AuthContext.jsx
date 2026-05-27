import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import * as api from "../api/axios";

/**
 * ========================================
 * AUTH CONTEXT — Authentication State
 * ========================================
 *
 * Manages: user, token, authLoading
 *
 * Provides: signup, login, logout, and
 * automatic token validation on mount.
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("splitease-token"));
  const [authLoading, setAuthLoading] = useState(true); // True during initial validation

  /**
   * On mount: If a token exists in localStorage, validate it by
   * calling /api/auth/me. If valid → populate user. If invalid → clear.
   */
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("splitease-token");
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const { data } = await api.getMe();
        setUser(data.data);
        setToken(storedToken);
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem("splitease-token");
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    validateToken();
  }, []);

  /**
   * signup — Register a new user
   */
  const signup = useCallback(async (name, username, email, password) => {
    try {
      const { data } = await api.signupUser({ name, username, email, password });
      const { token: newToken, user: newUser } = data.data;

      localStorage.setItem("splitease-token", newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome, ${newUser.name}!`);
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      toast.error(msg);
      throw err;
    }
  }, []);

  /**
   * login — Authenticate an existing user
   */
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.loginUser({ email, password });
      const { token: newToken, user: newUser } = data.data;

      localStorage.setItem("splitease-token", newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome back, ${newUser.name}!`);
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      throw err;
    }
  }, []);

  /**
   * logout — Clear token and user state
   */
  const logout = useCallback(() => {
    localStorage.removeItem("splitease-token");
    setToken(null);
    setUser(null);
    toast.success("Logged out");
  }, []);

  /**
   * updateProfile — Update authenticated user profile details
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      const { data } = await api.updateProfile(profileData);
      const updatedUser = data.data;
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
      throw err;
    }
  }, []);

  const value = {
    user,
    token,
    authLoading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth() — Custom hook to access the AuthContext.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
