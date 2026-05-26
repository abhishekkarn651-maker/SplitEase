import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useApp } from "../../context/AppContext";

/**
 * Layout — Wraps all pages with the Navbar and a consistent container.
 * Uses <Outlet /> from React Router to render child routes.
 */
export default function Layout() {
  const { darkMode } = useApp();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-surface-900 text-surface-100" : "bg-surface-50 text-surface-800"
      }`}
    >
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
